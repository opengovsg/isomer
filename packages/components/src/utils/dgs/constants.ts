export const DGS_LINK_REGEX = /\[dgs:([a-zA-Z0-9_]+)\]/

// This is the maximum number of bytes that can be requested from the DGS API
// https://opengovproducts.slack.com/archives/C05FKB7JM1U/p1757646271300719?thread_ts=1757638807.583389&cid=C05FKB7JM1U
export const DGS_REQUEST_MAX_BYTES = 4 * 1024 * 1024 // 4MB

// Hard cap on dataset size for DGSSearchableTable. Datasets above this size
// cannot be loaded into the client and will render an error.
// See: docs/adr/0001-dgs-searchable-table-client-load.md
export const DGS_MAX_DATASET_BYTES = 20 * 1024 * 1024 // 20MB

// CKAN datastore auto-generates these columns on every dataset.
// _id is an integer row counter; used as the default stable sort
// when paging concurrent chunks (DGS has no guaranteed default order).
// _full_text is a PostgreSQL tsvector used for full-text search.
export const CKAN_ROW_ID_COLUMN = "_id"
export const CKAN_FULL_TEXT_COLUMN = "_full_text"
