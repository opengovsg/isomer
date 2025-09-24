export const DGS_LINK_REGEX = /\[dgs:([a-zA-Z0-9_]+)\]/

// This is the maximum number of bytes that can be requested from the DGS API
// https://opengovproducts.slack.com/archives/C05FKB7JM1U/p1757646271300719?thread_ts=1757638807.583389&cid=C05FKB7JM1U
export const DGS_REQUEST_MAX_BYTES = 4 * 1024 * 1024 // 4MB
