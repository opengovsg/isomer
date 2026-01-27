import * as dotenv from "dotenv";
import { Octokit } from "@octokit/rest";
import path from "path";

dotenv.config({
  path: path.join(__dirname, "..", ".env"),
});

export const createOrUpdateIndirectionRecord = async (
  domain: string,
  cloudfrontDomain: string
) => {
  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
  });
  const domainWithoutWww = domain.startsWith("www.") ? domain.slice(4) : domain;
  const indirectionDomainSlug = domainWithoutWww.replace(/\./g, "-");

  const template = `import { Record } from "@pulumi/aws/route53";
import { CLOUDFRONT_HOSTED_ZONE_ID } from "../constants";

export const createRecords = (zoneId: string): Record[] => {
  const records = [
    new Record("${domainWithoutWww} A", {
      name: "${indirectionDomainSlug}",
      type: "A",
      zoneId: zoneId,
      aliases: [
        {
          name: "${cloudfrontDomain}",
          zoneId: CLOUDFRONT_HOSTED_ZONE_ID,
          evaluateTargetHealth: false,
        },
      ],
    }),

    new Record("${domainWithoutWww} AAAA", {
      name: "${indirectionDomainSlug}",
      type: "AAAA",
      zoneId: zoneId,
      aliases: [
        {
          name: "${cloudfrontDomain}",
          zoneId: CLOUDFRONT_HOSTED_ZONE_ID,
          evaluateTargetHealth: false,
        },
      ],
    }),
  ];

  return records;
};
`;

  await octokit.rest.repos.createOrUpdateFileContents({
    owner: "isomerpages",
    repo: "indirection",
    path: `dns/${domainWithoutWww}.ts`,
    message: `chore: Automated add/update for ${domainWithoutWww}`,
    content: Buffer.from(template).toString("base64"),
  });
};
