import { Client } from "pg"

import {
  createBlob,
  createFirstVersion,
  createResource,
} from "@isomer/seed-from-repo"

import { env } from "./env"
import searchJson from "./search.json"

interface CreateBaseSiteProps {
  name: string
  codeBuildId: string
}

interface Config {
  config: {
    theme: "isomer-next"
    logoUrl: string
    siteName: string
    isGovernment: boolean
  }
}

interface Theme {
  theme: {
    colors: {
      brand: {
        canvas: {
          alt: `#${string}`
          default: `#${string}`
          inverse: `#${string}`
          backdrop: `#${string}`
        }
        interaction: {
          hover: `#${string}`
          default: `#${string}`
          pressed: `#${string}`
        }
      }
    }
  }
}

type DbAction<T> = (client: Client) => Promise<T>

const runDbAction = async <T>(cb: DbAction<T>) => {
  const client = new Client({
    connectionString: env.DATABASE_URL,
  })
  await client.connect()
  console.log(`Connected to database`)

  const res = await cb(client)

  await client.end()
  console.log(`Disconnected from database`)

  return res
}

export const createBaseSiteInStudio = async ({
  name,
  codeBuildId,
}: CreateBaseSiteProps): Promise<string> => {
  const res = await runDbAction<number>(async (client) => {
    const result = await client.query(
      `INSERT INTO public."Site" (name, config, "codeBuildId", theme) VALUES ($1, $2, $3, $4) RETURNING id`,
      [name, {}, codeBuildId, {}],
    )

    console.log(result.rows[0].id)
    return result.rows[0].id
  })

  return res.toString()
}

export const getSiteTheme = async (siteId: number) => {
  return await runDbAction<Theme>(async (client) => {
    const result = await client.query(
      `SELECT theme from public."Site" where "id" = $1`,
      [siteId],
    )

    return result.rows[0]
  })
}

export const getSiteConfig = async (siteId: number) => {
  return await runDbAction<Config>(async (client) => {
    const result = await client.query(
      `SELECT config from public."Site" where "id" = $1`,
      [siteId],
    )

    return result.rows[0]
  })
}

export const updateSiteConfigWithSearch = async (
  siteId: number,
  url: string,
  clientId: string,
) => {
  const { config } = await getSiteConfig(siteId)

  const updatedConfig = {
    ...config,
    search: {
      type: "searchSG",
      clientId,
    },
    url,
  }

  await runDbAction<void>(async (client) => {
    const result = await client.query(
      `UPDATE public."Site" SET config = $1 WHERE "id" = $2 RETURNING config`,
      [updatedConfig, siteId],
    )

    console.log(result.rows[0])
    return result.rows[0]
  })
}

const getSearchResourceForSite = async (siteId: number) => {
  return await runDbAction(async (client) => {
    return client.query(
      `SELECT id from public."Resource" where "Resource"."permalink" = 'search' and "Resource"."siteId" = $1 and "Resource"."parentId" IS NULL`,
      [siteId],
    )
  })
}

export const createSearchPageForSite = async (siteId: number) => {
  const existingSearchResource = await getSearchResourceForSite(siteId)
  if (
    existingSearchResource &&
    existingSearchResource.rowCount &&
    existingSearchResource.rowCount > 0
  )
    return existingSearchResource.rows[0].id as string

  await runDbAction<number>(async (client) => {
    const blobId = await createBlob(client, searchJson)
    const resourceId = await createResource(client, {
      title: "Search",
      permalink: "search",
      type: "Page",
      siteId,
      parentId: null,
    })

    await createFirstVersion(client, resourceId, blobId)

    return resourceId
  })
}

export const updateCodebuildId = async (
  siteId: number,
  codebuildId: string,
) => {
  return await runDbAction<string>(async (client) => {
    const result = await client.query(
      `UPDATE public."Site" SET "codeBuildId" = $1 WHERE "id" = $2 RETURNING config`,
      [codebuildId, siteId],
    )

    console.log(result.rows[0])
    return result.rows[0]
  })
}
