// Observability foundation (M01). Dependency-free, env-flagged seams for
// error monitoring (Sentry) and product analytics (PostHog). No-op when
// the relevant env vars are unset. See docs/observability/README.md.
export {
  isSentryEnabled,
  captureException,
  captureMessage,
} from './sentry'
export {
  isAnalyticsEnabled,
  sanitizeProps,
  captureEvent,
} from './analytics'
