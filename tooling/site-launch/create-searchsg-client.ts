import { writeFileSync } from "fs"
import { confirm, input } from "@inquirer/prompts"
import axios from "axios"
import { addSearchJson, readSiteConfig, updateSiteConfig } from "github"

const BASE_SEARCHSG_URL = "https://api.services.search.gov.sg/admin/v1"
const ISOMER_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) isomer"

const SearchSgApi = {
  auth: `${BASE_SEARCHSG_URL}/auth/token`,
  create: `${BASE_SEARCHSG_URL}/bootstrap/applications`,
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
    agencyId: 31,
    name,
    tenant: {
      adminList: ["isomer@open.gov.sg"],
    },
    index: {
      dataSource: {
        web: [
          {
            domain,
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
      siteDomain,
      // TODO: change back to production
      environment: "production",
      config: {
        search: {
          theme: {
            primary,
            fontFamily: "Inter",
          },
        },
      },
    },
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

  // TODO: add validation via zod
  const primary = (siteConfig as any).colors?.brand?.canvas?.inverse

  const { displayedName, dataDomain } = await askForDomainAndName({
    domain,
    name,
  })

  const applicationId = await createSearchSgClient({
    dataDomain,
    displayedName,
    domain,
    primary,
  })

  siteConfig.site.url = `https://${domain}`
  siteConfig.site.search = {
    type: "searchSG",
    clientId: applicationId,
  }

  await updateSiteConfig(repo, siteConfig, sha)
  await addSearchJson(repo)
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
  const authToken = process.env.SEARCHSG_API_KEY

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

  const data = generateRequestData({
    domain: dataDomain,
    name: displayedName,
    siteDomain: domain,
    primary,
  })

  const {
    data: {
      data: {
        application: { applicationId },
      },
    },
  } = await axios.post(SearchSgApi.create, data, {
    headers: {
      "Content-Type": "application/json",
      "User-Agent": ISOMER_UA,
      Authorization: `${tokenType} ${accessToken}`,
    },
  })

  console.log("Created search sg application with id:", applicationId)

  return applicationId
}

export const createSearchSgClientForStudio = async ({
  domain,
  name,
}: CreateSearchSgClientParams) => {
  // TODO: validate this to be #[0-9A-F]{6}
  const primary = await input({
    message:
      "Enter the hex value (eg: #FFFFFF) of the site's `colors.brand.canvas.inverse`:",
  })

  const { displayedName, dataDomain } = await askForDomainAndName({
    domain,
    name,
  })

  const applicationId = await createSearchSgClient({
    dataDomain,
    displayedName,
    domain,
    primary,
  })

  const searchConfigJson = {
    search: {
      type: "searchSG",
      clientId: applicationId,
    },
  }

  const urlJson = {
    url: `https://${domain}`,
  }

  const searchJsonRelativePath = `${domain}.search.json`
  writeFileSync(`./${searchJsonRelativePath}`, JSON.stringify(searchConfigJson))

  const urlRelativePath = `${domain}.url.json`
  writeFileSync(`./${urlRelativePath}`, JSON.stringify(urlJson))

  // TODO: Write to db
  await confirm({
    message: `Have you added the contents of ${searchJsonRelativePath} to Site.config?`,
  })
  await confirm({
    message: `Have you added the contents of ${urlRelativePath} to Site.config?`,
  })
  await confirm({
    message: `Have you added the contents of \`search.json\` to the site via Admin mode on Studio?`,
  })
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
