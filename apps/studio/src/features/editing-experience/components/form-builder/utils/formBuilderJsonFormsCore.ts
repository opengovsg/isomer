import type { ErrorObject } from "ajv"
import type { Middleware } from "@jsonforms/core"
import get from "lodash/get"

/** Tag **options** (`format: "tag-category-options"`). */
export const DUPLICATE_OPTION_LABEL_MESSAGE =
  "An option with this name already exists. Option names are not case-sensitive."

/** Tag **filters** (`format: "tag-categories"`). */
export const DUPLICATE_FILTER_LABEL_MESSAGE =
  "A filter with this name already exists. Filter names are not case-sensitive."

/**
 * Hard-coded for collection page tag UI in `packages/components/src/types/page.ts`:
 * - `tagCategories` + `uniqueItemPropertiesIgnoreCase: ["label"]`
 * - each category’s `options` + same keyword
 */
const TAG_CATEGORIES_ARRAY_PATH = "/tagCategories"
const OPTIONS_ARRAY_PATH_SUFFIX = "/options"

function jsonPointerToLodashPath(pointer: string): string {
  if (pointer === "" || pointer === "/") return ""
  return pointer
    .replace(/^\//, "")
    .split("/")
    .map((s) => s.replace(/~1/g, "/").replace(/~0/g, "~"))
    .join(".")
}

function normalizedLabel(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : ""
}

function expandDuplicateLabelsInArray(
  parent: ErrorObject,
  arrayPath: string,
  data: unknown,
  extra: ErrorObject[],
  alreadyExpanded: Set<string>,
  message: string,
  syntheticKeyword: string,
): void {
  if (alreadyExpanded.has(arrayPath)) return
  alreadyExpanded.add(arrayPath)

  const arr = get(data, jsonPointerToLodashPath(arrayPath)) as unknown
  if (!Array.isArray(arr)) return

  const normToIndices = new Map<string, number[]>()
  for (let i = 0; i < arr.length; i++) {
    const key = normalizedLabel(get(arr[i], "label"))
    const list = normToIndices.get(key)
    if (list) list.push(i)
    else normToIndices.set(key, [i])
  }

  for (const indices of normToIndices.values()) {
    if (indices.length < 2) continue
    for (const i of indices) {
      extra.push({
        instancePath: `${arrayPath}/${i}/label`,
        schemaPath: parent.schemaPath,
        keyword: syntheticKeyword,
        message,
        params: {},
      })
    }
  }
}

function shouldStripArrayLevelUniquenessError(instancePath: string | undefined): boolean {
  if (!instancePath) return false
  return (
    instancePath === TAG_CATEGORIES_ARRAY_PATH ||
    instancePath.endsWith(OPTIONS_ARRAY_PATH_SUFFIX)
  )
}

export function postProcessFormBuilderCoreErrors(
  errors: ErrorObject[] | undefined,
  data: unknown,
): ErrorObject[] {
  if (!errors?.length) return errors ?? []

  const extra: ErrorObject[] = []
  const expandedArrays = new Set<string>()

  const walk = (list: ErrorObject[] | undefined): void => {
    if (!list) return
    for (const e of list) {
      if (e.keyword === "errorMessage") {
        const nested = (e.params as { errors?: ErrorObject[] })?.errors
        if (Array.isArray(nested)) walk(nested)
        continue
      }
      if (e.keyword !== "uniqueItemPropertiesIgnoreCase" || !e.instancePath) {
        continue
      }
      const path = e.instancePath
      if (path === TAG_CATEGORIES_ARRAY_PATH) {
        expandDuplicateLabelsInArray(
          e,
          path,
          data,
          extra,
          expandedArrays,
          DUPLICATE_FILTER_LABEL_MESSAGE,
          "duplicateFilterLabel",
        )
      } else if (path.endsWith(OPTIONS_ARRAY_PATH_SUFFIX)) {
        expandDuplicateLabelsInArray(
          e,
          path,
          data,
          extra,
          expandedArrays,
          DUPLICATE_OPTION_LABEL_MESSAGE,
          "duplicateOptionLabel",
        )
      }
    }
  }

  walk(errors)

  if (extra.length === 0) return errors

  const merged = [...errors, ...extra]
  return merged.filter((e) => {
    if (
      e.keyword === "uniqueItemPropertiesIgnoreCase" &&
      shouldStripArrayLevelUniquenessError(e.instancePath)
    ) {
      return false
    }
    if (e.keyword === "errorMessage" && shouldStripArrayLevelUniquenessError(e.instancePath)) {
      const nested = (e.params as { errors?: ErrorObject[] })?.errors
      const first = nested?.[0]
      if (
        nested?.length === 1 &&
        first?.keyword === "uniqueItemPropertiesIgnoreCase"
      ) {
        return false
      }
    }
    return true
  })
}

export const formBuilderJsonFormsMiddleware: Middleware = (
  state,
  action,
  coreReducer,
) => {
  const next = coreReducer(state, action)
  return {
    ...next,
    errors: postProcessFormBuilderCoreErrors(next.errors, next.data),
  }
}
