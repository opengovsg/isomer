import {
  AmplifyClient,
  CreateAppCommand,
  CreateBranchCommand,
  StartJobCommand,
} from "@aws-sdk/client-amplify"
import dotenv from "dotenv"
import fs from "node:fs"

import { AMPLIFY_BUILD_SPEC } from "./constants.js"
import { generatePassword } from "./utils.js"

dotenv.config()

// Apps to provision via this script
const REPO_NAMES = ["hello-adrian-test-script-next"]

const amplifyClient = new AmplifyClient({
  maxAttempts: 3,
  region: "ap-southeast-1",
  retryMode: "standard",
})

const createApp = async (appName) => {
  console.log(`🚀 Creating Amplify app: ${appName}`)
  const password = generatePassword()

  const params = new CreateAppCommand({
    accessToken: process.env.GITHUB_TOKEN,
    buildSpec: AMPLIFY_BUILD_SPEC,
    customRules: [
      {
        source: "</^[^.]+$|\\.(?!(txt)$)([^.]+$)/>",
        status: "404",
        target: "/404.html",
      },
    ],
    environmentVariables: {
      NEXT_PUBLIC_ISOMER_NEXT_ENVIRONMENT: "staging",
    },
    name: appName,
    repository: `https://github.com/isomerpages/${appName}`,
  })

  try {
    // Step 1: Create the Amplify app
    console.log(`📱 Creating Amplify app from repository...`)
    const appInfo = await amplifyClient.send(params)
    const appId = appInfo.app?.appId ?? ""
    console.log(`✅ Amplify app created with ID: ${appId}`)

    // Step 2: Create main branch
    console.log(`🌿 Creating main branch...`)
    await amplifyClient.send(
      new CreateBranchCommand({
        appId,
        branchName: "main",
        enableAutoBuild: true,
        environmentVariables: {
          NEXT_PUBLIC_ISOMER_NEXT_ENVIRONMENT: "production",
        },
        framework: "Next.js - SSG",
      }),
    )

    // Step 3: Create staging branch
    console.log(`🌿 Creating staging branch with basic auth credentials...`)
    await amplifyClient.send(
      new CreateBranchCommand({
        appId,
        basicAuthCredentials: Buffer.from(
          `${process.env.AMPLIFY_BASIC_AUTH_USERNAME}:${password}`,
        ).toString("base64"),
        branchName: "staging",
        enableAutoBuild: true,
        enableBasicAuth: true,
        framework: "Next.js - SSG",
      }),
    )

    // Step 4: Start build jobs (main branch)
    console.log(`🔨 Starting build job for main branch...`)
    await amplifyClient.send(
      new StartJobCommand({
        appId,
        branchName: "main",
        jobType: "RELEASE",
      }),
    )

    // Step 5: Start build jobs (staging branch)
    console.log(`🔨 Starting build job for staging branch...`)
    await amplifyClient.send(
      new StartJobCommand({
        appId,
        branchName: "staging",
        jobType: "RELEASE",
      }),
    )

    console.log(`🎉 Amplify app setup complete!`)

    return {
      appId,
      password,
      repoName: appName,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`❌ Error creating Amplify app: ${message}`)
    throw error
  }
}

const main = async () => {
  const requiredEnvVars = [
    {
      description: "GitHub personal access token",
      example: "export GITHUB_TOKEN=your_token_here",
      name: "GITHUB_TOKEN",
    },
    {
      description: "Username for Amplify basic authentication",
      example: "export AMPLIFY_BASIC_AUTH_USERNAME=your_username",
      name: "AMPLIFY_BASIC_AUTH_USERNAME",
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

  if (REPO_NAMES.length === 0) {
    console.error("❌ Error: No app names defined in apps array")
    process.exit(1)
  }

  const appResults = []

  console.log(`🚀 Starting creation of ${REPO_NAMES.length} Amplify apps...`)
  console.log(`📋 Apps to create: ${REPO_NAMES.join(", ")}`)
  console.log("")

  for (const app of REPO_NAMES) {
    console.log(`\n📦 Processing: ${app}`)
    console.log("=".repeat(50))

    try {
      const result = await createApp(app)
      appResults.push(result)
      console.log(`✅ Successfully created app: ${app}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error(`❌ Failed to create app ${app}:`, message)
    }
  }

  console.log(`\n🎉 Batch processing complete!`)
  console.log(`📊 Processed ${REPO_NAMES.length} apps`)

  if (appResults.length > 0) {
    const outputContent = appResults
      .map((result) => `${result.repoName},${result.appId},${result.password}`)
      .join("\n")

    const now = new Date()
    const timestamp = now.toISOString().replaceAll(/[:.]/gu, "-").slice(0, -5)
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

void main()
