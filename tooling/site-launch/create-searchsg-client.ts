import { input } from "@inquirer/prompts"
import axios from "axios"
import { addSearchJson, readSiteConfig, updateSiteConfig } from "github"
import { getSiteTheme, updateSiteConfigWithSearch } from "site"

import { env } from "./env"

const ADMIN_BASE = "https://api.services.search.gov.sg/admin"
const ISOMER_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) isomer"

const SearchSgApi = {
  auth: `${ADMIN_BASE}/v1/auth/token`,
  create: `${ADMIN_BASE}/v2/bootstrap`,
}

interface GenerateRequestDataParams {
  name: string
  domain: string
  siteDomain: string
  primary: string
}
const generateRequestData = ({
  name,
  domain,
  siteDomain,
  primary,
}: GenerateRequestDataParams) => {
  return {
    project: { agencyId: 31, projectName: name, adminList: ["isomer@open.gov.sg"] },
    index: {
      indexType: "websiteSearch",
      indexName: name,
      dataSources: {
        web: [{ startingUrl: domain, documentIndexConfig: { indexWhitelist: [], indexBlacklist: [] } }],
        api: [],
        pushApi: { enabled: false },
      },
    },
    sites: [
      {
        siteName: name,
        siteDomain,
        environment: "production",
        apps: [{ appType: "websiteSearch", config: { theme: { primary, fontFamily: "Inter" } } }],
      },
    ],
  }
}

type CreateSearchSgClientParams = Omit<
  GenerateRequestDataParams,
  "primary" | "siteDomain"
>

export const createSearchSgClientForGithub = async ({
  domain,
  name,
  repo,
}: CreateSearchSgClientParams & { repo: string }) => {
  const { content: siteConfig, sha } = await readSiteConfig(repo)
  if (siteConfig.site?.search === "searchSG") {
    const existingClientId = siteConfig.site?.search?.clientId
    console.log(
      `Discovered an existing searchSG clientId: ${existingClientId} for site ${name}`,
    )
    return existingClientId
  }

  // TODO: add validation via zod
  const primary = (siteConfig as any).colors?.brand?.canvas?.inverse

  const { displayedName, dataDomain } = await askForDomainAndName({
    domain,
    name,
  })

  const siteClientId = await createSearchSgClient({
    dataDomain,
    displayedName,
    domain,
    primary,
  })

  siteConfig.site.url = `https://${domain}`
  siteConfig.site.search = {
    type: "searchSG",
    clientId: siteClientId,
  }

  await updateSiteConfig(repo, siteConfig, sha)
  await addSearchJson(repo)
}

interface SearchSgBootstrapResponse {
  data: { sites: Array<{ siteClientId: string }> }
}

interface SearchSgConfig {
  dataDomain: string
  domain: string
  displayedName: string
  primary: string
}
const createSearchSgClient = async ({
  dataDomain,
  domain,
  displayedName,
  primary,
}: SearchSgConfig) => {
  const authToken = env.SEARCHSG_API_KEY

  const {
    data: { accessToken, tokenType },
  } = await axios.post(
    SearchSgApi.auth,
    {},
    {
      headers: {
        Authorization: `Basic ${authToken}`,
        UserAgent: ISOMER_UA,
      },
    },
  )

  const requestData = generateRequestData({
    domain: dataDomain,
    name: displayedName,
    siteDomain: domain,
    primary,
  })

  const { data } = await axios.post<SearchSgBootstrapResponse>(
    SearchSgApi.create,
    requestData,
    {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": ISOMER_UA,
        Authorization: `${tokenType} ${accessToken}`,
      },
    },
  )

  if (!data.data.sites[0]) {
    throw new Error("SearchSG bootstrap response missing sites[0]")
  }

  const { siteClientId } = data.data.sites[0]

  console.log("Created search sg site with siteClientId:", siteClientId)

  return siteClientId
}

export const createSearchSgClientForStudio = async ({
  domain,
  siteId,
  name,
}: CreateSearchSgClientParams & { siteId: number }) => {
  const { theme } = await getSiteTheme(siteId)

  const { displayedName, dataDomain } = await askForDomainAndName({
    domain,
    name,
  })

  const siteClientId = await createSearchSgClient({
    dataDomain,
    displayedName,
    domain,
    primary: theme.colors.brand.canvas.inverse,
  })

  const url = `https://${domain}`

  await updateSiteConfigWithSearch(siteId, url, siteClientId)
}

const askForDomainAndName = async ({
  domain,
  name,
}: CreateSearchSgClientParams) => {
  const dataDomain = await input({
    message:
      "Enter the domain for the data source (e.g. https://isomer.gov.sg):",
    default: `https://${domain}`,
  })

  // NOTE: try to form a URL with the `dataDomain` - reject if we cannot
  const url = new URL(dataDomain)
  if (url.protocol !== "https:") {
    throw new Error("Invalid URL: expected protocol to be `https`")
  }

  const displayedName = await input({
    message: "Enter the site name displayed on the search results page",
    default: name,
  })

  return { displayedName, dataDomain }
}
