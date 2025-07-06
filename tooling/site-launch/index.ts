import { confirm, input } from "@inquirer/prompts"
import {
  createSearchSgClientForGithub,
  createSearchSgClientForStudio,
} from "create-searchsg-client"
import { createIndirection } from "indirection"
import { requestAcm } from "request-acm"

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
// const codebuild = await input({
//   message: "Enter the code-build name of the site (eg: ogp-corp)",
// })

const isGithub = await confirm({
  message: `Is this a Github site?`,
})

if (isGithub) {
  await createSearchSgClientForGithub({ domain, name: long })
} else {
  await createSearchSgClientForStudio({ domain, name: long })
}

await createIndirection(domain)
