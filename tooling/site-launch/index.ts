import { confirm, input } from "@inquirer/prompts"
import {
  createSearchSgClientForGithub,
  createSearchSgClientForStudio,
} from "create-searchsg-client"
import { createIndirection } from "indirection"
import { requestAcmViaClient } from "request-acm"

import { cleanup, main as migrate } from "@isomer/seed-from-repo"

const profile = process.env.AWS_PROFILE

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
  await createSearchSgClientForGithub({ domain, name: long, repo })
  const siteId = await input({
    message: "Enter the site id for the site:",
  })

  await confirm({ message: "Have you ran `npm run db:connect`?" })
  // TODO: validate
  // cleanup old assets/repos folder
  // connect to db automatically
  // create empty site
  await migrate(repo, siteId as unknown as number)
  // TODO: s3 sync here

  // NOTE: Perform cleanup after s3 sync is done
  // cleanup(repo)
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
// TODO: check amplify for github sites to ensure builds are successful
// TODO: await startCodeBuild(codebuildId)
// TODO: addsadmins
