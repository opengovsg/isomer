import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"

import { DESKTOP_VIEWPORT, resolveViewportSize } from "./viewport-size.mjs"

const options = {
  sm: { styles: { width: "480px", height: "100%" } },
  xl: { styles: { width: "1440px", height: "900px" } },
}

test("desktop fallback matches modes.ts", () => {
  // Arrange
  const modes = readFileSync(new URL("./modes.ts", import.meta.url), "utf8")

  // Act
  const desktop = modes.match(/desktop:\s*\{[^}]*viewport:\s*"([^"]+)"/)

  // Assert
  assert.equal(desktop?.[1], DESKTOP_VIEWPORT)
})

test("a viewport global resizes to that option", () => {
  // Arrange / Act
  const size = resolveViewportSize(
    { viewport: "sm" },
    { viewport: { options } },
  )

  // Assert
  assert.deepEqual(size, { width: 480, height: 720 })
})

test("no viewport global resets to desktop instead of keeping the previous size", () => {
  // Arrange / Act
  const size = resolveViewportSize({}, { viewport: { options } })

  // Assert
  assert.deepEqual(size, { width: 1440, height: 900 })
})

test("a viewport key with no width is left unchanged", () => {
  // Arrange / Act
  const size = resolveViewportSize(
    { viewport: "missing" },
    { viewport: { options } },
  )

  // Assert
  assert.equal(size, undefined)
})
