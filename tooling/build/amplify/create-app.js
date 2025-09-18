const {
  AmplifyClient,
  CreateAppCommand,
  CreateBranchCommand,
  UpdateBranchCommand,
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

const createApp = async (appName) => {
  console.log("Creating app:", appName)
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

  await amplifyClient
    .send(params)
    .then((appInfo) => {
      appId = appInfo.app?.appId

      const mainBranchParams = new CreateBranchCommand({
        appId,
        branchName: "main",
        framework: "Next.js - SSG",
        enableAutoBuild: true,
        environmentVariables: {
          NEXT_PUBLIC_ISOMER_NEXT_ENVIRONMENT: "production",
        },
      })

      return amplifyClient.send(mainBranchParams)
    })
    .then(() =>
      amplifyClient.send(
        new CreateBranchCommand({
          appId,
          branchName: "staging",
          framework: "Next.js - SSG",
          enableAutoBuild: true,
        }),
      ),
    )
    .then(() =>
      amplifyClient.send(
        new UpdateBranchCommand({
          appId,
          branchName: "staging",
          enableBasicAuth: true,
          basicAuthCredentials: Buffer.from(`user:${password}`).toString(
            "base64",
          ),
        }),
      ),
    )
    .then(() =>
      amplifyClient.send(
        new StartJobCommand({
          appId,
          branchName: "main",
          jobType: "RELEASE",
        }),
      ),
    )
    .then(() =>
      amplifyClient.send(
        new StartJobCommand({
          appId,
          branchName: "staging",
          jobType: "RELEASE",
        }),
      ),
    )

  // Return app information for output file
  return {
    repoName: appName,
    appId: appId,
    password: password,
  }
}

const main = async () => {
  // TODO: UPDATE THIS TO THE ACTUAL APPS
  const apps = ["hello-adrian-test-script-next"]

  const appResults = []

  for (const app of apps) {
    try {
      const result = await createApp(app)
      appResults.push(result)
      console.log(`Successfully created app: ${app}`)
    } catch (error) {
      console.error(`Failed to create app ${app}:`, error)
    }
  }

  // Generate output file
  const outputContent = appResults
    .map((result) => `${result.repoName},${result.appId},${result.password}`)
    .join("\n")

  fs.writeFileSync("amplify-apps-output.txt", outputContent)
  console.log("Output file generated: amplify-apps-output.txt")
  console.log("Format: REPO_NAME,AMPLIFY_APP_ID,STAGING_PASSWORD")
}

main()
