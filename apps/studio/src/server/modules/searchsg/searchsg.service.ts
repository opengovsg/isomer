import { set } from "lodash"
import wretch from "wretch"

const SEARCHSG_BASE_URL = "api.services.search.gov.sg/admin"
const ISOMER_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) isomer"
const SearchSgApi = {
  Auth: `https://${SEARCHSG_BASE_URL}/v1/auth/token`,
  App: `https://${SEARCHSG_BASE_URL}/v1/bootstrap/applications`,
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
    name,
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

const requestSearchSgToken = async () => {
  const data = await wretch(SearchSgApi.Auth)
    .auth(`Basic ${searchsgApiKey}`)
    .headers({
      "User-Agent": ISOMER_UA,
    })
    .post()
    .json<{ accessToken: string; tokenType: string }>()

  return data
}

export const updateSearchsgConfig = async (
  props: UpdateSearchsgConfigProps,
  searchsgClientId: string,
  url: URL,
) => {
  const { accessToken, tokenType } = await requestSearchSgToken()

  // NOTE: doing fetch before post to avoid cases
  // where the search domain and data domains
  // are not direct deriviatives of `site.url`
  const { data: config } = await fetchSearchsgConfig(
    searchsgClientId,
    `${tokenType} ${accessToken}`,
  )

  const updatedConfig = generateSearchsgParams({
    ...props,
    config,
    url: url.host,
  })

  const res = await wretch(`${SearchSgApi.App}/${searchsgClientId}`)
    .auth(`${tokenType} ${accessToken}`)
    .headers({
      "Content-Type": "application/json",
      Accept: "*/*",
      "User-Agent": ISOMER_UA,
    })
    .json(updatedConfig)
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

const fetchSearchsgConfig = async (
  searchsgClientId: string,
  auth: string,
): Promise<SearchsgConfig> => {
  return wretch(`${SearchSgApi.App}/${searchsgClientId}`)
    .auth(auth)
    .headers({
      "Content-Type": "application/json",
      "User-Agent": ISOMER_UA,
    })
    .get()
    .json<SearchsgConfig>()
}
