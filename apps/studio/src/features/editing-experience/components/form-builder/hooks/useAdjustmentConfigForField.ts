import type {
  ImageAdjustment,
  IsomerComponent,
} from "@opengovsg/isomer-components"
import { useJsonForms } from "@jsonforms/react"
import { get } from "lodash-es"
import { useMemo } from "react"
import { useOptionalEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { resolveAdjustmentConfig } from "~/features/editing-experience/components/ImageAdjustmentModal/adjustmentConfigRegistry"
import { pageOrLinkSchema } from "~/features/editing-experience/schema"
import { useQueryParse } from "~/hooks/useQueryParse"
import { ResourceType } from "~prisma/generated/generatedEnums"

import { useCollectionIndexVariant } from "./useCollectionIndexVariant"

/**
 * Resolves the adjustment config, containing block, and sibling
 * imageAdjustment value for an image field at `path`.
 *
 * useJsonForms() subscribes to the whole form's core data, so every field
 * change anywhere in the form re-renders every caller of this hook -- jsonforms
 * has no API to scope the subscription to one sibling path. The useMemo keeps
 * that re-render from recomputing the lodash `get()` walks and re-deriving a
 * new `config`/`block` identity unless this field's own slice of the data
 * actually changed.
 */
export const useAdjustmentConfigForField = (path: string) => {
  const ctx = useJsonForms()
  const rootData: unknown = ctx.core?.data
  // Settings forms like Navbar and Footer have no EditorDrawerProvider, so
  // pageLayout is undefined there.
  const editorDrawerContext = useOptionalEditorDrawerContext()
  const pageLayout = editorDrawerContext?.previewPageState.layout
  // Collection items (CollectionPage/CollectionLink resources) are the only
  // resource types whose page-level `image` field is THIS field -- the
  // "collection item thumbnail" (page.image.src/alt, composed into every
  // collection-item page schema via imageSchemaObject). Other layouts
  // (content/index/database pages) compose the exact same `image` field
  // shape for their own unrelated "page thumbnail" use, so the resource type
  // check -- not the field shape -- is what makes this safe to key off.
  // The collection-link route has no EditorDrawerProvider; a linkId in the
  // route (only that route has one) means the form edits a CollectionLink.
  const { siteId: routeSiteId, linkId } = useQueryParse(pageOrLinkSchema)
  const isLinkEditorRoute = editorDrawerContext === null && linkId !== undefined
  const resourceType = editorDrawerContext?.type
  const isCollectionItemResource =
    isLinkEditorRoute ||
    resourceType === ResourceType.CollectionPage ||
    resourceType === ResourceType.CollectionLink

  const pathParts = path.split(".")
  const fieldName = pathParts.pop() ?? ""
  const parentPath = pathParts.join(".")

  // The page-level thumbnail (`page.image.src`) is the one image field with no
  // block-type ancestor. imageSchemaObject composes it directly onto the page
  // metadata object, so its parentPath is always exactly "image", never nested
  // inside a block. That shape alone isn't a safe signal, since content, index,
  // and database pages compose the identical `image` field for their own page
  // thumbnail, so this also checks the resource type to confirm the page is a
  // collection item.
  const isCollectionThumbnail =
    isCollectionItemResource && parentPath === "image"

  // Content components name the adjustment after their own image field
  // (backgroundUrl gives backgroundUrlImageAdjustment), emitted together by
  // generateAdjustableImageFields. Deriving the key from fieldName, rather than
  // a fixed "imageAdjustment", lets a component carry two image fields without
  // their adjustments colliding on one shared key. The collection thumbnail is
  // the one exception: a single-image field (imageSchemaObject) that keeps the
  // fixed "imageAdjustment" key. One image means no collision.
  const siblingKey = isCollectionThumbnail
    ? "imageAdjustment"
    : `${fieldName}ImageAdjustment`
  const siblingPath = [parentPath, siblingKey].filter(Boolean).join(".")

  // The object that holds the field. That is the block for a root-level
  // field and the card for a nested one, such as an InfoCards card.
  // Per-block forms like HeroEditorDrawer use the block as the data root, so
  // parentPath is empty and the host is rootData.
  const rawFieldHost: unknown = parentPath
    ? get(rootData, parentPath)
    : rootData
  const fieldHost =
    typeof rawFieldHost === "object" && rawFieldHost !== null
      ? (rawFieldHost as Record<string, unknown>)
      : undefined

  // The owning block is the nearest ancestor with a `type`, which is what
  // the registry keys on. Nested hosts like cards must never declare a
  // `type`, or the climb stops early and Adjust disappears.
  // imageAdjustmentSchemaGuardrail.test.ts enforces this.
  const ownerBlock = useMemo((): IsomerComponent | undefined => {
    const segments = parentPath ? parentPath.split(".") : []
    for (let depth = segments.length; depth >= 0; depth--) {
      const ancestorPath = segments.slice(0, depth).join(".")
      const candidate: unknown = ancestorPath
        ? get(rootData, ancestorPath)
        : rootData
      if (
        typeof candidate === "object" &&
        candidate !== null &&
        typeof (candidate as { type?: unknown }).type === "string"
      ) {
        return candidate as IsomerComponent
      }
    }
    return undefined
  }, [rootData, parentPath])

  // Only fetched for an actual collection thumbnail field — every other
  // image field leaves this disabled and gets undefined back immediately.
  const collectionVariant = useCollectionIndexVariant({
    siteId: editorDrawerContext?.siteId ?? routeSiteId,
    pageId: editorDrawerContext?.pageId ?? linkId ?? 0,
    enabled: isCollectionThumbnail,
  })

  const currentAdjustment = get(rootData, siblingPath) as
    | ImageAdjustment
    | undefined

  return useMemo(
    () => ({
      block: ownerBlock,
      fieldHost,
      fieldName,
      siblingPath,
      currentAdjustment,
      config: resolveAdjustmentConfig({
        block: ownerBlock,
        fieldName,
        context: { pageLayout, isCollectionThumbnail, collectionVariant },
      }),
    }),
    [
      ownerBlock,
      fieldHost,
      fieldName,
      siblingPath,
      currentAdjustment,
      pageLayout,
      isCollectionThumbnail,
      collectionVariant,
    ],
  )
}
