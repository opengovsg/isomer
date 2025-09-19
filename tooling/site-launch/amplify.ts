import {
  AmplifyClient,
  ListAppsCommand,
  ListJobsCommand,
} from "@aws-sdk/client-amplify"
import { fromSSO } from "@aws-sdk/credential-providers"

const credentials = fromSSO({
  profile: "isomer-classic",
})

const client = new AmplifyClient({
  credentials,
  region: "ap-southeast-1",
})

async function getLastBuild(appId: string, branchName = "staging") {
  const command = new ListJobsCommand({
    appId: appId,
    branchName: branchName,
    maxResults: 1, // Get only the most recent job
  })

  const response = await client.send(command)
  return response.jobSummaries?.[0] // Returns the latest build job
}

const listApps = async () => {
  const all = []
  let hasNext = true
  let token: string | undefined

  while (hasNext) {
    const { apps, nextToken } = await client.send(
      new ListAppsCommand({ maxResults: 100, nextToken: token }),
    )

    if (!nextToken) {
      break
    }

    all.push(...(apps ?? []))
    token = nextToken
  }

  return all
}

export const checkLastBuild = async (repo: string) => {
  const apps = await listApps()
  const matchingApp = apps.find((app) => app.name === repo)

  if (!matchingApp) {
    console.log(`No matching app found for codebuildId: ${repo}`)
    console.log(
      "Please ensure that the CodeBuild ID is correct and check the last build on amplify manually",
    )

    return
  }

  const lastBuild = await getLastBuild(matchingApp.appId!)

  return lastBuild?.status
}
