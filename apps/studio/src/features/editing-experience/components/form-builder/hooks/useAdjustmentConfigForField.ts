import type {
  ImageAdjustment,
  IsomerComponent,
} from "@opengovsg/isomer-components"
import { useJsonForms } from "@jsonforms/react"
import { get } from "lodash-es"
import { useMemo } from "react"
import { useOptionalEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { resolveAdjustmentConfig } from "~/features/editing-experience/components/ImageAdjustmentModal/adjustmentConfigRegistry"

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
  const pathParts = path.split(".")
  const fieldName = pathParts.pop() ?? ""
  const parentPath = pathParts.join(".")

  // Content components name the adjustment after their own image field
  // (backgroundUrl gives backgroundUrlImageAdjustment), emitted together by
  // generateAdjustableImageFields. Deriving the key from fieldName, rather than
  // a fixed "imageAdjustment", lets a component carry two image fields without
  // their adjustments colliding on one shared key.
  const siblingKey = `${fieldName}ImageAdjustment`
  const siblingPath = [parentPath, siblingKey].filter(Boolean).join(".")

  // The field's immediate host: for a root-level image field the block itself,
  // for an array-nested field (e.g. an InfoCards card) the card object. This is
  // what Tier C's previewObjectFitFor reads (e.g. the card's
  // imageFit), and where the imageAdjustment sibling is written.
  // Per-block editor forms (e.g. HeroEditorDrawer) mount the form with the
  // block itself as the data root, so a top-level image field has an empty
  // parentPath -- in that case the host IS rootData.
  const rawFieldHost: unknown = parentPath
    ? get(rootData, parentPath)
    : rootData
  const fieldHost =
    typeof rawFieldHost === "object" && rawFieldHost !== null
      ? (rawFieldHost as Record<string, unknown>)
      : undefined

  // The block that OWNS the field = the nearest ancestor carrying a block
  // `type` discriminator, which is what the registry keys on. For a root-level
  // image field that is the immediate host; for an array-nested field the card
  // has no `type`, so this climbs to the enclosing block (e.g. InfoCards).
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
        context: { pageLayout },
      }),
    }),
    [
      ownerBlock,
      fieldHost,
      fieldName,
      siblingPath,
      currentAdjustment,
      pageLayout,
    ],
  )
}
