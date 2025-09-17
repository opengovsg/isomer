import {
  CloudFrontClient,
  ListDistributionsCommand,
} from "@aws-sdk/client-cloudfront"
import { commitAndCreatePR } from "github"

export const createIndirection = async (
  domain: string,
  codebuildId: string,
) => {
  const indirectionDomain = domain.replace(/^www\./, "").replaceAll(".", "-")
  // NOTE: get the cloudfront distribution where the alternate domain
  // is the `domain`
  const client = new CloudFrontClient({})
  const command = new ListDistributionsCommand({})
  const resp = await client.send(command)
  let matching = resp.DistributionList?.Items?.find(({ Origins }) => {
    return Origins?.Items?.some(({ OriginPath }) => {
      return OriginPath?.startsWith(`/${codebuildId}/`)
    })
  })

  while (!matching && resp.DistributionList?.NextMarker) {
    const command = new ListDistributionsCommand({
      Marker: resp.DistributionList?.NextMarker,
    })
    const nextResp = await client.send(command)
    matching = nextResp.DistributionList?.Items?.find(({ Origins }) => {
      return Origins?.Items?.some(({ OriginPath }) => {
        return OriginPath?.startsWith(`/${codebuildId}/`)
      })
    })
  }

  if (!matching) {
    throw new Error(
      `Expected 1 cloudfront distribution to have origin: /${codebuildId}/ but found none`,
    )
  }

  console.log(`Found matching cloudfront distribution`)
  const cfDomain = matching.DomainName
  const recordDomain = domain.replace(/^www\./, "")

  const content = `import { Record } from "@pulumi/aws/route53";
import { CLOUDFRONT_HOSTED_ZONE_ID } from "../constants";

export const createRecords = (zoneId: string): Record[] => {
  const records = [
    new Record("${recordDomain} A", {
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

    new Record("${recordDomain} AAAA", {
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
