#!/usr/bin/env node

const { Octokit } = require("@octokit/rest")
require("dotenv").config()

// Configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const ORG_NAME = "isomerpages"
const TEMPLATE_REPO = "isomer-next-base-template"
const COLLABORATOR_GROUP = "isomer-migrators"
const COLLABORATOR_PERMISSION = "push" // 'push' gives write access
const DEFAULT_BRANCH = "staging"
const REPO_NAMES = ["hello-adrian-test-script-next"] // TODO: change to the actual repo names

class GitHubRepoCreator {
  constructor() {
    this.octokit = new Octokit({
      auth: GITHUB_TOKEN,
    })
  }

  async createRepositoryFromTemplate(repoName) {
    try {
      console.log(`🚀 Creating repository: ${repoName}`)

      // Step 1: Create repository from template
      const createRepoResponse =
        await this.octokit.rest.repos.createUsingTemplate({
          template_owner: ORG_NAME,
          template_repo: TEMPLATE_REPO,
          owner: ORG_NAME,
          name: repoName,
          private: true, // Set to true if you want private repos
        })

      console.log(`✅ Repository created: ${createRepoResponse.data.html_url}`)

      // Step 2: Add collaborator group
      await this.addTeamToRepository(repoName)

      // Step 3: Create staging branch and set as default
      await this.createStagingBranch(repoName)

      console.log(`🎉 Repository setup complete!`)
      console.log(`📋 Repository URL: ${createRepoResponse.data.html_url}`)
      console.log(`🌿 Default branch: ${DEFAULT_BRANCH}`)
      console.log(
        `👥 Collaborators: ${COLLABORATOR_GROUP} (${COLLABORATOR_PERMISSION} access)`,
      )

      return createRepoResponse.data
    } catch (error) {
      console.error("❌ Error creating repository:", error.message)

      if (error.status === 422) {
        console.error("💡 This might be because:")
        console.error("   - Repository name already exists")
        console.error("   - Repository name contains invalid characters")
        console.error("   - Template repository is not accessible")
      } else if (error.status === 401) {
        console.error(
          "💡 Authentication failed. Please check your GITHUB_TOKEN.",
        )
      } else if (error.status === 403) {
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

      // First, try to get the team ID
      const teams = await this.octokit.rest.teams.list({
        org: ORG_NAME,
      })

      const team = teams.data.find((t) => t.slug === COLLABORATOR_GROUP)
      if (!team) {
        throw new Error(
          `Team ${COLLABORATOR_GROUP} not found in organization ${ORG_NAME}`,
        )
      }

      // Add the team to the repository
      await this.octokit.rest.teams.addOrUpdateRepoPermissionsInOrg({
        org: ORG_NAME,
        team_slug: COLLABORATOR_GROUP,
        owner: ORG_NAME,
        repo: repoName,
        permission: COLLABORATOR_PERMISSION,
      })

      console.log(
        `✅ Collaborator group added with ${COLLABORATOR_PERMISSION} access`,
      )
    } catch (error) {
      console.error(
        `⚠️  Warning: Could not add collaborator group: ${error.message}`,
      )
      // Don't throw here as this might fail due to group not existing or permissions
    }
  }

  async createStagingBranch(repoName) {
    try {
      console.log(`🌿 Creating ${DEFAULT_BRANCH} branch and setting as default`)

      // Get the default branch (usually 'main' or 'master')
      const repo = await this.octokit.rest.repos.get({
        owner: ORG_NAME,
        repo: repoName,
      })

      const defaultBranch = repo.data.default_branch
      console.log(`📋 Current default branch: ${defaultBranch}`)

      // Get the SHA of the default branch
      const ref = await this.octokit.rest.git.getRef({
        owner: ORG_NAME,
        repo: repoName,
        ref: `heads/${defaultBranch}`,
      })

      const sha = ref.data.object.sha

      // Create the staging branch from the default branch
      await this.octokit.rest.git.createRef({
        owner: ORG_NAME,
        repo: repoName,
        ref: `refs/heads/${DEFAULT_BRANCH}`,
        sha: sha,
      })

      console.log(`✅ Created ${DEFAULT_BRANCH} branch`)

      // Set staging as the default branch
      await this.octokit.rest.repos.update({
        owner: ORG_NAME,
        repo: repoName,
        default_branch: DEFAULT_BRANCH,
      })

      console.log(`✅ Set ${DEFAULT_BRANCH} as default branch`)
    } catch (error) {
      console.error(`❌ Error creating staging branch: ${error.message}`)
      throw error
    }
  }
}

// Main execution
async function main() {
  // Check for GitHub token first
  if (!GITHUB_TOKEN) {
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

  // Validate all repository names
  for (const repoName of REPO_NAMES) {
    if (!/^[a-zA-Z0-9._-]+$/.test(repoName)) {
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

  // Process each repository
  for (const repoName of REPO_NAMES) {
    try {
      console.log(`\n📦 Processing: ${repoName}`)
      console.log("=".repeat(50))
      await creator.createRepositoryFromTemplate(repoName)
      console.log(`✅ Successfully created: ${repoName}`)
    } catch (error) {
      console.error(`❌ Failed to create ${repoName}:`, error.message)
      // Continue with next repository instead of exiting
    }
  }

  console.log(`\n🎉 Batch processing complete!`)
  console.log(`📊 Processed ${REPO_NAMES.length} repositories`)
}

// Run the script
if (require.main === module) {
  main()
}

module.exports = { GitHubRepoCreator }
