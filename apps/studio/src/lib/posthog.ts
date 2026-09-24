import type PostHogInstance from "posthog-js"

let queue: Promise<void> = Promise.resolve()

/**
 * Runs `fn` against the posthog-js client, strictly after every previously
 * queued call has finished. Each call loads posthog-js via its own dynamic
 * import (so this stays SSR-safe), but chaining onto a single shared queue
 * guarantees call order is preserved regardless of how long any individual
 * import takes to resolve — e.g. a logout's `reset()` can never run after a
 * later login's `identify()` just because its import happened to be slower.
 */
export const withPosthog = (fn: (posthog: typeof PostHogInstance) => void) => {
  queue = queue
    .then(() => import("posthog-js"))
    .then(({ default: posthog }) => {
      fn(posthog)
    })
  return queue
}
