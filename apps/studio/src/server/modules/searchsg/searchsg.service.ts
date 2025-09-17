import wretch from "wretch"

import { env } from "~/env.mjs"

const SEARCHSG_BASE_URL = "https://api.services.search.gov.sg/admin"

const ISOMER_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) isomer"
const SearchSgApi = {
  Auth: `/v1/auth/token`,
  App: `/v1/bootstrap/applications`,
} as const

const generateSearchsgParams = ({
  name,
  config,
  url,
}: UpdateSearchsgConfigProps & {
  config: SearchsgConfig["data"]
  url: string
}) => {
  return {
    name: encodeURIComponent(name),
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
            primary: config.application.config.search.theme.primary,
            fontFamily: "Inter",
          },
        },
      },
    },
  }
}

interface UpdateSearchsgConfigProps {
  name: string
}

const requestSearchSgClient = async () => {
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

export const updateSearchsgConfig = async (
  props: UpdateSearchsgConfigProps,
  searchsgClientId: string,
  url: URL,
) => {
  const client = await requestSearchSgClient()

  // NOTE: doing fetch before post to avoid cases
  // where the search domain and data domains
  // are not direct deriviatives of `site.url`
  const { data: config } = await client
    .get(`/${searchsgClientId}`)
    .json<SearchsgConfig>()

  const updatedConfig = generateSearchsgParams({
    ...props,
    config,
    url: url.host,
  })

  const res = await client
    .json(updatedConfig)
    .url(`/${searchsgClientId}`)
    .put()
    .res()

  return res
}

interface SearchsgConfig {
  data: {
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
