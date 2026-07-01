import wretch from "wretch"
import { z } from "zod"
import { env } from "~/env.mjs"
import { createBaseLogger } from "~/lib/logger"

const logger = createBaseLogger({ path: "searchsg.service" })

export const SEARCHSG_BASE_URL = "https://api.services.search.gov.sg/admin"
export const EGAZETTE_DOCUMENT_INDEX = env.EGAZETTE_DOCUMENT_INDEX
export const ISOMER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) isomer"
const SearchSgApi = {
  auth: () => `/v1/auth/token`,
  site: (id: string) => `/v2/sites/${id}`,
  app: (id: string, appId: string) => `/v2/sites/${id}/apps/${appId}`,
  project: (projectId: string) => `/v2/projects/${projectId}`,
} as const

interface UpdateSearchSgSiteNameProps {
  name: string
  _kind: "name"
}

interface UpdateSearchSgColourProps {
  colour: string
  _kind: "colour"
}

type UpdateSearchSGConfigProps =
  | UpdateSearchSgSiteNameProps
  | UpdateSearchSgColourProps

interface SearchSGAppDetail {
  appId: string
  appType: string
  config?: { theme?: { primary?: string; fontFamily?: string } }
}

interface SearchSGSiteResponse {
  data: {
    siteDetail: { applications: SearchSGAppDetail[] }
    project: { projectId?: string }
  }
}

const findWebsiteSearchApp = (apps: SearchSGAppDetail[]): SearchSGAppDetail => {
  const app = apps.find((a) => a.appType === "websiteSearch")
  if (!app) {
    logger.error(
      { apps },
      `[ERROR] No websiteSearch app found in SearchSG site applications`,
    )
    throw new Error("No websiteSearch app found in SearchSG site applications")
  }
  return app
}

const requestSearchSGClient = async () => {
  const { accessToken, tokenType } = await wretch(
    `${SEARCHSG_BASE_URL}${SearchSgApi.auth()}`,
  )
    .auth(`Basic ${env.SEARCHSG_API_KEY}`)
    .headers({
      "User-Agent": ISOMER_UA,
    })
    .post()
    .json<{ accessToken: string; tokenType: string }>()

  return wretch(SEARCHSG_BASE_URL).auth(`${tokenType} ${accessToken}`).headers({
    "Content-Type": "application/json",
    "User-Agent": ISOMER_UA,
  })
}

export const isValidSearchSGClientId = (clientId: string): boolean =>
  z.string().uuid().safeParse(clientId).success

export const updateSearchSGConfig = async (
  props: UpdateSearchSGConfigProps,
  searchsgClientId: string,
  url: string,
) => {
  // Reject non-UUID clientIds to prevent path traversal attacks
  if (!isValidSearchSGClientId(searchsgClientId)) {
    logger.error(
      { searchsgClientId },
      `[ERROR] Invalid SearchSG client ID format - aborting to prevent path traversal`,
    )
    return
  }

  // Only update SearchSG in production and staging environments since SearchSG does not have non-prod env
  // This is to avoid accidentally updating a production site in a non-prod environment
  if (!["production", "staging"].includes(env.NEXT_PUBLIC_APP_ENV)) {
    logger.info(
      { ...props, searchsgClientId, url, env: env.NEXT_PUBLIC_APP_ENV },
      `[INFO] Skipping SearchSG config update for ${url} - not in production or staging environment`,
    )
    return
  }

  let actualUrl: URL
  try {
    actualUrl = new URL(url)
  } catch (error) {
    logger.error(
      { error, url, ...props },
      `[ERROR] Invalid URL format for SearchSG config update`,
    )
    return
  }
  const client = await requestSearchSGClient()
  logger.info(
    { ...props, searchsgClientId, url: actualUrl.host },
    `[INFO] Updating searchsg config for ${url} with searchsg client id: ${searchsgClientId}`,
  )

  const logAndRethrow = (error: unknown): never => {
    logger.error(
      { error },
      `[ERROR] Failed to update searchsg config for ${url} with searchsg client id: ${searchsgClientId}`,
    )
    throw error
  }

  // NOTE: fetch site details first to retrieve the appId (for colour updates)
  // and projectId (for name updates) needed by the v2 branched PATCH endpoints
  const { data } = await client
    .url(SearchSgApi.site(searchsgClientId))
    .get()
    .json<SearchSGSiteResponse>()
    .catch(logAndRethrow)

  const kind = props._kind
  switch (kind) {
    case "colour":
      const app = findWebsiteSearchApp(data.siteDetail.applications)

      return client
        .url(SearchSgApi.app(searchsgClientId, app.appId))
        .json({
          config: { theme: { primary: props.colour, fontFamily: "Inter" } },
        })
        .patch()
        .res()
        .catch(logAndRethrow)
    case "name":
      const { projectId } = data.project
      if (!projectId) {
        logger.error(
          { data },
          `[ERROR] No projectId found in SearchSG site response for ${url} with searchsg client id: ${searchsgClientId}`,
        )
        throw new Error(
          `No projectId found in SearchSG site response for searchsgClientId: ${searchsgClientId}`,
        )
      }

      return client
        .url(SearchSgApi.project(projectId))
        .json({ projectName: props.name, adminList: ["isomer@open.gov.sg"] })
        .patch()
        .res()
        .catch(logAndRethrow)
    default: {
      const exhaustiveCheck: never = kind
      const invalidKind = exhaustiveCheck as string
      logger.error(
        { kind: invalidKind },
        `[ERROR] Invalid SearchSG config update kind: ${invalidKind}`,
      )
      throw new Error(`Invalid SearchSG config update kind: ${invalidKind}`)
    }
  }
}
