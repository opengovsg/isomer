import { confirm, input } from "@inquirer/prompts"
import { checkLastBuild } from "amplify"
import {
  createSearchSgClientForGithub,
  createSearchSgClientForStudio,
} from "create-searchsg-client"
import { archiveRepo } from "github"
import { createIndirection } from "indirection"
import { requestAcmViaClient } from "request-acm"
import { s3sync } from "s3"
import { createBaseSiteInStudio } from "site"
import { skipIfExists, Steps, toStateFile } from "state"

import { cleanup, main as migrate } from "@isomer/seed-from-repo"

const profile = process.env.AWS_PROFILE

const launch = async () => {
  await confirm({
    message: `Please ensure that this is your $AWS_PROFILE: \`${profile}\` and you have executed \`aws sso login\``,
  })

  if (!profile) throw new Error("No AWS_PROFILE found in environment variables")

  const domain = await input({
    message: "Enter the domain (FQDN) of the site (eg: www.isomer.gov.sg):",
  })

  await skipIfExists(domain, "Domain", async () => domain)

  await skipIfExists(domain, Steps.Acm, () => requestAcmViaClient(domain))

  const long = await skipIfExists(domain, Steps.LongName, () =>
    input({ message: "Enter the long name of the site:" }),
  )

  const codebuildId = await skipIfExists(domain, Steps.CodeBuildId, () =>
    input({
      message: "Enter the code-build name of the site (eg: ogp-corp)",
    }),
  )

  // TODO: Shard out into separate pipelines so we can skip this
  const repo = await skipIfExists(domain, Steps.GithubName, () =>
    input({
      message: "Enter the github repo for the site (eg: `isomer-corp`):",
    }),
  )

  if (!!repo) {
    await skipIfExists(domain, Steps.Archived, async () => {
      await archiveRepo(repo)
      return "true"
    })
    const status = await checkLastBuild(codebuildId)
    if (status !== "SUCCEED") {
      console.log("The last build of the site failed - please fix!")
    }

    skipIfExists(
      domain,
      Steps.SearchSg,
      async () =>
        await createSearchSgClientForGithub({ domain, name: long, repo }),
    )

    const siteId = skipIfExists(
      domain,
      Steps.StudioSiteId,
      async () =>
        await createBaseSiteInStudio({
          name: long,
          codeBuildId: codebuildId,
        }),
    )

    await confirm({ message: "Have you ran `npm run db:connect`?" })
    // NOTE: End users should be able to retry here because this isn't idempotent
    // and the side effect might be intended (overriding rows)
    await toStateFile(domain, Steps.Imported, async () => {
      await migrate(repo, Number(siteId))
      return "true"
    })

    // NOTE: End users should be able to retry here because this isn't idempotent
    // and the side effect might be intended (uploading to s3)
    await toStateFile(domain, Steps.Imported, async () => {
      await s3sync(Number(siteId))
      const canCleanup = await confirm({
        message: `Have the assets been uploaded to s3?`,
      })

      if (canCleanup) cleanup(repo)
      return "true"
    })
  } else {
    await createSearchSgClientForStudio({ domain, name: long })
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

await launch()
