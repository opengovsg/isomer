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
  const needsAcm = await confirm({
    message: `Do you need to generate the first window record for this domain?`,
  })

  if (needsAcm) await requestAcmViaClient(domain)

  const long = await input({ message: "Enter the long name of the site:" })
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
    await archiveRepo(repo)
    const status = await checkLastBuild(codebuildId)
    if (status !== "SUCCEED") {
      console.log("The last build of the site failed - please fix!")
    }

    await createSearchSgClientForGithub({ domain, name: long, repo })
    const siteId = await createBaseSiteInStudio({
      name: long,
      codeBuildId: codebuildId,
    })

    await confirm({ message: "Have you ran `npm run db:connect`?" })
    await migrate(repo, siteId)

    await s3sync(siteId)

    const canCleanup = await confirm({
      message: `Have the assets been uploaded to s3?`,
    })

    if (canCleanup) cleanup(repo)
  } else {
    // TODO: create site
    await createSearchSgClientForStudio({ domain, name: long })
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
