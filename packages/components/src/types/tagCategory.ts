import { TAG_CATEGORY_TYPE } from "./constants"

interface Category {
  type?: string
}

export const isDateFilter = <T extends Category>(
  category: T,
): category is Extract<T, { type: typeof TAG_CATEGORY_TYPE.Date }> =>
  category.type === TAG_CATEGORY_TYPE.Date

// Legacy text filters omit `type`; date filters always set `type: "date"`.
export const isTextFilter = <T extends Category>(
  category: T,
): category is Exclude<T, { type: typeof TAG_CATEGORY_TYPE.Date }> =>
  category.type !== TAG_CATEGORY_TYPE.Date
