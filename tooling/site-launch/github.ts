import { Octokit } from "@octokit/rest"

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
})

const owner = "isomerpages"

export const commitAndCreatePR = async (domain: string, rawContent: string) => {
  const repo = "isomer-indirection"
  const filename = domain.replace(/^www\./, "")
  const filePath = `dns/${filename}.ts`
  const commitMessage = `[AUTOMATED]: Site launch for ${domain}`
  const prTitle = `[AUTOMATED]: Site launch for ${domain}`
  const content = Buffer.from(rawContent).toString("base64")

  try {
    // Step 1: Create or update file content
    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: filePath,
      message: commitMessage,
      content,
      branch: "staging",
    })

    // Step 2: Create pull request
    const { data: pullRequest } = await octokit.rest.pulls.create({
      owner,
      repo,
      title: prTitle,
      head: "staging",
      base: "main",
    })

    console.log(
      `Pull request created: ${pullRequest.html_url}, ask another @isoengineer to approve it`,
    )
    return pullRequest
  } catch (error) {
    console.error("Error:", error)
  }
}

export const readSiteConfig = async (repo: string) => {
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: "data/config.json",
      ref: "staging", // Read from staging branch
    })

    const content = Buffer.from((data as any).content, "base64").toString(
      "utf8",
    )
    const parsedJson = JSON.parse(content) as Record<string, any>

    return { content: parsedJson, sha: (data as any).sha }
  } catch (error) {
    console.error("Error:", error)
    throw error
  }
}

export const updateSiteConfig = async (
  repo: string,
  siteConfig: Record<string, unknown>,
  sha: string,
) => {
  const commitMessage = `[AUTOMATED]: Updating site config for ${repo}`
  const content = Buffer.from(JSON.stringify(siteConfig, null, 2)).toString(
    "base64",
  )

  await octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: "data/config.json",
    message: commitMessage,
    content,
    branch: "staging",
    sha,
  })
}

export const addSearchJson = async (repo: string) => {
  try {
    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: "schema/search.json",
      message: `[AUTOMATED]: Adding search.json for ${repo}`,
      content: Buffer.from(
        JSON.stringify(
          {
            version: "0.1.0",
            layout: "search",
            page: {
              title: "Search",
              description: "Search results",
            },
            content: [],
          },
          null,
          2,
        ),
      ).toString("base64"),
      branch: "staging",
    })
  } catch (e) {
    console.error(e)
    console.log("There is already an existing `search.json`, skipping")
  }
}

export const archiveRepo = async (repo: string) => {
  try {
    await octokit.rest.repos.update({
      owner,
      repo,
      archived: true,
    })
    console.log(`Repository ${repo} has been archived`)
  } catch (error) {
    console.error(`Error archiving ${repo}:`, error)
  }
}
