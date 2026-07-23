#!/usr/bin/env node
// Prepends the PR diff-breakdown block to a PR's description, replacing any
// block a previous run already inserted (matched via the
// <!-- pr-diff-breakdown:start/end --> markers) so re-runs on later pushes
// update in place instead of stacking a copy per push.
//
// Usage: node update-pr-description.mjs <current-body-file> <block-file>
// Prints the new full PR body to stdout.

import { readFileSync } from "node:fs"

const [, , currentBodyPath, blockPath] = process.argv
if (!currentBodyPath || !blockPath) {
  throw new Error(
    "Usage: update-pr-description.mjs <current-body-file> <block-file>",
  )
}

const currentBody = readFileSync(currentBodyPath, "utf8")
const block = readFileSync(blockPath, "utf8").trim()

const EXISTING_BLOCK_RE =
  /<!-- pr-diff-breakdown:start -->[\s\S]*?<!-- pr-diff-breakdown:end -->\n?/

const rest = currentBody.replace(EXISTING_BLOCK_RE, "").replace(/^\s+/, "")

process.stdout.write(rest ? `${block}\n\n${rest}` : `${block}\n`)
