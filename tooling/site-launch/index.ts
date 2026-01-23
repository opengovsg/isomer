import type { Step } from "state"
import { confirm, input, search, select } from "@inquirer/prompts"
import { readStateFile, skipIfExists, Steps, toStateFile } from "state"

import { migrateTagsOfSite } from "@isomer/migrate-tags"
import { cleanup, main as migrate } from "@isomer/seed-from-repo"

import { checkLastBuild } from "./amplify"
import {
  createSearchSgClientForGithub,
  createSearchSgClientForStudio,
} from "./create-searchsg-client"
import { env } from "./env"
import { archiveRepo } from "./github"
import { createIndirection } from "./indirection"
import { requestAcmViaClient } from "./request-acm"
import { s3sync } from "./s3"
import {
  createBaseSiteInStudio,
  createSearchPageForSite,
  updateCodebuildId,
} from "./site"

const profile = env.AWS_PROFILE

// TODO: set up monitoring automatically via uptime robot
// TODO: add redirection automatically (low priority cos so ez already and it's launch blocker)
const HANDLERS = {
  [Steps.Domain]: {
    name: "Enter the domain (FQDN) of the site (eg: www.isomer.gov.sg):",
    execute: async (site: string) => {
      throw new Error("Not implemented")
    },
  },
  [Steps.Acm]: {
    name: "Do you need to generate the first window record for this domain?",
    execute: async (site: string) => {
      throw new Error("Not implemented")
    },
  },
  [Steps.Archived]: {
    name: "Do you want to archive the github repo?",
    execute: async (site: string) => {
      throw new Error("Not implemented")
    },
  },
  [Steps.CodeBuildId]: {
    name: "Enter the code-build name of the site (eg: ogp-corp)",
    execute: async (site: string) => {
      throw new Error("Not implemented")
    },
  },
  [Steps.GithubName]: {
    name: "Enter the github repo for the site (eg: `isomer-corp`):",
    execute: async (site: string) => {
      throw new Error("Not implemented")
    },
  },
  [Steps.Imported]: {
    name: "Import the site into Studio?",
    execute: async (site: string) => {
      throw new Error("Not implemented")
    },
  },
  [Steps.IndirectionCreated]: {
    name: "Create indirection record?",
    execute: (site: string) => {
      const state = readStateFile()
      const siteState = state[site]
      createIndirection(siteState!.Domain!, siteState!.CodeBuildId!)
    },
  },
  [Steps.LongName]: {
    name: "Enter the long name of the site:",
    execute: async (site: string) => {
      throw new Error("Not implemented")
    },
  },
  [Steps.S3Sync]: {
    name: "Should the local `assets` folder be synced to s3?",
    execute: async (site: string) => {
      throw new Error("Not implemented")
    },
  },
  [Steps.SearchSg]: {
    name: "Create searchsg client?",
    execute: async (site: string) => {
      throw new Error("Not implemented")
    },
  },
  [Steps.StudioSiteId]: {
    name: "Create the site in studio?",
    execute: async (site: string) => {
      throw new Error("Not implemented")
    },
  },
}

const launch = async () => {
  await confirm({
    message: `Please ensure that this is your $AWS_PROFILE: \`${profile}\` and you have executed \`aws sso login\``,
  })

  if (!profile) throw new Error("No AWS_PROFILE found in environment variables")

  const domain = await input({
    message: "Enter the domain (FQDN) of the site (eg: www.isomer.gov.sg):",
  })

  await skipIfExists(domain, "Domain", async () => domain)

  await skipIfExists(domain, Steps.Acm, async () => {
    return requestAcmViaClient(domain)
  })

  const long = await skipIfExists(domain, Steps.LongName, () =>
    input({
      message:
        "Enter the long name of the site: (eg: Open Government Products)",
    }),
  )

  const codebuildId = await skipIfExists(domain, Steps.CodeBuildId, () =>
    input({
      message: "Enter the code-build name of the site (eg: ogp-corp)",
    }),
  )

  const isGithub = await confirm({
    message: "Is the site hosted on Github?",
  })

  if (!!isGithub) {
    // TODO: Shard out into separate pipelines so we can skip this
    const repo = await skipIfExists(domain, Steps.GithubName, () =>
      input({
        message: "Enter the github repo for the site (eg: `isomer-corp-next`):",
      }),
    )
    const status = await checkLastBuild(codebuildId)
    if (status !== "SUCCEED") {
      console.log("The last build of the site failed - please fix!")
    }

    await skipIfExists(
      domain,
      Steps.SearchSg,
      async () =>
        await createSearchSgClientForGithub({ domain, name: long, repo }),
    )

    await confirm({ message: "Have you ran `npm run db:connect`?" })

    const siteId = await skipIfExists(
      domain,
      Steps.StudioSiteId,
      async () =>
        await createBaseSiteInStudio({
          name: long,
          codeBuildId: codebuildId,
        }),
    )

    await updateCodebuildId(Number(siteId), codebuildId)

    await skipIfExists(domain, Steps.Archived, async () => {
      await archiveRepo(repo)
      return "true"
    })

    // NOTE: End users should be able to retry here because this isn't idempotent
    // and the side effect might be intended (overriding rows)
    await toStateFile(domain, Steps.Imported, async () => {
      await migrate(repo, Number(siteId))
      await migrateTagsOfSite(Number(siteId))
      return "true"
    })

    // NOTE: End users should be able to retry here because this isn't idempotent
    // and the side effect might be intended (uploading to s3)
    await toStateFile(domain, Steps.S3Sync, async () => {
      await s3sync(Number(siteId))
      const canCleanup = await confirm({
        message: `Have the assets been uploaded to s3?`,
      })

      if (canCleanup) cleanup()

      await confirm({
        message:
          "Remember to remove the `assets-mapping.csv` after you have passed the file to prod-ops!",
      })
      return "true"
    })
  } else {
    const rawSiteId = await skipIfExists(
      domain,
      Steps.StudioSiteId,
      async () => {
        const rawSiteId = await input({
          message: "Enter the `siteId` of the site:",
        })

        return rawSiteId
      },
    )
    const siteId = Number(rawSiteId)
    await skipIfExists(domain, Steps.SearchSg, () =>
      createSearchSgClientForStudio({ siteId, domain, name: long }),
    )
    await updateCodebuildId(siteId, codebuildId)
    await createSearchPageForSite(siteId)
  }

  const hasInfra = await confirm({
    message: `Have you spun up the cloudfront site?`,
  })

  if (hasInfra) {
    await createIndirection(domain, codebuildId)
  }

  // await startCodeBuild(codebuildId)
  // TODO: add admins
  // await addUsersToSite({ siteId, users })
}

const main = async () => {
  const shouldCarryOn = await confirm({
    message: "Should we carry on from a previous launch state?",
  })

  if (shouldCarryOn) {
    const state = readStateFile()
    const sites = Object.keys(state)

    const site = await search({
      message: "Select a site",
      source: async (input) => {
        if (!input) {
          return sites
        }

        return sites.filter((site) => site.includes(input.toLowerCase()))
      },
    })

    await step(site as string)
  } else {
    await launch()
  }
}

const step = async (site: string) => {
  const state = readStateFile()
  const curSiteState = state[site]

  const answer = await select({
    message: "Select a site launch step",
    choices: Object.entries(HANDLERS)
      .filter(([key]) => {
        return curSiteState?.[key as Step] === undefined
      })
      .map(([key, { name }]) => ({
        name,
        value: key,
      })),
  })

  return HANDLERS[answer as Step].execute(site)
}

await main()
