import { set } from "lodash"
import wretch from "wretch"

const SEARCHSG_BASE_URL = "api.services.search.gov.sg/admin"
const ISOMER_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) isomer"
const SearchSgApi = {
  Auth: `${SEARCHSG_BASE_URL}/v1/token`,
  App: `${SEARCHSG_BASE_URL}/bootstrap/applications`,
}

const generateSearchsgParams = ({
  name,
  config,
}: UpdateSearchsgConfigProps & { config: SearchsgConfig["data"] }) => {
  const updatedConfig = set(config, "name", name)

  return updatedConfig
}

interface UpdateSearchsgConfigProps {
  name: string
}

const requestSearchSgToken = async () => {
  const { data } = await wretch(SearchSgApi.Auth)
    .auth(`Basic ${searchsgApiKey}`)
    .headers({ UserAgent: ISOMER_UA })
    .post()
    .res<{ data: { accessToken: string; tokenType: string } }>()

  return data
}

export const updateSearchsgConfig = async (
  props: UpdateSearchsgConfigProps,
  searchsgClientId: string,
) => {
  const { accessToken, tokenType } = await requestSearchSgToken()

  // NOTE: doing fetch before post to avoid cases
  // where the search domain and data domains
  // are not direct deriviatives of `site.url`
  const { data: config } = await fetchSearchsgConfig(
    searchsgClientId,
    `${tokenType} ${accessToken}`,
  )
  const updatedConfig = generateSearchsgParams({ ...props, config })

  const res = await wretch(
    `https://${SEARCHSG_BASE_URL}/v1/bootstrap/applications/${searchsgClientId}`,
  )
    .auth(`${tokenType} ${accessToken}`)
    .headers({
      "Content-Type": "application/json",
      "User-Agent": ISOMER_UA,
    })
    .post(updatedConfig)
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
    }
  }
}

const fetchSearchsgConfig = async (
  searchsgClientId: string,
  auth: string,
): Promise<SearchsgConfig> => {
  return wretch(
    `https://${SEARCHSG_BASE_URL}/v1/bootstrap/applications/${searchsgClientId}`,
  )
    .auth(auth)
    .headers({
      "Content-Type": "application/json",
      "User-Agent": ISOMER_UA,
    })
    .get()
    .json<SearchsgConfig>()
}
