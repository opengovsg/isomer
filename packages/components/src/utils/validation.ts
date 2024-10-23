export const ALLOWED_URL_REGEXES = {
  external: "^https:\\/\\/",
  mail: "^mailto:",
  internal: "^\\[resource:(\\d+):(\\d+)\\]$",
  // NOTE: This is taken with reference from `convertAssetLinks`
  // and should remain in sync.
  // Unfortunately, typebox requires a string and hence, doubly escaped characters
  // but `re.source` only gives us the actual string
  // regex for asset links: /^\/(\d+)\//
  files: "^\\/(\\d+)\\/",
} as const

export const LINK_HREF_PATTERN =
  `(${ALLOWED_URL_REGEXES.external})|(${ALLOWED_URL_REGEXES.mail})|(${ALLOWED_URL_REGEXES.internal})|(${ALLOWED_URL_REGEXES.files})` as const
export const REF_HREF_PATTERN =
  `(${ALLOWED_URL_REGEXES.external})|(${ALLOWED_URL_REGEXES.internal})|(${ALLOWED_URL_REGEXES.files})` as const
