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
  // Only collection items (CollectionPage, CollectionLink) use the page-level
  // `image` field as a collection thumbnail. Other layouts have the same field
  // for their own page thumbnail, so check the resource type, not the shape.
  // The link route has no EditorDrawerProvider. A linkId in the route means
  // the form edits a CollectionLink.
  const { siteId: routeSiteId, linkId } = useQueryParse(pageOrLinkSchema)
  const isLinkEditorRoute = editorDrawerContext === null && linkId !== undefined
  const resourceType = editorDrawerContext?.type
  const isCollectionItemResource =
    isLinkEditorRoute ||
    resourceType === ResourceType.CollectionPage ||
    resourceType === ResourceType.CollectionLink

  const pathParts = path.split(".")
  const fieldName = pathParts.pop() ?? ""
  // The host's position in its array, e.g. 1 for "slides.1". Undefined when
  // the host is not an array item.
  const lastParentPart = pathParts.at(-1) ?? ""
  const fieldHostIndex = /^\d+$/.test(lastParentPart)
    ? Number(lastParentPart)
    : undefined
  const parentPath = pathParts.join(".")

  // The page thumbnail sits directly on the page object, so its parentPath is
  // exactly "image".
  const isCollectionThumbnail =
    isCollectionItemResource && parentPath === "image"

  // Content components key the adjustment by field name, e.g.
  // backgroundUrlImageAdjustment, so two image fields never collide. The
  // collection thumbnail is a single image and keeps the fixed key.
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

  // The owning block is the form root. Block editors (ComplexEditorStateDrawer,
  // HeroEditorDrawer) pass the block itself as the form data, as other controls
  // like JsonFormsMaxColumnsControl assume. Other forms (page metadata, navbar,
  // footer) have no `type` at the root, so no block resolves.
  const ownerBlock =
    typeof rootData === "object" &&
    rootData !== null &&
    typeof (rootData as { type?: unknown }).type === "string"
      ? (rootData as IsomerComponent)
      : undefined

  // Disabled unless this is a collection thumbnail.
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
      fieldHostIndex,
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
      fieldHostIndex,
      fieldName,
      siblingPath,
      currentAdjustment,
      pageLayout,
      isCollectionThumbnail,
      collectionVariant,
    ],
  )
}
