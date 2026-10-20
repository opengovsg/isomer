import type { ImageAdjustment } from "~/interfaces/complex/Image"
import { describe, expect, it } from "vitest"
import { buildImageTierRendering } from "~/utils/buildImageTierRendering"

const crop = { x: 0, y: 0, width: 1, height: 1 }

const base: ImageAdjustment = {
  crop,
  focal: { x: 0.5, y: 0.2 },
  rotate: 0,
  flipH: false,
  flipV: false,
  originalKey: "site/1/original.jpg",
}

describe("buildImageTierRendering", () => {
  it("returns null when there are no tiers", () => {
    expect(buildImageTierRendering("/site/1/base.webp", base, "")).toBeNull()
    expect(
      buildImageTierRendering("/site/1/base.webp", { ...base, tiers: [] }, ""),
    ).toBeNull()
    expect(
      buildImageTierRendering("/site/1/base.webp", undefined, ""),
    ).toBeNull()
  })

  it("orders <source>s largest min-width first and resolves URLs", () => {
    const adjustment: ImageAdjustment = {
      ...base,
      tiers: [
        {
          breakpoint: "md",
          crop,
          focal: { x: 0.5, y: 0.5 },
          src: "/site/1/md.webp",
        },
        {
          breakpoint: "lg",
          crop,
          focal: { x: 0.3, y: 0.4 },
          src: "/site/1/lg.webp",
        },
      ],
    }

    const result = buildImageTierRendering(
      "/site/1/base.webp",
      adjustment,
      "https://cdn.example",
    )

    expect(result).not.toBeNull()
    // lg (1024) before md (768)
    expect(result?.sources).toEqual([
      {
        media: "(min-width: 1024px)",
        srcSet: "https://cdn.example/site/1/lg.webp",
      },
      {
        media: "(min-width: 768px)",
        srcSet: "https://cdn.example/site/1/md.webp",
      },
    ])
  })

  it("emits the base focal then one ascending @media rule per tier", () => {
    const adjustment: ImageAdjustment = {
      ...base,
      tiers: [
        {
          breakpoint: "lg",
          crop,
          focal: { x: 0.3, y: 0.4 },
          src: "/site/1/lg.webp",
        },
        {
          breakpoint: "md",
          crop,
          focal: { x: 0.6, y: 0.1 },
          src: "/site/1/md.webp",
        },
      ],
    }

    const { focalClassName, focalCss } = buildImageTierRendering(
      "/site/1/base.webp",
      adjustment,
      "",
    )!

    // Base rule first (no media), then md before lg (ascending so the larger
    // active breakpoint wins by source order).
    expect(focalCss).toBe(
      `.${focalClassName}{object-position:50% 20%}` +
        `@media (min-width: 768px){.${focalClassName}{object-position:60% 10%}}` +
        `@media (min-width: 1024px){.${focalClassName}{object-position:30% 40%}}`,
    )
  })

  it("derives a deterministic class from the resolved base src", () => {
    const adjustment: ImageAdjustment = {
      ...base,
      tiers: [
        {
          breakpoint: "lg",
          crop,
          focal: { x: 0, y: 0 },
          src: "/site/1/lg.webp",
        },
      ],
    }
    const a = buildImageTierRendering("/site/1/base.webp", adjustment, "")
    const b = buildImageTierRendering("/site/1/base.webp", adjustment, "")
    const c = buildImageTierRendering("/site/1/other.webp", adjustment, "")

    expect(a?.focalClassName).toBe(b?.focalClassName)
    expect(a?.focalClassName).not.toBe(c?.focalClassName)
    expect(a?.focalClassName).toMatch(/^isomer-focal-[a-z0-9]+$/)
  })
})
