import { confirm, input } from "@inquirer/prompts"
import { createSearchSgClient } from "create-searchsg-client"
import { requestAcm } from "request-acm"

const profile = process.env.AWS_PROFILE

await confirm({
  message: `Please ensure that this is your $AWS_PROFILE: \`${profile}\` and you have executed \`aws sso login\``,
})

if (!profile) throw new Error("No AWS_PROFILE found in environment variables")

const domain = await input({
  message: "Enter the domain (FQDN) of the site (eg: www.isomer.gov.sg):",
})
// await requestAcm(domain)

const long = await input({ message: "Enter the long name of the site:" })
// const codebuild = await input({
//   message: "Enter the code-build name of the site (eg: ogp-corp)",
// })

await createSearchSgClient({ domain, name: long })
