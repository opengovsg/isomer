import { confirm, input } from "@inquirer/prompts"

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

const launch = async () => {
  await confirm({
    message: `Please ensure that this is your $AWS_PROFILE: \`${profile}\` and you have executed \`aws sso login\``,
  })

  if (!profile) throw new Error("No AWS_PROFILE found in environment variables")

  const domain = await input({
    message: "Enter the domain (FQDN) of the site (eg: www.isomer.gov.sg):",
  })
  const needsAcm = await confirm({
    message: `Do you need to generate the first window record for this domain?`,
  })

  if (needsAcm) await requestAcmViaClient(domain)

  const long = await input({
    message: "Enter the long name of the site (eg: Open Government Products):",
  })
  const codebuildId = await input({
    message: "Enter the code-build name of the site (eg: ogp-corp)",
  })

  const isGithub = await confirm({
    message: `Is this a Github site?`,
  })

  if (isGithub) {
    const repo = await input({
      message: "Enter the github repo for the site (eg: `isomer-corp`):",
    })
    const status = await checkLastBuild(repo)
    if (status !== "SUCCEED") {
      console.log("The last build of the site failed - please fix!")
    }

    await createSearchSgClientForGithub({ domain, name: long, repo })
    await archiveRepo(repo)

    await confirm({ message: "Have you ran `npm run db:connect`?" })
    const siteId = await createBaseSiteInStudio({
      name: long,
      codeBuildId: codebuildId,
    })

    await updateCodebuildId(siteId, codebuildId)

    await migrate(repo, siteId)

    await s3sync(siteId)

    const canCleanup = await confirm({
      message: `Have the assets been uploaded to s3?`,
    })

    if (canCleanup) cleanup()

    await confirm({
      message:
        "Remember to remove the `assets-mapping.csv` after you have passed the file to prod-ops!",
    })
  } else {
    const rawSiteId = await input({
      message: "Enter the `siteId` of the site:",
    })

    const siteId = Number(rawSiteId)
    await createSearchSgClientForStudio({ siteId, domain, name: long })
    await updateCodebuildId(siteId, codebuildId)
    await createSearchPageForSite(siteId)
  }

  const hasInfra = await confirm({
    message: `Have you spun up the cloudfront site?`,
  })

  if (hasInfra) {
    await createIndirection(domain, codebuildId)
  } else {
    // tell the user to re-up and pause here?
  }
  // TODO: await startCodeBuild(codebuildId)
  // TODO: add admins
  // await addUsersToSite({ siteId, users })
}

await launch()
