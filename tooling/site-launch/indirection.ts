import {
  CloudFrontClient,
  ListDistributionsCommand,
} from "@aws-sdk/client-cloudfront"
import { Octokit } from "@octokit/rest"

export const createIndirection = async (domain: string) => {
  const indirectionDomain = domain.replaceAll(".", "-")
  // NOTE: get the cloudfront distribution where the alternate domain
  // is the `domain`
  const client = new CloudFrontClient({})
  const command = new ListDistributionsCommand({})
  const resp = await client.send(command)
  const matching = resp.DistributionList?.Items?.find(({ Aliases }) => {
    return Aliases?.Items?.some((value) => value === domain)
  })

  if (!matching) {
    throw new Error(
      `Expected 1 cloudfront distribution to have domain: ${domain} but found none`,
    )
  }

  console.log(`Found matching cloudfront distribution`)
  const cfDomain = matching.DomainName

  const content = `import { Record } from "@pulumi/aws/route53";
import { CLOUDFRONT_HOSTED_ZONE_ID } from "../constants";

export const createRecords = (zoneId: string): Record[] => {
  const records = [
    new Record("${domain} A", {
      name: "${indirectionDomain}",
      type: "A",
      zoneId: zoneId,
      aliases: [
        {
          name: "${cfDomain}",
          zoneId: CLOUDFRONT_HOSTED_ZONE_ID,
          evaluateTargetHealth: false,
        },
      ],
    }),

    new Record("${domain} AAAA", {
      name: "${indirectionDomain}",
      type: "AAAA",
      zoneId: zoneId,
      aliases: [
        {
          name: "${cfDomain}",
          zoneId: CLOUDFRONT_HOSTED_ZONE_ID,
          evaluateTargetHealth: false,
        },
      ],
    }),
  ];

  return records;
};`

  await commitAndCreatePR(domain, content)
}

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
})

const commitAndCreatePR = async (domain: string, rawContent: string) => {
  const owner = "isomerpages"
  const repo = "isomer-indirection"
  const filePath = `dns/${domain}.ts`
  const commitMessage = `[AUTOMATED]: Site launch for ${domain}`
  const prTitle = `[AUTOMATED]: Site launch for ${domain}`
  const content = Buffer.from(rawContent).toString("base64")

  try {
    // Step 1: Create or update file content
    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: filePath,
      message: commitMessage,
      content,
      branch: "staging",
    })

    // Step 2: Create pull request
    const { data: pullRequest } = await octokit.rest.pulls.create({
      owner,
      repo,
      title: prTitle,
      head: "staging",
      base: "main",
    })

    console.log(
      `Pull request created: ${pullRequest.html_url}, ask another @isoengineer to approve it`,
    )
    return pullRequest
  } catch (error) {
    console.error("Error:", error)
    throw error
  }
}
