import postcss from "postcss"
import { renderToStaticMarkup } from "react-dom/server"
import tailwindcss from "tailwindcss"
import { describe, expect, it } from "vitest"

import { renderComponent } from "../engine/renderComponent"
import { renderLayout } from "../engine/renderLayout"
import { createNextPreset } from "../presets/next"
import { isomerSiteTheme } from "../presets/next/site-theme"
import { createThemePreset } from "../presets/theme"
import { generateSiteConfig } from "../stories/helpers/generateSiteConfig"
import { getTheme, getPublishableTheme, type IsomerTheme } from "./index"

const infopic = {
  type: "infopic",
  id: "details",
  title: "Our services",
  description: "Same content in every theme",
  imageSrc: "/photo.jpg",
  imageAlt: "Our team",
  buttonLabel: "Find out more",
  buttonUrl: "/services",
} as const

describe("theme selection", () => {
  it("defaults existing sites to Next and rejects unknown or unpublished themes", () => {
    expect(getTheme()).toBe("isomer-next")
    expect(getPublishableTheme("isomer-next")).toBe("isomer-next")
    for (const id of ["typo", "__proto__", "constructor", null, ""]) {
      expect(() => getTheme(id)).toThrow("Unknown Isomer theme")
    }
    expect(() => getPublishableTheme("isomer-classic")).toThrow(
      "development reference",
    )
  })

  it.each<IsomerTheme>(["isomer-next", "isomer-classic"])(
    "preserves content and presentation props in %s",
    (theme) => {
      const component = { ...infopic, isTextOnRight: true }
      const html = renderToStaticMarkup(
        renderComponent({
          component,
          site: generateSiteConfig({
            theme,
            assetsBaseUrl: "https://assets.example",
          }),
          layout: "homepage",
          permalink: "/",
          headingLevel: 2,
          shouldLazyLoad: true,
        }),
      )
      expect(html).toContain('id="details"')
      expect(html).toContain("<h2")
      expect(html).toContain(infopic.title)
      expect(html).toContain(infopic.description)
      expect(html).toContain('href="/services"')
      expect(html).toContain('src="https://assets.example/photo.jpg"')
      expect(html).toContain('alt="Our team"')
      expect(html).toContain('loading="lazy"')
      expect(html).toContain(
        theme === "isomer-classic" ? "md:order-2" : "img_content",
      )
    },
  )

  it("uses Classic overrides inside an inherited layout and inherits other blocks and variants", () => {
    const site = generateSiteConfig({
      theme: "isomer-classic",
      isGovernment: false,
    })
    const html = renderToStaticMarkup(
      renderLayout({
        layout: "homepage",
        site,
        page: { title: "Home", permalink: "/", lastModified: "2026-01-01" },
        content: [
          { ...infopic },
          {
            type: "blockquote",
            quote: "Inherited content",
            source: "A source",
          },
        ],
      }),
    )
    expect(html).toContain("text-site-secondary")
    expect(html).toContain("Inherited content")
    const full = renderToStaticMarkup(
      renderComponent({
        component: { ...infopic, variant: "full" },
        site,
        layout: "homepage",
        permalink: "/",
        headingLevel: 2,
      }),
    )
    expect(full).toContain("background-image:")
    expect(full).toContain(infopic.description)
    expect(full).toContain('href="/services"')
  })

  it("compiles isolated styles, preserves Next utilities and applies the same site palette", async () => {
    const content = [
      { raw: "font-sans bg-site-primary prose-display-sm", extension: "html" },
    ]
    const utilities = async (preset: ReturnType<typeof createThemePreset>) =>
      (
        await postcss([tailwindcss({ content, presets: [preset] })]).process(
          "@tailwind utilities;",
          { from: undefined },
        )
      ).css
    expect(await utilities(createThemePreset("isomer-next"))).toBe(
      await utilities(createNextPreset()),
    )
    const next = await utilities(createThemePreset("isomer-next"))
    const classic = await utilities(createThemePreset("isomer-classic"))
    expect(next).toContain('var(--font-inter, "Inter")')
    expect(classic).toContain("Lato")
    expect(classic).not.toContain("--font-inter")
    const colors = {
      canvas: {
        default: "#112233",
        alt: "#223344",
        backdrop: "#334455",
        inverse: "#445566",
      },
      interaction: { default: "#556677", hover: "#667788", pressed: "#778899" },
    }
    for (const theme of ["isomer-next", "isomer-classic"] as const) {
      const { root } = await postcss([
        tailwindcss({
          content,
          presets: [createThemePreset(theme)],
          plugins: [isomerSiteTheme({ colors })],
        }),
      ]).process("@tailwind base; @tailwind utilities;", { from: undefined })
      const values: string[] = []
      root.walkDecls("--color-brand-canvas-inverse", (decl) => {
        values.push(decl.value)
      })
      expect(values.at(-1)).toBe(colors.canvas.inverse)
    }
  })
})
