import { confirm, input } from "@inquirer/prompts"
import {
  createSearchSgClientForGithub,
  createSearchSgClientForStudio,
} from "create-searchsg-client"
import { createIndirection } from "indirection"
import { requestAcm } from "request-acm"

import { main as migrate } from "@isomer/seed-from-repo"

const profile = process.env.AWS_PROFILE

await confirm({
  message: `Please ensure that this is your $AWS_PROFILE: \`${profile}\` and you have executed \`aws sso login\``,
})

if (!profile) throw new Error("No AWS_PROFILE found in environment variables")

const domain = await input({
  message: "Enter the domain (FQDN) of the site (eg: www.isomer.gov.sg):",
})
const needsAcm = await confirm({
  message: `Do you need to generate a SSL cert for this domain?`,
})

if (needsAcm) await requestAcm(domain)

const long = await input({ message: "Enter the long name of the site:" })
const codebuild = await input({
  message: "Enter the code-build name of the site (eg: ogp-corp)",
})

const isGithub = await confirm({
  message: `Is this a Github site?`,
})

if (isGithub) {
  const repo = await input({
    message: "Enter the github repo for the site:",
  })
  await createSearchSgClientForGithub({ domain, name: long, repo })
  const siteId = await input({
    message: "Enter the site id for the site:",
  })

  await confirm({ message: "Have you ran `npm run db:connect`?" })
  // TODO: validate
  // cleanup old assets/repos folder
  // connect to db automatically
  await migrate(repo, siteId as unknown as number)
} else {
  await createSearchSgClientForStudio({ domain, name: long })
}

await createIndirection(domain)
// await startCodeBuild()
// add admins

// const shouldCleanup = await confirm({ message: "Perform clean-up for assets?" })
// await cleanup()
