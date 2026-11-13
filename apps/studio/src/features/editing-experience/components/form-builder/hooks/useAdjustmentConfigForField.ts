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
  // Settings forms like Navbar and Footer have no EditorDrawerProvider, so
  // pageLayout is undefined there.
  const editorDrawerContext = useOptionalEditorDrawerContext()
  const pageLayout = editorDrawerContext?.previewPageState.layout
  const pathParts = path.split(".")
  const fieldName = pathParts.pop() ?? ""
  const parentPath = pathParts.join(".")

  // Matches the key generateAdjustableImageFields emits. A per-field key lets
  // one component carry two image fields.
  const siblingKey = `${fieldName}ImageAdjustment`
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
