import fs from "fs/promises"
import path from "path"

const __dirname = import.meta.dirname

const NOW = new Date()

const NOW_STRING =
  String(NOW.getUTCFullYear()) +
  String(NOW.getUTCMonth() + 1).padStart(2, "0") +
  String(NOW.getUTCDate()).padStart(2, "0") +
  String(NOW.getUTCHours()).padStart(2, "0") +
  String(NOW.getUTCMinutes()).padStart(2, "0") +
  String(NOW.getUTCSeconds()).padStart(2, "0")

const PRISMA_MIGRATIONS_PATH = path.join(__dirname, "../migrations")
const MIGRATION_FILE_NAME = "migration.sql"

const MIGRATION_NAME = "custom_migration"

const CUSTOM_MIGRATION_NAME = `${NOW_STRING}_${MIGRATION_NAME}`

const CUSTOM_MIGRATIONS_RECORD = path.join(__dirname, MIGRATION_FILE_NAME)

const custom = async () => {
  const files = await fs.readdir(PRISMA_MIGRATIONS_PATH, {
    withFileTypes: true,
  })
  const folders = files
    .filter((file) => /^\d{14}_.+/.test(file.name) && file.isDirectory())
    .filter((folder) => folder.name.includes(MIGRATION_NAME))

  let statements = (await fs.readFile(CUSTOM_MIGRATIONS_RECORD))
    .toString()
    .split(";")
    .map((statement) => statement.trim() + ";")
    .filter((statement) => !!statement.length)

  for (const folder of folders) {
    const filePath = path.join(
      folder.parentPath,
      folder.name,
      MIGRATION_FILE_NAME,
    )

    const file = await fs.readFile(filePath)

    const fileStatements = file
      .toString()
      .split(";")
      .map((statement) => statement.trim() + ";")
      .filter((statement) => !!statement.length)

    statements = statements.filter(
      (statement) => !fileStatements.includes(statement),
    )
  }

  if (!statements.length) {
    console.log("All custom migrations are up to date.")
    return
  }

  statements = statements.map((statement) => statement.trim() + "\n\n")

  await fs.mkdir(path.join(PRISMA_MIGRATIONS_PATH, CUSTOM_MIGRATION_NAME))
  await fs.writeFile(
    path.join(
      PRISMA_MIGRATIONS_PATH,
      CUSTOM_MIGRATION_NAME,
      MIGRATION_FILE_NAME,
    ),
    statements,
  )
  console.log("New custom migrations added.")
}

custom().catch((error) => console.error(error))
