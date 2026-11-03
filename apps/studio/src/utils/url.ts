import { type ParsedUrlQuery } from "querystring"
import { CALLBACK_URL_KEY } from "~/constants/params"

import { getBaseUrl } from "./getBaseUrl"

export const appendWithRedirect = (url: string, redirectUrl?: string) => {
  if (!redirectUrl || !isRelativeUrl(redirectUrl)) {
    return url
  }
  return `${url}?${CALLBACK_URL_KEY}=${redirectUrl}`
}

export const getRedirectUrl = (query: ParsedUrlQuery) => {
  const redirectUrl = query[CALLBACK_URL_KEY]
  return typeof redirectUrl === "string" ? redirectUrl : undefined
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
