const {
  AmplifyClient,
  CreateAppCommand,
  CreateBranchCommand,
  StartJobCommand,
} = require("@aws-sdk/client-amplify")
const fs = require("fs")
const crypto = require("crypto")
require("dotenv").config()

// TODO: UPDATE THIS TO THE ACTUAL APPS
const REPO_NAMES = ["hello-adrian-test-script-next"]

const AMPLIFY_BUILD_SPEC = `
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - rm -rf node_modules && rm -rf .next
        - curl https://raw.githubusercontent.com/opengovsg/isomer/main/tooling/build/scripts/preBuild.sh | bash
    build:
      commands:
        - curl https://raw.githubusercontent.com/opengovsg/isomer/main/tooling/build/scripts/build.sh | bash
  artifacts:
    baseDirectory: out
    files:
      - '**/*'
`

const amplifyClient = new AmplifyClient({
  region: "ap-southeast-1",
  retryMode: "standard",
  maxAttempts: 3,
})

// Function to generate a secure random password using Node.js crypto module
const generatePassword = () => {
  let password = ""

  // Keep generating until we have at least 12 characters
  while (password.length < 12) {
    const randomString = crypto
      .randomBytes(16)
      .toString("base64")
      .replace(/[+/=]/g, "")
    password += randomString
  }

  return password.substring(0, 12)
}

const createApp = (appName) => {
  console.log(`🚀 Creating Amplify app: ${appName}`)
  let appId = ""
  const password = generatePassword()

  const params = new CreateAppCommand({
    name: appName,
    accessToken: process.env.GITHUB_TOKEN,
    repository: `https://github.com/isomerpages/${appName}`,
    buildSpec: AMPLIFY_BUILD_SPEC,
    environmentVariables: {
      NEXT_PUBLIC_ISOMER_NEXT_ENVIRONMENT: "staging",
    },
    customRules: [
      {
        source: "</^[^.]+$|\\.(?!(txt)$)([^.]+$)/>",
        target: "/404.html",
        status: "404",
      },
    ],
  })

  // Step 1: Create the Amplify app
  console.log(`📱 Creating Amplify app from repository...`)
  return amplifyClient
    .send(params)
    .then((appInfo) => {
      appId = appInfo.app?.appId
      console.log(`✅ Amplify app created with ID: ${appId}`)
    })
    .then(() => {
      // Step 2: Create main branch
      console.log(`🌿 Creating main branch...`)
      return amplifyClient.send(
        new CreateBranchCommand({
          appId,
          branchName: "main",
          framework: "Next.js - SSG",
          enableAutoBuild: true,
          environmentVariables: {
            NEXT_PUBLIC_ISOMER_NEXT_ENVIRONMENT: "production",
          },
        }),
      )
    })
    .then(() => {
      // Step 3: Create staging branch
      console.log(`🌿 Creating staging branch with basic auth credentials...`)
      return amplifyClient.send(
        new CreateBranchCommand({
          appId,
          branchName: "staging",
          framework: "Next.js - SSG",
          enableAutoBuild: true,
          enableBasicAuth: true,
          basicAuthCredentials: Buffer.from(
            `${process.env.AMPLIFY_BASIC_AUTH_USERNAME}:${password}`,
          ).toString("base64"),
        }),
      )
    })
    .then(() => {
      // Step 4: Start build jobs (main branch)
      console.log(`🔨 Starting build job for main branch...`)
      return amplifyClient.send(
        new StartJobCommand({
          appId,
          branchName: "main",
          jobType: "RELEASE",
        }),
      )
    })
    .then(() => {
      // Step 5: Start build jobs (staging branch)
      console.log(`🔨 Starting build job for staging branch...`)
      return amplifyClient.send(
        new StartJobCommand({
          appId,
          branchName: "staging",
          jobType: "RELEASE",
        }),
      )
    })
    .then(() => {
      console.log(`🎉 Amplify app setup complete!`)

      // Return app information for output file
      return {
        repoName: appName,
        appId: appId,
        password: password,
      }
    })
    .catch((error) => {
      console.error(`❌ Error creating Amplify app: ${error.message}`)
      throw error
    })
}

const main = async () => {
  // Check for required environment variables
  const requiredEnvVars = [
    {
      name: "GITHUB_TOKEN",
      description: "GitHub personal access token",
      example: "export GITHUB_TOKEN=your_token_here",
    },
    {
      name: "AMPLIFY_BASIC_AUTH_USERNAME",
      description: "Username for Amplify basic authentication",
      example: "export AMPLIFY_BASIC_AUTH_USERNAME=your_username",
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

  if (REPO_NAMES.length === 0) {
    console.error("❌ Error: No app names defined in apps array")
    process.exit(1)
  }

  const appResults = []

  console.log(`🚀 Starting creation of ${REPO_NAMES.length} Amplify apps...`)
  console.log(`📋 Apps to create: ${REPO_NAMES.join(", ")}`)
  console.log("")

  // Process each app sequentially using promises
  let currentIndex = 0

  const processNextApp = () => {
    if (currentIndex >= REPO_NAMES.length) {
      // All apps processed, generate output
      generateOutput()
      return
    }

    const app = REPO_NAMES[currentIndex]
    console.log(`\n📦 Processing: ${app}`)
    console.log("=".repeat(50))

    createApp(app)
      .then((result) => {
        appResults.push(result)
        console.log(`✅ Successfully created app: ${app}`)
        currentIndex++
      })
      .then(() => {
        processNextApp()
      })
      .catch((error) => {
        console.error(`❌ Failed to create app ${app}:`, error.message)
        currentIndex++
        processNextApp()
      })
  }

  const generateOutput = () => {
    console.log(`\n🎉 Batch processing complete!`)
    console.log(`📊 Processed ${REPO_NAMES.length} apps`)

    // Generate output file
    if (appResults.length > 0) {
      const outputContent = appResults
        .map(
          (result) => `${result.repoName},${result.appId},${result.password}`,
        )
        .join("\n")

      // Create timestamped filename
      const now = new Date()
      const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, -5) // Format: YYYY-MM-DDTHH-MM-SS
      const filename = `amplify-apps-output-${timestamp}.csv`

      fs.writeFileSync(filename, outputContent)
      console.log(`\n📄 Output file generated: ${filename}`)
      console.log(
        `📊 Successfully created ${appResults.length} out of ${REPO_NAMES.length} apps`,
      )
    } else {
      console.log(`\n⚠️  No apps were successfully created`)
    }
  }

  processNextApp()
}

main()
