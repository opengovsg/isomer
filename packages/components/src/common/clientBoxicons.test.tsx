import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import {
  BiCheck,
  BiClipboardCheck,
  BiError,
  BiMegaphone,
} from "./clientBoxicons"

describe("clientBoxicons", () => {
  it("renders the shared wrapper and forwards props", () => {
    // Act
    const html = renderToStaticMarkup(
      <BiCheck className="text-base" aria-hidden />,
    )

    // Assert
    expect(html).toContain('stroke="currentColor"')
    expect(html).toContain('fill="currentColor"')
    expect(html).toContain('stroke-width="0"')
    expect(html).toContain('viewBox="0 0 24 24"')
    expect(html).toContain('height="1em"')
    expect(html).toContain('width="1em"')
    expect(html).toContain('class="text-base"')
    expect(html).toContain('aria-hidden="true"')
    expect(html).toContain(
      'd="m10 15.586-3.293-3.293-1.414 1.414L10 18.414l9.707-9.707-1.414-1.414z"',
    )
    expect(BiCheck.displayName).toBe("BiCheck")
  })

  it("keeps path order for icons with more than one path", () => {
    // Act
    const html = renderToStaticMarkup(<BiError />)

    // Assert
    const first = html.indexOf('d="M11.001 10h2v5h-2zM11 16h2v2h-2z"')
    const second = html.indexOf('d="M13.768 4.2')
    expect(first).toBeGreaterThan(-1)
    expect(second).toBeGreaterThan(first)
  })

  it("keeps the shorter svg attributes on the two handwritten icons", () => {
    // Act
    const clipboard = renderToStaticMarkup(<BiClipboardCheck />)
    const megaphone = renderToStaticMarkup(<BiMegaphone />)

    // Assert
    for (const html of [clipboard, megaphone]) {
      expect(html).toContain('fill="currentColor"')
      expect(html).toContain('viewBox="0 0 24 24"')
      expect(html).not.toContain("stroke-width")
      expect(html).not.toContain('height="1em"')
    }
    expect(clipboard.match(/<path /g)).toHaveLength(2)
    expect(megaphone.match(/<path /g)).toHaveLength(1)
  })
})
