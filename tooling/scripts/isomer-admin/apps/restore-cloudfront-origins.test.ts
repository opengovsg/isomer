import assert from "node:assert/strict"
import { test } from "node:test"

import { planRestore } from "./restore-cloudfront-origins"

void test("planRestore leaves an origin already on the latest build", () => {
  assert.deepEqual(planRestore("moh-corp", "/moh-corp/42/latest", 42), {
    action: "none",
    target: "/moh-corp/42/latest",
  })
})

void test("planRestore restores an origin on an older build", () => {
  assert.deepEqual(planRestore("moh-corp", "/moh-corp/40/latest", 42), {
    action: "restore",
    target: "/moh-corp/42/latest",
  })
})

void test("planRestore restores the bare path Pulumi writes", () => {
  assert.deepEqual(planRestore("moh-corp", "/moh-corp/latest", 42), {
    action: "restore",
    target: "/moh-corp/42/latest",
  })
})

void test("planRestore restores an origin pointing at another site", () => {
  assert.deepEqual(planRestore("moh-corp", "/stb-corp/99/latest", 42), {
    action: "restore",
    target: "/moh-corp/42/latest",
  })
})

void test("planRestore skips an origin ahead of the last successful build", () => {
  assert.equal(
    planRestore("moh-corp", "/moh-corp/43/latest", 42).action,
    "skip",
  )
})
