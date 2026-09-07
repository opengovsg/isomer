/* oxlint-disable typescript/strict-boolean-expressions, unicorn/no-useless-undefined -- callback query param may be string[] */
/* oxlint-disable typescript/consistent-return, typescript/no-unnecessary-type-conversion, eslint/no-use-before-define -- studio lint cleanup */
import type { ParsedUrlQuery } from "node:querystring"
import { CALLBACK_URL_KEY } from "~/constants/params"
import { hasNonEmptyString } from "~/utils/truthiness"

import { getBaseUrl } from "./getBaseUrl"

export const appendWithRedirect = (url: string, redirectUrl?: string) => {
  if (!redirectUrl || !isRelativeUrl(redirectUrl)) {
    return url
  }
  return `${url}?${CALLBACK_URL_KEY}=${redirectUrl}`
}

export const getRedirectUrl = (query: ParsedUrlQuery) => {
  if (!query[CALLBACK_URL_KEY]) {
    return undefined
  }
  return decodeURIComponent(String(query[CALLBACK_URL_KEY]))
}

const isRelativeUrl = (url: string) => {
  const baseUrl = getBaseUrl()
  try {
    const normalizedUrl = new URL(url, baseUrl)
    return new URL(baseUrl).origin === normalizedUrl.origin
  } catch {
    return false
  }
}
