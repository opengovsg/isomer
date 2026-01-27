import type { DistributionSummary } from "@aws-sdk/client-cloudfront";
import {
  CloudFrontClient,
  CreateInvalidationCommand,
  GetDistributionCommand,
  ListDistributionsCommand,
  UpdateDistributionCommand,
} from "@aws-sdk/client-cloudfront";
import {
  BatchGetBuildsCommand,
  CodeBuildClient,
  ListBuildsForProjectCommand,
} from "@aws-sdk/client-codebuild";
import { fromSSO } from "@aws-sdk/credential-providers";
import set from "lodash-es/set";

export const getAllCloudFrontDistributions = async () => {
  const client = new CloudFrontClient({
    profile: process.env.AWS_NEXT_PROFILE,
    region: "us-east-1",
    credentials: fromSSO({
      profile: process.env.AWS_NEXT_PROFILE,
    }),
  });

  const distributions = [];
  let marker = "";

  while (true) {
    const listDistributionsCommand = new ListDistributionsCommand({
      Marker: marker === "" ? undefined : marker,
      MaxItems: 100,
    });
    const listDistributionsResponse = await client.send(
      listDistributionsCommand
    );

    if (listDistributionsResponse.DistributionList?.Items) {
      distributions.push(...listDistributionsResponse.DistributionList.Items);
    }

    if (!listDistributionsResponse.DistributionList?.IsTruncated) {
      break;
    }

    marker = listDistributionsResponse.DistributionList.NextMarker || "";
  }

  return distributions;
};

export const getCloudFrontDistributionDomainName = (
  distributions: DistributionSummary[],
  siteName: string
) => {
  const distribution = distributions.find((dist) =>
    dist.Origins?.Items?.some((origin) =>
      origin.OriginPath?.includes(`/${siteName}/`)
    )
  );

  if (!distribution?.DomainName) {
    return null;
  }

  return distribution.DomainName;
};

export const updateCloudFrontDistributionOriginPath = async (
  distributionId: string,
  siteName: string
) => {
  const codeBuildClient = new CodeBuildClient({
    profile: process.env.AWS_NEXT_PROFILE,
    region: "ap-southeast-1",
    credentials: fromSSO({
      profile: process.env.AWS_NEXT_PROFILE,
    }),
  });
  const cloudfrontClient = new CloudFrontClient({
    profile: process.env.AWS_NEXT_PROFILE,
    region: "us-east-1",
    credentials: fromSSO({
      profile: process.env.AWS_NEXT_PROFILE,
    }),
  });

  // Step 1: Get the latest successful CodeBuild build for the site
  const listBuildsCommand = new ListBuildsForProjectCommand({
    projectName: siteName,
    sortOrder: "DESCENDING",
  });
  const listBuildsResponse = await codeBuildClient.send(listBuildsCommand);
  const batchGetBuildsCommand = new BatchGetBuildsCommand({
    ids: listBuildsResponse.ids ?? [],
  });
  const batchGetBuildsResponse = await codeBuildClient.send(
    batchGetBuildsCommand
  );
  const latestSuccessfulBuild = batchGetBuildsResponse.builds?.find(
    (build) => build.buildStatus === "SUCCEEDED"
  );

  if (!latestSuccessfulBuild?.artifacts?.location) {
    throw new Error(`No successful builds found for project ${siteName}`);
  }

  // Step 2: Get the current distribution configuration
  const getDistributionCommand = new GetDistributionCommand({
    Id: distributionId,
  });
  const getDistributionResponse = await cloudfrontClient.send(
    getDistributionCommand
  );

  if (!getDistributionResponse.Distribution || !getDistributionResponse.ETag) {
    throw new Error(`Distribution with ID ${distributionId} not found`);
  }

  const distributionConfig =
    getDistributionResponse.Distribution.DistributionConfig;
  const eTag = getDistributionResponse.ETag;

  // Step 3: Update the origin path to point to the new build artifacts
  if (!distributionConfig?.Origins?.Items) {
    throw new Error(`No origins found for distribution ${distributionId}`);
  }

  set(
    distributionConfig,
    "Origins.Items[0].OriginPath",
    `/${siteName}/${latestSuccessfulBuild.buildNumber}/latest`
  );

  // Step 4: Submit the updated distribution configuration
  const updateDistributionCommand = new UpdateDistributionCommand({
    Id: distributionId,
    IfMatch: eTag,
    DistributionConfig: distributionConfig,
  });
  await cloudfrontClient.send(updateDistributionCommand);
};

export const createCloudFrontInvalidation = async (distributionId: string) => {
  const client = new CloudFrontClient({
    profile: process.env.AWS_NEXT_PROFILE,
    region: "us-east-1",
    credentials: fromSSO({
      profile: process.env.AWS_NEXT_PROFILE,
    }),
  });

  const invalidationCommand = new CreateInvalidationCommand({
    DistributionId: distributionId,
    InvalidationBatch: {
      CallerReference: `invalidation-${Date.now()}`,
      Paths: {
        Quantity: 1,
        Items: ["/*"],
      },
    },
  });

  await client.send(invalidationCommand);
};
