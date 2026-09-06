import {
  AutofillBehavior,
  createClient,
  ItemCategory,
  ItemFieldType,
} from "@1password/sdk"
import dotenv from "dotenv"
import fs from "node:fs"
import { pathToFileURL } from "node:url"

dotenv.config()

const INPUT_FILE_PATH = ""

const loadAppDataFromFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`)
  }

  const content = fs.readFileSync(filePath, "utf-8")
  const lines = content
    .trim()
    .split("\n")
    .filter((line) => line.trim() !== "")

  return lines.map((line) => {
    const [repoName, amplifyAppId, password] = line.split(",")
    if (
      repoName === undefined ||
      amplifyAppId === undefined ||
      password === undefined ||
      repoName === "" ||
      amplifyAppId === "" ||
      password === ""
    ) {
      throw new Error(
        `Invalid line format: ${line}. Expected: REPO_NAME,AMPLIFY_APP_ID,PASSWORD`,
      )
    }
    return { amplifyAppId, password, repoName }
  })
}

class OnePasswordItemCreator {
  client = null

  constructor() {
    this.vaultId = process.env.OP_VAULT_ID
    this.username = process.env.AWS_AMPLIFY_USERNAME
  }

  async initialize() {
    console.log("🔐 Initializing 1Password service account authentication...")

    try {
      this.client = await createClient({
        auth: process.env.OP_SERVICE_ACCOUNT_TOKEN,
        integrationName: "Isomer 1Password Integration",
        integrationVersion: "v1.0.0",
      })

      console.log(`✅ Client initialized successfully`)

      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error(
        "❌ Service account authentication verification failed:",
        message,
      )
      console.log("\nPlease ensure:")
      console.log(
        "1. OP_SERVICE_ACCOUNT_TOKEN environment variable is set correctly",
      )
      console.log("2. You have access to the specified vault")
      console.log("3. OP_VAULT_ID environment variable is set correctly")
      console.log("4. Your service account has the necessary permissions")
      return false
    }
  }

  async createLoginItem(repoName, password, amplifyAppId) {
    console.log(`🔐 Creating login item for: ${repoName}`)

    const itemData = {
      category: ItemCategory.Login,
      fields: [
        {
          fieldType: ItemFieldType.Text,
          id: "username",
          title: "username",
          value: this.username,
        },
        {
          fieldType: ItemFieldType.Concealed,
          id: "password",
          title: "password",
          value: password,
        },
        {
          fieldType: ItemFieldType.Url,
          id: "github_repository",
          title: "GitHub Repository",
          value: `https://github.com/isomerpages/${repoName}`,
        },
        {
          fieldType: ItemFieldType.Url,
          id: "amplify_console",
          title: "Amplify Console",
          value: `https://ap-southeast-1.console.aws.amazon.com/amplify/apps/${amplifyAppId}/overview`,
        },
      ],
      title: `${repoName} - Amplify Staging`,
      vaultId: this.vaultId,
      websites: [
        {
          autofillBehavior: AutofillBehavior.AnywhereOnWebsite,
          label: "url",
          url: `https://staging.${amplifyAppId}.amplifyapp.com/`,
        },
      ],
    }

    try {
      const result = await this.client.items.create(itemData)
      console.log(`✅ Login item created for: ${repoName}`)
      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error(`❌ Error creating login item for ${repoName}:`, message)
      throw error
    }
  }
}

const main = async () => {
  const requiredEnvVars = [
    {
      description: "1Password service account token for authentication",
      example: "export OP_SERVICE_ACCOUNT_TOKEN=your_service_account_token",
      name: "OP_SERVICE_ACCOUNT_TOKEN",
    },
    {
      description: "1Password vault ID where items will be created",
      example: "export OP_VAULT_ID=your_vault_id_here",
      name: "OP_VAULT_ID",
    },
    {
      description: "Username for the login items",
      example: "export AWS_AMPLIFY_USERNAME=the_username",
      name: "AWS_AMPLIFY_USERNAME",
    },
  ]

  const missingEnvVars = requiredEnvVars.filter(
    (envVar) => process.env[envVar.name] === undefined,
  )

  if (missingEnvVars.length > 0) {
    console.error("❌ Error: Missing required environment variables:")
    for (const envVar of missingEnvVars) {
      console.error(`   - ${envVar.name}: ${envVar.description}`)
    }
    console.log("\nPlease set the missing environment variables:")
    for (const envVar of missingEnvVars) {
      console.log(envVar.example)
    }
    console.log("Or create a .env file with all required variables")
    process.exit(1)
  }

  if (!fs.existsSync(INPUT_FILE_PATH)) {
    console.error(`❌ Error: Input file not found: ${INPUT_FILE_PATH}`)
    console.log(
      "Please ensure the Amplify output CSV file exists at the specified path.",
    )
    process.exit(1)
  }

  const creator = new OnePasswordItemCreator()

  const isInitialized = await creator.initialize()
  if (!isInitialized) {
    process.exit(1)
  }

  console.log(`📄 Loading app data from file: ${INPUT_FILE_PATH}`)
  const appData = loadAppDataFromFile(INPUT_FILE_PATH)

  if (appData.length === 0) {
    console.error("❌ Error: No app data provided")
    process.exit(1)
  }

  const results = []

  console.log(
    `🚀 Starting creation of 1Password items for ${appData.length} apps...`,
  )
  console.log(
    `📋 Apps to process: ${appData.map((app) => app.repoName).join(", ")}`,
  )
  console.log("")

  for (const app of appData) {
    const { repoName, password, amplifyAppId } = app

    console.log(`\n📦 Processing: ${repoName}`)
    console.log("=".repeat(50))

    try {
      const loginItem = await creator.createLoginItem(
        repoName,
        password,
        amplifyAppId,
      )

      console.log(`✅ Successfully created login item for: ${repoName}`)
      results.push({
        amplifyAppId,
        itemId: loginItem.id,
        repoName,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error(`❌ Failed to create login item for ${repoName}:`, message)
    }
  }

  console.log(`\n🎉 Batch processing complete!`)
  console.log(`📊 Processed ${appData.length} apps`)

  if (results.length > 0) {
    console.log(
      `\n✅ Successfully created 1Password login items for ${results.length} out of ${appData.length} apps:`,
    )
    for (const result of results) {
      console.log(`   📦 ${result.repoName}: Login item created`)
    }
  } else {
    console.log(`\n⚠️  No items were successfully created`)
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await main()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("❌ Fatal error:", message)
    process.exit(1)
  }
}

export { OnePasswordItemCreator }
