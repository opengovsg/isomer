import type {
  IsomerComponent,
  IsomerSchema,
} from "@opengovsg/isomer-components"
import { BLOCKQUOTE_STYLE } from "@opengovsg/isomer-components"

// Legacy blockquotes predate the `style` control. They were stored as a flat
// object with an optional `imageSrc`/`imageAlt`, e.g.
//   { type: "blockquote", quote, source, imageSrc?, imageAlt? }
// This shape lets us read those fields off a blockquote regardless of whether
// it has already been migrated to the discriminated-union shape.
interface RawBlockquote {
  type: "blockquote"
  quote: string
  source: string
  style?: string
  imageSrc?: string
  imageAlt?: string
}

const isValidStyle = (style: string | undefined): boolean =>
  style === BLOCKQUOTE_STYLE.image || style === BLOCKQUOTE_STYLE.imageless

/**
 * Backfills the `style` discriminator on a single blockquote.
 *
 * - Already-migrated blockquotes (with a valid `style`) are left untouched so
 *   the script is idempotent.
 * - Blockquotes with an image become the "image" style.
 * - Blockquotes without an image become the "imageless" style, and any dangling
 *   `imageSrc`/`imageAlt` (e.g. a placeholder alt text) is stripped.
 */
export const backfillBlockquoteStyle = (
  component: IsomerComponent,
): { component: IsomerComponent; changed: boolean } => {
  if (component.type !== "blockquote") {
    return { component, changed: false }
  }

  const blockquote = component as RawBlockquote

  if (isValidStyle(blockquote.style)) {
    return { component, changed: false }
  }

  const hasImage =
    typeof blockquote.imageSrc === "string" && blockquote.imageSrc.trim() !== ""

  if (hasImage) {
    return {
      component: {
        ...blockquote,
        style: BLOCKQUOTE_STYLE.image,
      } as IsomerComponent,
      changed: true,
    }
  }

  // Strip the dangling image fields so we don't keep a misleading placeholder
  // alt text around on a quote that has no image.
  const { imageSrc: _imageSrc, imageAlt: _imageAlt, ...rest } = blockquote
  return {
    component: {
      ...rest,
      style: BLOCKQUOTE_STYLE.imageless,
    } as IsomerComponent,
    changed: true,
  }
}

/**
 * Applies {@link backfillBlockquoteStyle} to every block in a page's content,
 * returning the new content and whether anything changed.
 */
export const backfillBlockquoteStyleInContent = (
  schema: IsomerSchema,
): { schema: IsomerSchema; changed: boolean } => {
  let changed = false

  const content = schema.content.map((component) => {
    const result = backfillBlockquoteStyle(component)
    if (result.changed) {
      changed = true
    }
    return result.component
  })

  if (!changed) {
    return { schema, changed: false }
  }

  return { schema: { ...schema, content }, changed: true }
}
