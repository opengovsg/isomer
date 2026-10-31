import type { ImageAdjustment } from "@opengovsg/isomer-components"
import { useJsonForms } from "@jsonforms/react"
import { get } from "lodash-es"
import { useMemo } from "react"
import { useOptionalEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { resolveAdjustmentConfig } from "~/features/editing-experience/components/ImageAdjustmentModal/adjustmentConfigRegistry"
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
  // Context the registry can use to narrow a component's preview versions
  // (e.g. Blockquote's circle/square by page layout). Optional-safe: this hook
  // is also called from JsonFormsImageControl when it renders in provider-less
  // settings forms (Navbar/Footer/logo) with no EditorDrawerProvider around it
  // — there, pageLayout is simply undefined, which resolves to "show all
  // versions" rather than throwing.
  const editorDrawerContext = useOptionalEditorDrawerContext()
  const pageLayout = editorDrawerContext?.previewPageState.layout
  // Collection items (CollectionPage/CollectionLink resources) are the only
  // resource types whose page-level `image` field is THIS field -- the
  // "collection item thumbnail" (page.image.src/alt, composed into every
  // collection-item page schema via imageSchemaObject). Other layouts
  // (content/index/database pages) compose the exact same `image` field
  // shape for their own unrelated "page thumbnail" use, so the resource type
  // check -- not the field shape -- is what makes this safe to key off.
  const resourceType = editorDrawerContext?.type
  const isCollectionItemResource =
    resourceType === ResourceType.CollectionPage ||
    resourceType === ResourceType.CollectionLink

  const pathParts = path.split(".")
  const fieldName = pathParts.pop() ?? ""
  const parentPath = pathParts.join(".")
  const siblingPath = [parentPath, "imageAdjustment"].filter(Boolean).join(".")

  // The field's immediate host: for a root-level image field the block itself,
  // for an array-nested field (e.g. an InfoCards card) the card object. This is
  // what Tier C's focalEnabledFor/previewObjectFitFor read (e.g. the card's
  // imageFit), and where the imageAdjustment sibling is written.
  // Per-block editor forms (e.g. HeroEditorDrawer) mount the form with the
  // block itself as the data root, so a top-level image field has an empty
  // parentPath -- in that case the host IS rootData.
  const fieldHost: unknown = parentPath ? get(rootData, parentPath) : rootData

  // The block that OWNS the field = the nearest ancestor carrying a block
  // `type` discriminator, which is what the registry keys on. For a root-level
  // image field that is the immediate host; for an array-nested field the card
  // has no `type`, so this climbs to the enclosing block (e.g. InfoCards).
  const ownerBlock: unknown = useMemo(() => {
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
        return candidate
      }
    }
    return fieldHost
  }, [rootData, parentPath, fieldHost])

  // The page-level thumbnail (`page.image.src`) is the one image field with
  // no block-type ancestor -- imageSchemaObject composes it directly onto the
  // page metadata object, so its parentPath is always exactly "image" (never
  // nested inside a block). That shape alone isn't a safe signal on its own
  // (content/index/database pages compose the identical `image` field for
  // their own unrelated page thumbnail), so this also requires the resource
  // type to confirm the page is actually a collection item.
  const isCollectionThumbnail =
    isCollectionItemResource && parentPath === "image"

  // Only fetched for an actual collection thumbnail field — every other
  // image field leaves this disabled and gets undefined back immediately.
  const collectionVariant = useCollectionIndexVariant({
    siteId: editorDrawerContext?.siteId ?? 0,
    pageId: editorDrawerContext?.pageId ?? 0,
    enabled: isCollectionThumbnail && editorDrawerContext !== null,
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
