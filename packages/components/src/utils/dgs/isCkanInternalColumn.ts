import { CKAN_FULL_TEXT_COLUMN, CKAN_ROW_ID_COLUMN } from "./constants"

export const isCkanInternalColumn = (columnName: string): boolean =>
  columnName === CKAN_ROW_ID_COLUMN || columnName === CKAN_FULL_TEXT_COLUMN
