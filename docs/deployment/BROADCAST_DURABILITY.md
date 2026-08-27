# Broadcast durability — decision (M07C)

**Decision: retain the current resumable broadcast mechanism. Do NOT add an
auto-resume cron or a queue in M07C.** Defer any scheduled recovery until
production evidence shows campaigns are actually being stranded by
serverless function-duration limits.

## Current posture (reviewed, no change)

- Broadcast fan-out runs in `after()` and each route declares an explicit
  `export const maxDuration` — `/api/whatsapp/broadcast/[id]/resume` = 300s,
  the inbound webhook and `/api/v1/broadcasts` = 60s. On Vercel these map to
  the function timeout (300s requires Pro+).
- **Recovery already exists:** migration `038_broadcast_resume` + the
  `/api/whatsapp/broadcast/[id]/resume` endpoint + `src/lib/whatsapp/
  broadcast-resume.ts`. A fan-out that exceeds one function's timeout leaves
  the broadcast in a resumable state rather than losing recipients — a
  partially-sent campaign can be continued from where it stopped.
- That path is covered by unit tests (`broadcast-resume.test.ts`,
  `broadcast-core.test.ts`), which stayed green through M07B's DB
  validation. **No correctness bug was found in the resume mechanism.**

## Why not a cron / queue now

- There is **no production evidence** yet that real campaigns exceed
  `maxDuration` — adding scheduled recovery or a queue would be
  speculative complexity against an unmeasured problem.
- The existing resume mechanism already makes a stalled broadcast
  *recoverable*; the only thing missing is *automatic* recovery, which
  matters only once we observe strandings at scale.
- A queue/architecture rewrite is explicitly out of scope (M01/M07C
  guardrails) and is the highest-risk option for the least-proven need.

## Future lowest-risk option (when evidence warrants)

A **thin scheduled auto-resume cron** — a Vercel Cron job that periodically
finds broadcasts stuck in `sending` past a threshold and calls the existing
resume endpoint. It reuses the mechanism already built and tested; it is
**not** a rewrite of the send system. Trigger to implement it: production
metrics (or Sentry, now wired in M07C) showing broadcasts repeatedly
stalling on the function timeout.

## Revisit criteria

- Sentry/logs show broadcast fan-out repeatedly hitting `maxDuration`, or
- customers report campaigns that stop partway and aren't auto-continued.

Until then: **status quo — resumable, manually/poll-recoverable, no cron.**
