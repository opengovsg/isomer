// Contract for brand header fills in the TipTap editor. Studio injects
// `--color-brand-canvas-inverse` from the site theme; tiptap.scss must paint
// that token as the cell background (with light text for contrast).
import "~/styles/tiptap.scss"
import { afterEach, describe, expect, it } from "vitest"

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
