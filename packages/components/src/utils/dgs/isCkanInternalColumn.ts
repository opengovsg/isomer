// CKAN datastore auto-generates these columns on every dataset:
// - _id: integer row counter added by CKAN, not part of the source data
// - _full_text: PostgreSQL tsvector used for full-text search, not part of the source data
// Neither should be shown to users.
export const isCkanInternalColumn = (columnName: string): boolean =>
  columnName === "_id" || columnName === "_full_text"
