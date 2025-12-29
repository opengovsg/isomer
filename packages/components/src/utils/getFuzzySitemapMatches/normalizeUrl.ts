import { flow, trim } from "lodash-es"

export const normalizePermalink = (permalink: string) =>
  (
    flow(
      extractPathname,
      decodeUrl,
      (p: string) => trim(p, "/"),
      removeFileExtension,
      removeDelimiters,
      (p: string) => p.toLowerCase(),
      removeStopWords,
      cleanupSegments,
    ) as (input: string) => string
  )(permalink)

const extractPathname = (path: string) => {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    try {
      return new URL(path).pathname
    } catch {
      return path
    }
  }
  return path
}

const decodeUrl = (path: string) => {
  try {
    return decodeURIComponent(path)
  } catch {
    return path
  }
}

const removeFileExtension = (path: string) =>
  path.replace(/\.[a-zA-Z0-9]+$/, "")

const removeDelimiters = (path: string) =>
  path.replace(/[-_]+/g, " ")

// Common filler words that are often dropped during URL restructuring
const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "and",
  "or",
  "of",
  "to",
  "for",
  "in",
  "on",
  "at",
  "by",
  "with",
])

const removeStopWords = (path: string) =>
  path
    .split("/")
    .map((segment) =>
      segment
        .split(" ")
        .filter((word) => !STOP_WORDS.has(word))
        .join(" "),
    )
    .join("/")

const cleanupSegments = (path: string) =>
  path
    .split("/")
    .map((segment) => segment.split(" ").filter(Boolean).join(" "))
    .filter(Boolean)
    .join("/")

