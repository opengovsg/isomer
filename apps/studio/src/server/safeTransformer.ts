import type { SuperJSONResult } from "superjson"
import { TRPCError } from "@trpc/server"
import superjson from "superjson"

// superjson's `traverse` copies the parent path for every child and `setDeep`
// walks it, so work = sum of path depths; one deep key with many children is
// quadratic in payload size. At this cap a deep-path shape decodes in ~50ms,
// many short paths in ~300ms.
// shortcut: no measurement of real page payloads yet; rejections are logged, raise if they fire.
export const MAX_ANNOTATION_PATH_SEGMENTS = 5_000_000
// Honest payloads are flat (dotted keys); this keeps both this walk
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

// The only annotations Studio inputs produce. Others are costly to rebuild
// (Set/Map are O(n²) via `getNthKey`, bigint is quadratic in digits) or unused.
const ALLOWED_ANNOTATIONS = new Set(["undefined", "Date", "number"])

/**
 * Walks `meta.values` the way superjson's `traverse` does (a node is
 * `[annotation, children?]` or a record of children) and rejects before
 * superjson does any of the expensive work:
 * - annotations outside the allowlist, and any other node shape (superjson
 *   recurses forever on a string leaf via `Object.entries`).
 * - total path segments over the cap: the deep-path × many-children blowup.
 * - nesting over the cap: a deep tree overflows the stack.
 */
const assertSafeAnnotations = (values: unknown) => {
  let budget = MAX_ANNOTATION_PATH_SEGMENTS

  const visitChildren = (
    children: Record<string, unknown>,
    depth: number,
    nesting: number,
  ): void => {
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

  const isRecord = (node: unknown): node is Record<string, unknown> =>
    typeof node === "object" && node !== null && !Array.isArray(node)

  const visit = (node: unknown, depth: number, nesting: number): void => {
    if (isRecord(node)) return visitChildren(node, depth, nesting)
    if (!Array.isArray(node)) return reject("malformed annotations")
    const [annotation, children] = node as [unknown, unknown]
    if (typeof annotation !== "string") return reject("malformed annotations")
    if (!ALLOWED_ANNOTATIONS.has(annotation)) {
      return reject(`unsupported type "${annotation.slice(0, 20)}"`)
    }
    if (children === undefined) return
    if (!isRecord(children)) return reject("malformed annotations")
    visitChildren(children, depth, nesting)
  }

  // superjson skips falsy `values` (no annotations).
  if (values) visit(values, 0, 0)
}

export const safeSuperjson = {
  serialize: superjson.serialize,
  deserialize: (payload: SuperJSONResult) => {
    assertSafeAnnotations(payload?.meta?.values)
    return superjson.deserialize(payload)
  },
}
