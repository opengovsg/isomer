import type {
  IsomerComponent,
  IsomerSchema,
} from "@opengovsg/isomer-components"
import { describe, expect, it } from "vitest"

import {
  backfillBlockquoteStyle,
  backfillBlockquoteStyleInContent,
} from "./helpers"

const makeSchema = (content: IsomerComponent[]): IsomerSchema =>
  ({
    version: "0.1.0",
    layout: "content",
    page: { title: "Test page" },
    content,
  }) as unknown as IsomerSchema

describe("backfillBlockquoteStyle", () => {
  it("leaves non-blockquote blocks untouched", () => {
    const component = {
      type: "prose",
      content: [],
    } as unknown as IsomerComponent

    const result = backfillBlockquoteStyle(component)

    expect(result.changed).toBe(false)
    expect(result.component).toBe(component)
  })

  it("sets the image style when an image is present", () => {
    const component = {
      type: "blockquote",
      quote: "A quote",
      source: "A source",
      imageSrc: "/some-image.png",
      imageAlt: "A descriptive alt text",
    } as unknown as IsomerComponent

    const result = backfillBlockquoteStyle(component)

    expect(result.changed).toBe(true)
    expect(result.component).toEqual({
      type: "blockquote",
      style: "image",
      quote: "A quote",
      source: "A source",
      imageSrc: "/some-image.png",
      imageAlt: "A descriptive alt text",
    })
  })

  it("sets the imageless style and strips dangling image fields when there is no image", () => {
    const component = {
      type: "blockquote",
      quote: "A quote",
      source: "A source",
      // A placeholder alt text left behind without an actual image.
      imageAlt: "Enter a descriptive alt text.",
    } as unknown as IsomerComponent

    const result = backfillBlockquoteStyle(component)

    expect(result.changed).toBe(true)
    expect(result.component).toEqual({
      type: "blockquote",
      style: "imageless",
      quote: "A quote",
      source: "A source",
    })
  })

  it("treats an empty imageSrc as having no image", () => {
    const component = {
      type: "blockquote",
      quote: "A quote",
      source: "A source",
      imageSrc: "   ",
      imageAlt: "Placeholder",
    } as unknown as IsomerComponent

    const result = backfillBlockquoteStyle(component)

    expect(result.changed).toBe(true)
    expect(result.component).toEqual({
      type: "blockquote",
      style: "imageless",
      quote: "A quote",
      source: "A source",
    })
  })

  it("is idempotent for already-migrated blockquotes", () => {
    const withImage = {
      type: "blockquote",
      style: "image",
      quote: "A quote",
      source: "A source",
      imageSrc: "/some-image.png",
      imageAlt: "A descriptive alt text",
    } as unknown as IsomerComponent
    const imageless = {
      type: "blockquote",
      style: "imageless",
      quote: "A quote",
      source: "A source",
    } as unknown as IsomerComponent

    expect(backfillBlockquoteStyle(withImage).changed).toBe(false)
    expect(backfillBlockquoteStyle(imageless).changed).toBe(false)
  })
})

describe("backfillBlockquoteStyleInContent", () => {
  it("returns the same schema reference when nothing changes", () => {
    const schema = makeSchema([
      { type: "prose", content: [] } as unknown as IsomerComponent,
      {
        type: "blockquote",
        style: "imageless",
        quote: "A quote",
        source: "A source",
      } as unknown as IsomerComponent,
    ])

    const result = backfillBlockquoteStyleInContent(schema)

    expect(result.changed).toBe(false)
    expect(result.schema).toBe(schema)
  })

  it("migrates every blockquote in the content", () => {
    const schema = makeSchema([
      {
        type: "blockquote",
        quote: "First",
        source: "Source",
        imageSrc: "/image.png",
        imageAlt: "Alt",
      } as unknown as IsomerComponent,
      { type: "prose", content: [] } as unknown as IsomerComponent,
      {
        type: "blockquote",
        quote: "Second",
        source: "Source",
      } as unknown as IsomerComponent,
    ])

    const result = backfillBlockquoteStyleInContent(schema)

    expect(result.changed).toBe(true)
    expect(result.schema.content[0]).toMatchObject({ style: "image" })
    expect(result.schema.content[2]).toMatchObject({ style: "imageless" })
  })
})
