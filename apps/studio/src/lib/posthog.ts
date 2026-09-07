import type PostHogInstance from "posthog-js"

interface PosthogModule {
  default: typeof PostHogInstance
}

let loadPosthogModule: () => Promise<PosthogModule> =  async () => import("posthog-js")

let queue: Promise<void> = Promise.resolve()

/** @internal Injects a posthog-js module loader for unit tests. */
export const setPosthogModuleLoaderForTests = (
  loader: () => Promise<PosthogModule>,
) => {
  loadPosthogModule = loader
}

/** @internal Restores the default posthog-js module loader after unit tests. */
export const resetPosthogModuleLoaderForTests = () => {
  loadPosthogModule =  async () => import("posthog-js")
}

/**
 * Runs `fn` against the posthog-js client, strictly after every previously
 * queued call has finished. Each call loads posthog-js via its own dynamic
 * import (so this stays SSR-safe), but chaining onto a single shared queue
 * guarantees call order is preserved regardless of how long any individual
 * import takes to resolve — e.g. a logout's `reset()` can never run after a
 * later login's `identify()` just because its import happened to be slower.
 */
export const withPosthog =  async (fn: (posthog: typeof PostHogInstance) => void) => {
  queue = queue
    .then( async () => loadPosthogModule())
    .then(({ default: posthog }) => {
      fn(posthog)
    })
  return queue
}
