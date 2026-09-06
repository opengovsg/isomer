#!/usr/bin/env node

import { Octokit } from "@octokit/rest"
import dotenv from "dotenv"
import { setTimeout } from "node:timers/promises"

dotenv.config()

const { GITHUB_TOKEN } = process.env
const ORG_NAME = "isomerpages"
const TEMPLATE_REPO = "isomer-next-base-template"
const COLLABORATOR_GROUP = "isomer-migrators"
const COLLABORATOR_PERMISSION = "push"
const DEFAULT_BRANCH = "staging"
const REPO_NAMES = ["hello-adrian-test-script-next"]

const delay = async (seconds = 2) => {
  await setTimeout(seconds * 1000)
}

class GitHubRepoCreator {
  constructor() {
    this.octokit = new Octokit({
      auth: GITHUB_TOKEN,
    })
  }

  async createRepositoryFromTemplate(repoName) {
    try {
      console.log(`🚀 Creating repository: ${repoName}`)

      const createRepoResponse =
        await this.octokit.rest.repos.createUsingTemplate({
          name: repoName,
          owner: ORG_NAME,
          private: true,
          template_owner: ORG_NAME,
          template_repo: TEMPLATE_REPO,
        })

      console.log(`✅ Repository created: ${createRepoResponse.data.html_url}`)
      await delay()

      await this.addTeamToRepository(repoName)
      await delay()

      await this.createStagingBranch(repoName)
      await delay()

      console.log(`🎉 Repository setup complete!`)
      console.log(`📋 Repository URL: ${createRepoResponse.data.html_url}`)
      console.log(`🌿 Default branch: ${DEFAULT_BRANCH}`)
      console.log(
        `👥 Collaborators: ${COLLABORATOR_GROUP} (${COLLABORATOR_PERMISSION} access)`,
      )

      return createRepoResponse.data
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      console.error("❌ Error creating repository:", err.message)

      if ("status" in error && error.status === 422) {
        console.error("💡 This might be because:")
        console.error("   - Repository name already exists")
        console.error("   - Repository name contains invalid characters")
        console.error("   - Template repository is not accessible")
      } else if ("status" in error && error.status === 401) {
        console.error(
          "💡 Authentication failed. Please check your GITHUB_TOKEN.",
        )
      } else if ("status" in error && error.status === 403) {
        console.error(
          "💡 Permission denied. Please check your token permissions.",
        )
      }

      throw error
    }
  }

  async addTeamToRepository(repoName) {
    try {
      console.log(`👥 Adding collaborator group: ${COLLABORATOR_GROUP}`)

      const teams = await this.octokit.rest.teams.list({
        org: ORG_NAME,
      })

      const team = teams.data.find((t) => t.slug === COLLABORATOR_GROUP)
      if (team === undefined) {
        throw new Error(
          `Team ${COLLABORATOR_GROUP} not found in organization ${ORG_NAME}`,
        )
      }

      await this.octokit.rest.teams.addOrUpdateRepoPermissionsInOrg({
        org: ORG_NAME,
        owner: ORG_NAME,
        permission: COLLABORATOR_PERMISSION,
        repo: repoName,
        team_slug: COLLABORATOR_GROUP,
      })

      console.log(
        `✅ Collaborator group added with ${COLLABORATOR_PERMISSION} access`,
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error(`⚠️  Warning: Could not add collaborator group: ${message}`)
    }
  }

  async createStagingBranch(repoName) {
    try {
      console.log(`🌿 Creating ${DEFAULT_BRANCH} branch and setting as default`)

      const repo = await this.octokit.rest.repos.get({
        owner: ORG_NAME,
        repo: repoName,
      })

      const defaultBranch = repo.data.default_branch
      console.log(`📋 Current default branch: ${defaultBranch}`)

      const ref = await this.octokit.rest.git.getRef({
        owner: ORG_NAME,
        ref: `heads/${defaultBranch}`,
        repo: repoName,
      })

      const { sha } = ref.data.object

      await this.octokit.rest.git.createRef({
        owner: ORG_NAME,
        ref: `refs/heads/${DEFAULT_BRANCH}`,
        repo: repoName,
        sha,
      })

      console.log(`✅ Created ${DEFAULT_BRANCH} branch`)

      await this.octokit.rest.repos.update({
        default_branch: DEFAULT_BRANCH,
        owner: ORG_NAME,
        repo: repoName,
      })

      console.log(`✅ Set ${DEFAULT_BRANCH} as default branch`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error(`❌ Error creating staging branch: ${message}`)
      throw error
    }
  }
}

const main = async () => {
  if (GITHUB_TOKEN === undefined || GITHUB_TOKEN === "") {
    console.error("❌ Error: GITHUB_TOKEN environment variable is required")
    console.log("Please set your GitHub personal access token:")
    console.log("export GITHUB_TOKEN=your_token_here")
    console.log("Or create a .env file with: GITHUB_TOKEN=your_token_here")
    process.exit(1)
  }

  if (REPO_NAMES.length === 0) {
    console.error("❌ Error: No repository names defined in REPO_NAMES")
    process.exit(1)
  }

  for (const repoName of REPO_NAMES) {
    if (!/^[a-zA-Z0-9._-]+$/u.test(repoName)) {
      console.error(
        `❌ Error: Repository name "${repoName}" contains invalid characters`,
      )
      console.log(
        "Repository name can only contain letters, numbers, dots, underscores, and hyphens",
      )
      process.exit(1)
    }
  }

  const creator = new GitHubRepoCreator()

  console.log(`🚀 Starting creation of ${REPO_NAMES.length} repositories...`)
  console.log(`📋 Repositories to create: ${REPO_NAMES.join(", ")}`)
  console.log("")

  for (const repoName of REPO_NAMES) {
    try {
      console.log(`\n📦 Processing: ${repoName}`)
      console.log("=".repeat(50))
      await creator.createRepositoryFromTemplate(repoName)
      console.log(`✅ Successfully created: ${repoName}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error(`❌ Failed to create ${repoName}:`, message)
    }
  }

  console.log(`\n🎉 Batch processing complete!`)
  console.log(`📊 Processed ${REPO_NAMES.length} repositories`)
}

void main()

export { GitHubRepoCreator }
