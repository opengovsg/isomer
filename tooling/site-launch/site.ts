import { Client } from "pg"

interface CreateBaseSiteProps {
  name: string
  codeBuildId: string
}

type Theme = {
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
    connectionString: process.env.DATABASE_URL,
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
}: CreateBaseSiteProps): Promise<number> => {
  const res = await runDbAction<number>(async (client) => {
    const result = await client.query(
      `INSERT INTO public."Site" (name, config, "codeBuildId", theme) VALUES ($1, $2, $3, $4) RETURNING id`,
      [name, {}, codeBuildId, {}],
    )

    console.log(result.rows[0].id)
    return result.rows[0].id
  })

  return res
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
