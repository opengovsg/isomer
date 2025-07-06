import fs, { writeFileSync } from "fs"
import { confirm, input } from "@inquirer/prompts"
import axios from "axios"
import { exec } from "utils"

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
      environment: "non-production",
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

export const createSearchSgClient = async ({
  domain,
  name,
}: CreateSearchSgClientParams) => {
  const authToken = fs.readFileSync(".searchsg").toString().trim()

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

  // TODO: validate this to be #[0-9A-F]{6}
  const primary = await input({
    message:
      "Enter the hex value (eg: #FFFFFF) of the site's `colors.brand.canvas.inverse`:",
  })

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

  const data = generateRequestData({
    domain: dataDomain,
    name,
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

  console.log(applicationId)

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

  const isGithub = await confirm({ message: "Is your site on Github?" })

  // TODO: Write for users
  if (isGithub) {
    await confirm({
      message: `Add the contents of ${urlRelativePath} to the data/config.json -> site`,
    })
    await confirm({
      message: `Add the contents of ${searchJsonRelativePath} to data/config.json -> site`,
    })
    await confirm({
      message: `Add the contents of \`search.json\` to the \`schema\` folder`,
    })
  } else {
    await confirm({
      message: `Add the contents of ${searchJsonRelativePath} to Site.config`,
    })
    await confirm({
      message: `Add the contents of ${urlRelativePath} to Site.config`,
    })
    await confirm({
      message: `Add the contents of \`search.json\` to the site via Admin mode on Studio`,
    })
  }
}
