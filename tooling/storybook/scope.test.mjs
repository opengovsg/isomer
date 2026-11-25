import assert from "node:assert/strict"
import { test } from "node:test"

import {
  addsNewTokens,
  affectedBase,
  previewImports,
  requiresFullRun,
} from "./scope.mjs"

const change = (path, status = "M") => ({ path, status })
const project = "packages/components"

test("only project source and docs changes can use affected-story selection", () => {
  // Arrange / Act / Assert
  assert.equal(
    requiresFullRun(
      [
        change(
          `${project}/src/templates/next/components/internal/Navbar/Navbar.tsx`,
        ),
        change(
          `${project}/src/templates/next/components/internal/Navbar/Navbar.stories.tsx`,
        ),
        change(`${project}/src/utils/new.ts`, "A"),
        change("docs/ai-workflow.md"),
        change("README.md"),
      ],
      project,
    ),
    false,
  )
  for (const path of [
    `${project}/.storybook/preview.tsx`,
    `${project}/tailwind.config.ts`,
    `${project}/package.json`,
    "tooling/storybook/viewports.ts",
    "pnpm-lock.yaml",
    ".github/workflows/argos.yml",
  ]) {
    assert.equal(requiresFullRun([change(path)], project), true, path)
  }
  for (const status of ["D", "T"]) {
    assert.equal(
      requiresFullRun([change(`${project}/src/a.tsx`, status)], project),
      true,
    )
  }
})

test("modules imported by the preview run every story", () => {
  // Arrange
  const preview = previewImports("apps/studio")

  // Assert
  assert(preview.length > 0)
  assert.equal(
    requiresFullRun(
      [change("apps/studio/src/theme/index.ts")],
      "apps/studio",
      preview,
    ),
    true,
  )
  assert.equal(
    requiresFullRun(
      [change("apps/studio/src/lib/growthbook.ts")],
      "apps/studio",
      preview,
    ),
    true,
  )
})

test("main selects the full suite and an empty diff adds no tokens", () => {
  // Arrange / Act / Assert
  assert.equal(affectedBase("", project), "")
  assert.equal(addsNewTokens([], "HEAD", project), false)
})
