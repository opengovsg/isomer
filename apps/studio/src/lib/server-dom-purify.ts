import { createRequire } from "node:module"

// jsdom and isomorphic-dompurify pull in an ESM-only transitive chain
// (jsdom → html-encoding-sniffer → @exodus/bytes). Importing them at the top
// level loads that chain whenever the importing module is evaluated. On the
// Vercel/Turbopack runtime that eager external load crashes (ERR_REQUIRE_ESM).
// Load them lazily via a native require so the work happens only on first use.
const nodeRequire = createRequire(import.meta.url)

interface JsdomExports {
  JSDOM: new (html?: string) => { window: Window & typeof globalThis }
}

export interface DomPurifyLib {
  sanitize: (
    dirty: string,
    cfg?: {
      USE_PROFILES?: { svg?: boolean; svgFilters?: boolean }
      FORBID_TAGS?: string[]
      FORBID_ATTR?: string[]
    },
  ) => string
}

export interface ServerDomPurify {
  DOMParser: typeof globalThis.DOMParser
  DOMPurify: DomPurifyLib
}

const initServerDomPurify = (): ServerDomPurify => {
  const { JSDOM } = nodeRequire("jsdom") as JsdomExports
  const DOMPurify = (
    nodeRequire("isomorphic-dompurify") as { default: DomPurifyLib }
  ).default
  const { DOMParser } = new JSDOM("").window
  return { DOMParser, DOMPurify }
}

let serverDomPurify: ServerDomPurify | undefined

export const getServerDomPurify = (): ServerDomPurify =>
  (serverDomPurify ??= initServerDomPurify())
