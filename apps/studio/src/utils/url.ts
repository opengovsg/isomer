/* oxlint-disable typescript/consistent-return, typescript/no-unnecessary-type-conversion, eslint/no-use-before-define -- studio lint cleanup */
import type { ParsedUrlQuery } from "node:querystring"
import { CALLBACK_URL_KEY } from "~/constants/params"
import { hasNonEmptyString } from "~/utils/truthiness"

import { getBaseUrl } from "./getBaseUrl"

export const appendWithRedirect = (url: string, redirectUrl?: string) => {
  if (!hasNonEmptyString(redirectUrl) || !isRelativeUrl(redirectUrl)) {
    return url
  }
  return `${url}?${CALLBACK_URL_KEY}=${redirectUrl}`
}

export const getRedirectUrl = (query: ParsedUrlQuery) => {
  const callback = query[CALLBACK_URL_KEY]
  if (!hasNonEmptyString(callback)) {
    return
  }
  return decodeURIComponent(String(callback))
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
