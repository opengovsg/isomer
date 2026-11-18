import type { SuperJSONResult } from "superjson"
import { TRPCError } from "@trpc/server"
import superjson from "superjson"

// superjson's `traverse` copies the parent path for every child and `setDeep`
// walks it, so work = sum of path depths; one deep key with many children is
// quadratic in payload size. At this cap the worst shape decodes in ~50ms.
// shortcut: no measurement of real page payloads yet; rejections are logged, raise if they fire.
export const MAX_ANNOTATION_PATH_SEGMENTS = 5_000_000
// Honest payloads nest 1-2 levels (Set/Map/Error); this keeps both this walk
// and superjson's recursive `traverse` far from the call-stack limit.
export const MAX_ANNOTATION_NESTING = 32

export class UnsafePayloadError extends Error {}

const reject = (reason: string): never => {
  throw new TRPCError({
    code: "BAD_REQUEST",
    message: `Unsupported request payload: ${reason}.`,
    cause: new UnsafePayloadError(reason),
  })
}

/**
 * Walks `meta.values` the way superjson's `traverse` does (a node is
 * `[annotation, children?]`; children, record or array, are iterated by key)
 * and rejects before superjson does any of the expensive work:
 * - "set"/"map": superjson rebuilds these in O(n²) (`getNthKey`); this app never receives them.
 * - total path segments over the cap: the deep-path × many-children blowup.
 * - nesting over the cap: a deep tree overflows the stack.
 */
const assertSafeAnnotations = (values: unknown) => {
  let budget = MAX_ANNOTATION_PATH_SEGMENTS

  const visitChildren = (
    children: unknown,
    depth: number,
    nesting: number,
  ): void => {
    if (!children || typeof children !== "object") return
    if (nesting > MAX_ANNOTATION_NESTING) {
      reject("annotations are nested too deeply")
    }
    for (const [key, child] of Object.entries(children)) {
      // Count dots without `split`, which would allocate an attacker-sized
      // array first. Escaped dots overcount, which only errs towards rejecting.
      let childDepth = depth + 1
      for (let i = 0; i < key.length; i++) {
        if (key.charCodeAt(i) === 46) childDepth++
      }
      budget -= childDepth
      if (budget < 0) {
        reject("annotation paths exceed the size limit")
      }
      visit(child, childDepth, nesting + 1)
    }
  }

  const visit = (tree: unknown, depth: number, nesting: number): void => {
    if (!Array.isArray(tree)) return visitChildren(tree, depth, nesting)
    const [annotation, children] = tree as [unknown, unknown]
    if (annotation === "set" || annotation === "map") {
      reject("Set and Map are not supported")
    }
    visitChildren(children, depth, nesting)
  }

  visit(values, 0, 0)
}

export const safeSuperjson = {
  serialize: superjson.serialize,
  deserialize: (payload: SuperJSONResult) => {
    assertSafeAnnotations(payload?.meta?.values)
    return superjson.deserialize(payload)
  },
}
