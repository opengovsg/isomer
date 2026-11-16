import { TRPCError } from "@trpc/server"
import superjson from "superjson"

/**
 * superjson deserialises Set/Map in O(n²) (per-entry `getNthKey` path walk), a
 * no-auth DoS: ~20k shared-reference entries (<1MB, under the body limit) block
 * the event loop ~1s. Upstream won't fix. This app never receives Set/Map as
 * tRPC input, so we reject any payload that declares one before superjson runs.
 *
 * shortcut: assumes no tRPC input uses Set/Map; revisit if a schema ever adds one.
 */
const metaDeclaresSetOrMap = (tree: unknown): boolean => {
  if (!tree || typeof tree !== "object") return false
  if (Array.isArray(tree)) {
    // A superjson annotation node is [typeAnnotation, children?].
    const [annotation, children] = tree as [unknown, unknown]
    if (annotation === "set" || annotation === "map") return true
    return metaDeclaresSetOrMap(children)
  }
  // Otherwise a record of child nodes keyed by path segment.
  return Object.values(tree).some(metaDeclaresSetOrMap)
}

export const safeSuperjson = {
  serialize: superjson.serialize.bind(superjson),
  deserialize: (payload: unknown) => {
    const meta = (payload as { meta?: { values?: unknown } } | null)?.meta
    if (metaDeclaresSetOrMap(meta?.values)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Set and Map are not supported in request payloads.",
      })
    }
    return superjson.deserialize(payload as Parameters<typeof superjson.deserialize>[0])
  },
}
