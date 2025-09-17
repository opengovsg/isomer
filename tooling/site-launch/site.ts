import { Client } from "pg"

interface CreateBaseSiteProps {
  name: string
  codeBuildId: string
}

export const createBaseSiteInStudio = async ({
  name,
  codeBuildId,
}: CreateBaseSiteProps): Promise<string> => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })
  await client.connect()

  console.log(`Connected to database`)

  const result = await client.query(
    `INSERT INTO public."Site" (name, config, "codeBuildId", theme) VALUES ($1, $2, $3, $4) RETURNING id`,
    [name, {}, codeBuildId, {}],
  )

  await client.end()
  console.log(`Disconnected from database`)
  console.log(result.rows[0].id)
  const id = result.rows[0].id
  return String(id)
}
