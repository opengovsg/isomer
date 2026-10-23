import type { ImageAdjustment } from "@opengovsg/isomer-components"
import { useJsonForms } from "@jsonforms/react"
import { get } from "lodash-es"
import { useMemo } from "react"
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

  const pathParts = path.split(".")
  const fieldName = pathParts.pop() ?? ""
  const parentPath = pathParts.join(".")
  const siblingPath = [parentPath, "imageAdjustment"].filter(Boolean).join(".")

  // Per-block editor forms (e.g. HeroEditorDrawer) mount the form with the
  // block itself as the data root, so the image field is top-level and
  // parentPath is empty -- in that case the block IS rootData.
  const block: unknown = parentPath ? get(rootData, parentPath) : rootData
  const currentAdjustment = get(rootData, siblingPath) as
    | ImageAdjustment
    | undefined

  return useMemo(
    () => ({
      block,
      fieldName,
      siblingPath,
      currentAdjustment,
      config: resolveAdjustmentConfig({ block, fieldName }),
    }),
    [block, fieldName, siblingPath, currentAdjustment],
  )
}
