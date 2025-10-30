import wretch from "wretch"

import { env } from "~/env.mjs"
import { createBaseLogger } from "~/lib/logger"

const logger = createBaseLogger({ path: "searchsg.service" })

const SEARCHSG_BASE_URL = "https://api.services.search.gov.sg/admin"

const ISOMER_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) isomer"
const SearchSgApi = {
  Auth: `/v1/auth/token`,
  App: `/v1/bootstrap/applications`,
} as const

const generateSearchSGParams = ({
  config,
  url,
  ...rest
}: UpdateSearchSGConfigProps & {
  config: SearchSGConfig["data"]
  url: string
}) => {
  return {
    name: rest._kind === "name" ? encodeURIComponent(rest.name) : config.name,
    tenant: {
      adminList: ["isomer@open.gov.sg"],
    },
    index: {
      dataSource: {
        web: [
          {
            domain: `https://${url}`,
            documentIndexConfig: {
              indexWhitelist: [],
              indexBlacklist: [],
            },
          },
        ],
        api: [],
      },
    },
    application: {
      siteDomain: url,
      environment: "production",
      config: {
        search: {
          theme: {
            primary:
              rest._kind === "colour"
                ? rest.colour
                : config.application.config.search.theme.primary,
            fontFamily: "Inter",
          },
        },
      },
    },
  }
}

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

const requestSearchSGClient = async () => {
  const { accessToken, tokenType } = await wretch(
    `${SEARCHSG_BASE_URL}${SearchSgApi.Auth}`,
  )
    .auth(`Basic ${env.SEARCHSG_API_KEY}`)
    .headers({
      "User-Agent": ISOMER_UA,
    })
    .post()
    .json<{ accessToken: string; tokenType: string }>()

  return wretch(`${SEARCHSG_BASE_URL}${SearchSgApi.App}`)
    .auth(`${tokenType} ${accessToken}`)
    .headers({
      "Content-Type": "application/json",
      "User-Agent": ISOMER_UA,
    })
}

export const updateSearchSGConfig = async (
  props: UpdateSearchSGConfigProps,
  searchsgClientId: string,
  url: string,
) => {
  const client = await requestSearchSGClient()
  const actualUrl = new URL(url)
  logger.info(
    { ...props, searchsgClientId, url: actualUrl.host },
    `[INFO] Updating searchsg config for ${url} with searchsg client id: ${searchsgClientId}`,
  )

  // NOTE: doing fetch before post to avoid cases
  // where the search domain and data domains
  // are not direct deriviatives of `site.url`
  const { data: config } = await client
    .get(`/${searchsgClientId}`)
    .json<SearchSGConfig>()

  const updatedConfig = generateSearchSGParams({
    ...props,
    config,
    url: actualUrl.host,
  })

  const res = await client
    .json(updatedConfig)
    .url(`/${searchsgClientId}`)
    .put()
    .res()
    .catch((error: unknown) => {
      logger.error(
        { error },
        `[ERROR] Failed to update searchsg config for ${url} with searchsg client id: ${searchsgClientId}`,
      )

      throw error
    })

  return res
}

interface SearchSGConfig {
  data: {
    name: string
    index: {
      dataSource: {
        web: { domain: string }[]
      }
    }
    application: {
      siteDomain: string
      config: {
        search: {
          theme: {
            primary: string
          }
        }
      }
    }
  }
}
