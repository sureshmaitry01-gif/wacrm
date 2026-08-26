import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __resetRateLimitForTests,
  checkRateLimit,
  checkRateLimitInMemory,
  isUpstashConfigured,
  rateLimitResponse,
} from "./rate-limit";

const OPTS = { limit: 3, windowMs: 60_000 };

// ============================================================
// In-memory backend (Upstash env unset → checkRateLimit uses it).
// ============================================================
describe("checkRateLimit (in-memory backend, no Upstash env)", () => {
  beforeEach(() => {
    __resetRateLimitForTests();
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it("permits the first request and decrements remaining", async () => {
    const result = await checkRateLimit("user:1", OPTS);
    expect(result).toMatchObject({ success: true, remaining: 2, limit: 3 });
    expect(result.reset).toBeGreaterThan(Date.now());
  });

  it("permits exactly `limit` requests then rejects the next", async () => {
    expect((await checkRateLimit("user:1", OPTS)).success).toBe(true);
    expect((await checkRateLimit("user:1", OPTS)).success).toBe(true);
    expect((await checkRateLimit("user:1", OPTS)).success).toBe(true);
    const over = await checkRateLimit("user:1", OPTS);
    expect(over.success).toBe(false);
    expect(over.remaining).toBe(0);
  });

  it("keeps separate counters per key", async () => {
    await checkRateLimit("user:1", OPTS);
    await checkRateLimit("user:1", OPTS);
    await checkRateLimit("user:1", OPTS);
    const other = await checkRateLimit("user:2", OPTS);
    expect(other.success).toBe(true);
    expect(other.remaining).toBe(2);
  });
});

// ============================================================
// In-memory backend, synchronous — deterministic window rollover.
// (Fake timers + a sync surface keep the assertion tight.)
// ============================================================
describe("checkRateLimitInMemory window rollover", () => {
  beforeEach(() => __resetRateLimitForTests());

  it("opens a fresh window after `windowMs` elapses", () => {
    vi.useFakeTimers();
    try {
      const t0 = new Date("2026-05-01T00:00:00Z").getTime();
      vi.setSystemTime(t0);
      __resetRateLimitForTests();

      checkRateLimitInMemory("user:1", OPTS);
      checkRateLimitInMemory("user:1", OPTS);
      checkRateLimitInMemory("user:1", OPTS);
      expect(checkRateLimitInMemory("user:1", OPTS).success).toBe(false);

      // Jump just past the window.
      vi.setSystemTime(t0 + OPTS.windowMs + 1);
      const refreshed = checkRateLimitInMemory("user:1", OPTS);
      expect(refreshed.success).toBe(true);
      expect(refreshed.remaining).toBe(2);
    } finally {
      vi.useRealTimers();
    }
  });
});

// ============================================================
// Upstash backend (both env vars present → REST fetch is used).
// ============================================================
describe("checkRateLimit (Upstash backend)", () => {
  beforeEach(() => {
    __resetRateLimitForTests();
    process.env.UPSTASH_REDIS_REST_URL = "https://fake.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
  });
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it("isUpstashConfigured reflects the env vars", () => {
    expect(isUpstashConfigured()).toBe(true);
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    expect(isUpstashConfigured()).toBe(false);
  });

  it("maps the Redis INCR count to success/remaining", async () => {
    // Pipeline response shape: [{ result: <count> }, { result: 1 }].
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify([{ result: 1 }, { result: 1 }]), {
          status: 200,
        }),
      );

    const result = await checkRateLimit("user:x", OPTS);
    expect(result).toMatchObject({ success: true, remaining: 2, limit: 3 });
    expect(fetchMock).toHaveBeenCalledOnce();
    // Hits the Upstash pipeline endpoint with a bearer token.
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/pipeline");
    expect(
      (init?.headers as Record<string, string>).Authorization,
    ).toBe("Bearer test-token");
  });

  it("rejects when the Redis count exceeds the limit", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([{ result: 4 }, { result: 1 }]), {
        status: 200,
      }),
    );
    const result = await checkRateLimit("user:x", OPTS);
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("fails open to the in-memory backend when Upstash errors", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));
    // Should not throw; falls back to in-memory (first call succeeds).
    const result = await checkRateLimit("user:fallback", OPTS);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("fails open when Upstash returns a non-200", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("upstream error", { status: 500 }),
    );
    const result = await checkRateLimit("user:fallback2", OPTS);
    expect(result.success).toBe(true);
  });
});

describe("rateLimitResponse", () => {
  it("returns a 429 with retry / X-RateLimit headers", async () => {
    const reset = Date.now() + 30_000;
    const res = rateLimitResponse({
      success: false,
      remaining: 0,
      reset,
      limit: 60,
    });
    expect(res.status).toBe(429);
    expect(res.headers.get("X-RateLimit-Limit")).toBe("60");
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("0");
    expect(Number(res.headers.get("Retry-After"))).toBeGreaterThan(0);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/rate limit/i);
  });

  it("clamps Retry-After to a minimum of 1 second", () => {
    // Reset already in the past — the ceiling math would otherwise give 0.
    const res = rateLimitResponse({
      success: false,
      remaining: 0,
      reset: Date.now() - 5_000,
      limit: 10,
    });
    expect(Number(res.headers.get("Retry-After"))).toBeGreaterThanOrEqual(1);
  });
});

describe("RATE_LIMITS presets", () => {
  it("send and broadcast are budgeted per minute", async () => {
    __resetRateLimitForTests();
    // Importing here so the presets stay close to their assertions.
    const { RATE_LIMITS } = await import("./rate-limit");
    expect(RATE_LIMITS.send.windowMs).toBe(60_000);
    expect(RATE_LIMITS.broadcast.windowMs).toBe(60_000);
  });

  it("the broadcast budget carries a campaign's per-batch call pattern", async () => {
    __resetRateLimitForTests();
    const { RATE_LIMITS } = await import("./rate-limit");
    // A campaign is NOT one call: the wizard posts a batch of 10
    // recipients roughly every 1–2 s, so it needs ~45+ calls of headroom
    // per minute. Sized below that, every batch past the cap comes back
    // 429 and its recipients are written off as failed (issue #472).
    expect(RATE_LIMITS.broadcast.limit).toBeGreaterThanOrEqual(45);
  });
});

afterEach(() => {
  __resetRateLimitForTests();
});
