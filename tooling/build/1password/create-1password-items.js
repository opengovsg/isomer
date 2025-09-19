const {
  createClient,
  ItemCategory,
  ItemFieldType,
  AutofillBehavior,
} = require("@1password/sdk")
const fs = require("fs")
require("dotenv").config()

// Input file path - update this to point to your Amplify output file
const INPUT_FILE_PATH = ""

class OnePasswordItemCreator {
  constructor() {
    this.client = null
    this.vaultId = process.env.OP_VAULT_ID
    this.username = process.env.AWS_AMPLIFY_USERNAME
  }

  async initialize() {
    console.log("🔐 Initializing 1Password service account authentication...")

    try {
      // Initialize the client with service account token
      this.client = await createClient({
        auth: process.env.OP_SERVICE_ACCOUNT_TOKEN,
        integrationName: "Isomer 1Password Integration",
        integrationVersion: "v1.0.0",
      })

      console.log(`✅ Client initialized successfully`)

      return true
    } catch (error) {
      console.error(
        "❌ Service account authentication verification failed:",
        error.message,
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
      title: `${repoName} - Amplify Staging`,
      category: ItemCategory.Login,
      vaultId: this.vaultId,
      fields: [
        {
          id: "username",
          title: "username",
          fieldType: ItemFieldType.Text,
          value: this.username,
        },
        {
          id: "password",
          title: "password",
          fieldType: ItemFieldType.Concealed,
          value: password,
        },
        {
          id: "github_repository",
          title: "GitHub Repository",
          fieldType: ItemFieldType.Url,
          value: `https://github.com/isomerpages/${repoName}`,
        },
        {
          id: "amplify_console",
          title: "Amplify Console",
          fieldType: ItemFieldType.Url,
          value: `https://ap-southeast-1.console.aws.amazon.com/amplify/apps/${amplifyAppId}/overview`,
        },
      ],
      websites: [
        {
          url: `https://staging.${amplifyAppId}.amplifyapp.com/`,
          label: "url",
          autofillBehavior: AutofillBehavior.AnywhereOnWebsite,
        },
      ],
    }

    try {
      const result = await this.client.items.create(itemData)
      console.log(`✅ Login item created for: ${repoName}`)
      return result
    } catch (error) {
      console.error(
        `❌ Error creating login item for ${repoName}:`,
        error.message,
      )
      throw error
    }
  }

  loadAppDataFromFile(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`)
      }

      const content = fs.readFileSync(filePath, "utf8")
      const lines = content
        .trim()
        .split("\n")
        .filter((line) => line.trim())

      return lines.map((line) => {
        const [repoName, amplifyAppId, password] = line.split(",")
        if (!repoName || !amplifyAppId || !password) {
          throw new Error(
            `Invalid line format: ${line}. Expected: REPO_NAME,AMPLIFY_APP_ID,PASSWORD`,
          )
        }
        return { repoName, amplifyAppId, password }
      })
    } catch (error) {
      console.error(`❌ Error loading app data from file:`, error.message)
      throw error
    }
  }
}

// Main execution
async function main() {
  // Check for required environment variables
  const requiredEnvVars = [
    {
      name: "OP_SERVICE_ACCOUNT_TOKEN",
      description: "1Password service account token for authentication",
      example: "export OP_SERVICE_ACCOUNT_TOKEN=your_service_account_token",
    },
    {
      name: "OP_VAULT_ID",
      description: "1Password vault ID where items will be created",
      example: "export OP_VAULT_ID=your_vault_id_here",
    },
    {
      name: "AWS_AMPLIFY_USERNAME",
      description: "Username for the login items",
      example: "export AWS_AMPLIFY_USERNAME=the_username",
    },
  ]

  const missingEnvVars = requiredEnvVars.filter(
    (envVar) => !process.env[envVar.name],
  )

  if (missingEnvVars.length > 0) {
    console.error("❌ Error: Missing required environment variables:")
    missingEnvVars.forEach((envVar) => {
      console.error(`   - ${envVar.name}: ${envVar.description}`)
    })
    console.log("\nPlease set the missing environment variables:")
    missingEnvVars.forEach((envVar) => {
      console.log(envVar.example)
    })
    console.log("Or create a .env file with all required variables")
    process.exit(1)
  }

  // Load data from file
  if (!fs.existsSync(INPUT_FILE_PATH)) {
    console.error(`❌ Error: Input file not found: ${INPUT_FILE_PATH}`)
    console.log(
      "Please ensure the Amplify output CSV file exists at the specified path.",
    )
    process.exit(1)
  }

  const creator = new OnePasswordItemCreator()

  // Initialize the 1Password client
  const isInitialized = await creator.initialize()
  if (!isInitialized) {
    process.exit(1)
  }

  console.log(`📄 Loading app data from file: ${INPUT_FILE_PATH}`)
  const appData = creator.loadAppDataFromFile(INPUT_FILE_PATH)

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

  // Process each app sequentially
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
        repoName,
        amplifyAppId,
        itemId: loginItem.id,
      })
    } catch (error) {
      console.error(
        `❌ Failed to create login item for ${repoName}:`,
        error.message,
      )
    }
  }

  // Generate summary
  console.log(`\n🎉 Batch processing complete!`)
  console.log(`📊 Processed ${appData.length} apps`)

  if (results.length > 0) {
    console.log(
      `\n✅ Successfully created 1Password login items for ${results.length} out of ${appData.length} apps:`,
    )
    results.forEach((result) => {
      console.log(`   📦 ${result.repoName}: Login item created`)
    })
  } else {
    console.log(`\n⚠️  No items were successfully created`)
  }
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error("❌ Fatal error:", error.message)
    process.exit(1)
  })
}

module.exports = { OnePasswordItemCreator }
