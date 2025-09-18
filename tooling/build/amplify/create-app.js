const {
  AmplifyClient,
  CreateAppCommand,
  CreateBranchCommand,
  StartJobCommand,
} = require("@aws-sdk/client-amplify")
const fs = require("fs")
const crypto = require("crypto")
require("dotenv").config()

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

const amplifyClient = new AmplifyClient({ region: "ap-southeast-1" })

// Function to generate a secure random password using Node.js crypto module
const generatePassword = () => {
  return crypto
    .randomBytes(12)
    .toString("base64")
    .replace(/[+/=]/g, "")
    .substring(0, 12)
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
      console.log(`✅ Main branch created with production environment`)
    })
    .then(() => {
      // Step 3: Create staging branch
      console.log(`🌿 Creating staging branch...`)
      return amplifyClient.send(
        new CreateBranchCommand({
          appId,
          branchName: "staging",
          framework: "Next.js - SSG",
          enableAutoBuild: true,
          basicAuthCredentials: Buffer.from(`user:${password}`).toString(
            "base64",
          ),
        }),
      )
    })
    .then(() => {
      console.log(`✅ Staging branch created with basic auth credentials`)
    })
    .then(() => {
      // Step 4: Start build jobs
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
      console.log(`✅ Build job started for main branch`)
    })
    .then(() => {
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
      console.log(`✅ Build job started for staging branch`)
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
  if (!process.env.GITHUB_TOKEN) {
    console.error("❌ Error: GITHUB_TOKEN environment variable is required")
    console.log("Please set your GitHub personal access token:")
    console.log("export GITHUB_TOKEN=your_token_here")
    console.log("Or create a .env file with: GITHUB_TOKEN=your_token_here")
    process.exit(1)
  }

  // TODO: UPDATE THIS TO THE ACTUAL APPS
  const apps = ["hello-adrian-test-script-next"]

  if (apps.length === 0) {
    console.error("❌ Error: No app names defined in apps array")
    process.exit(1)
  }

  const appResults = []

  console.log(`🚀 Starting creation of ${apps.length} Amplify apps...`)
  console.log(`📋 Apps to create: ${apps.join(", ")}`)
  console.log("")

  // Process each app sequentially using promises
  let currentIndex = 0

  const processNextApp = () => {
    if (currentIndex >= apps.length) {
      // All apps processed, generate output
      generateOutput()
      return
    }

    const app = apps[currentIndex]
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
    console.log(`📊 Processed ${apps.length} apps`)

    // Generate output file
    if (appResults.length > 0) {
      const outputContent = appResults
        .map(
          (result) => `${result.repoName},${result.appId},${result.password}`,
        )
        .join("\n")

      fs.writeFileSync("amplify-apps-output.txt", outputContent)
      console.log(`\n📄 Output file generated: amplify-apps-output.txt`)
      console.log(`📋 Format: REPO_NAME,AMPLIFY_APP_ID,STAGING_PASSWORD`)
      console.log(
        `📊 Successfully created ${appResults.length} out of ${apps.length} apps`,
      )
    } else {
      console.log(`\n⚠️  No apps were successfully created`)
    }
  }

  processNextApp()
}

main()
