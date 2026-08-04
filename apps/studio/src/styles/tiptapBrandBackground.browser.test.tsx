// TipTap table cell backgrounds must match packages/components Table:
// unset header → base-canvas-backdrop, unset body → base-canvas-alt;
// brand.canvas.inverse resolves via site-theme CSS var with light text.
import "~/styles/tiptap.scss"
import { afterEach, describe, expect, it } from "vitest"

// Mirrors Tailwind `bg-base-canvas-backdrop` / `bg-base-canvas-alt` from
// packages/components Table cell defaults (preview-tw.css).
const BASE_CANVAS_BACKDROP = "rgb(243, 244, 246)"
const BASE_CANVAS_ALT = "rgb(249, 250, 251)"

describe("tiptap default table cell backgrounds", () => {
  afterEach(() => {
    document.body.replaceChildren()
  })

  it("uses base-canvas-backdrop on header cells with no colour set", () => {
    const root = document.createElement("div")
    root.className = "tiptap"
    root.innerHTML = `
      <table>
        <tr>
          <th>Header</th>
        </tr>
      </table>
    `
    document.body.appendChild(root)

    expect(getComputedStyle(root.querySelector("th")!).backgroundColor).toBe(
      BASE_CANVAS_BACKDROP,
    )
  })

  it("uses base-canvas-alt on body cells with no colour set", () => {
    const root = document.createElement("div")
    root.className = "tiptap"
    root.innerHTML = `
      <table>
        <tr>
          <td>Cell</td>
        </tr>
      </table>
    `
    document.body.appendChild(root)

    expect(getComputedStyle(root.querySelector("td")!).backgroundColor).toBe(
      BASE_CANVAS_ALT,
    )
  })
})

describe("tiptap brand.canvas.inverse cell styles", () => {
  afterEach(() => {
    document.body.replaceChildren()
    document.documentElement.style.removeProperty(
      "--color-brand-canvas-inverse",
    )
  })

  it("paints brand.canvas.inverse background and light text on header cells", () => {
    document.documentElement.style.setProperty(
      "--color-brand-canvas-inverse",
      "#123456",
    )

    const root = document.createElement("div")
    root.className = "tiptap"
    root.innerHTML = `
      <table>
        <tr>
          <th data-background-color="brand.canvas.inverse">Header</th>
        </tr>
      </table>
    `
    document.body.appendChild(root)

    const th = root.querySelector("th")!
    expect(getComputedStyle(th).backgroundColor).toBe("rgb(18, 52, 86)")
    expect(getComputedStyle(th).color).toBe("rgb(255, 255, 255)")
  })

  it("paints brand.canvas.inverse background on body cells", () => {
    document.documentElement.style.setProperty(
      "--color-brand-canvas-inverse",
      "#123456",
    )

    const root = document.createElement("div")
    root.className = "tiptap"
    root.innerHTML = `
      <table>
        <tr>
          <td data-background-color="brand.canvas.inverse">Cell</td>
        </tr>
      </table>
    `
    document.body.appendChild(root)

    const td = root.querySelector("td")!
    expect(getComputedStyle(td).backgroundColor).toBe("rgb(18, 52, 86)")
    expect(getComputedStyle(td).color).toBe("rgb(255, 255, 255)")
  })
})
