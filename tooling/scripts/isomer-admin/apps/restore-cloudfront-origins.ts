/**
 * Restore CloudFront origins to each site's latest successful build.
 *
 * Incident-response tool. When a site serves `NoSuchKey` or 403/404 because
 * its distribution's origin points at a build that no longer exists (e.g. a
 * `pulumi up` rewrote origins from stale state, IR-1474), this points the
 * origin back at the latest successful build and invalidates the cache. The
 * check-only pass doubles as the post-deploy check after any `pulumi up` that
 * touches CloudFront.
 *
 * Needed for as long as the build number lives in the origin path.
 *
 * How to use:
 *   1. Authenticate with AWS first, e.g.:
 *        aws sso login --profile <your-profile>
 *   2. Run the admin CLI from tooling/scripts:
 *        pnpm run isomer-admin
 *   3. Select "Restore CloudFront origins", enter the sites, review the check
 *      results, then confirm to restore the mismatched ones.
 */
import {
  CloudFrontClient,
  CreateInvalidationCommand,
  GetDistributionConfigCommand,
  PreconditionFailed,
  UpdateDistributionCommand,
} from "@aws-sdk/client-cloudfront"
import {
  BatchGetBuildsCommand,
  BatchGetProjectsCommand,
  CodeBuildClient,
  ListBuildsForProjectCommand,
  ListProjectsCommand,
} from "@aws-sdk/client-codebuild"
import { HeadObjectCommand, NotFound, S3Client } from "@aws-sdk/client-s3"
import { confirm, input } from "@inquirer/prompts"

const SITES_REGION = "ap-southeast-1"
const CLOUDFRONT_REGION = "us-east-1"
const ALL_SITES = "all"
// Headroom for API throttling when checking the whole fleet
const SDK_MAX_ATTEMPTS = 10
// A publish can update the same distribution between our read and write
const PRECONDITION_MAX_ATTEMPTS = 3
// BatchGetProjects and BatchGetBuilds accept at most 100 names/IDs per call
const CODEBUILD_BATCH_SIZE = 100
// Each site makes ~5 API calls; CloudFront throttles well before this matters
const CONCURRENCY = 5

interface AwsClients {
  codebuild: CodeBuildClient
  cloudfront: CloudFrontClient
  s3: S3Client
}

// One CodeBuild project per site, named after the site, created alongside its
// distribution by isomer-next-infra. publisher.sh reads these env vars too.
interface Site {
  name: string
  distributionId: string
  bucket: string
}

type Status = "unchanged" | "mismatch" | "restored" | "skipped" | "failed"

interface Result {
  site: string
  status: Status
  detail: string
}

type Plan =
  | { action: "none" | "restore"; target: string }
  | { action: "skip"; target: string; reason: string }

// e.g. /moh-corp/4394/latest -> ["moh-corp", "4394"]
const ORIGIN_PATH_PATTERN = /^\/(.+)\/(\d+)\/latest$/

const toOriginPath = (siteName: string, buildNumber: number) =>
  `/${siteName}/${buildNumber}/latest`

export const planRestore = (
  siteName: string,
  currentPath: string,
  latestBuildNumber: number,
): Plan => {
  const target = toOriginPath(siteName, latestBuildNumber)
  if (currentPath === target) {
    return { action: "none", target }
  }

  // A newer build sets the origin moments before CodeBuild marks it SUCCEEDED;
  // restoring then would roll the site back.
  const [, currentSite, currentBuild] =
    ORIGIN_PATH_PATTERN.exec(currentPath) ?? []
  if (currentSite === siteName && Number(currentBuild) > latestBuildNumber) {
    return {
      action: "skip",
      target,
      reason: `origin ${currentPath} is ahead of last successful build ${latestBuildNumber}; a publish may be in progress, re-run once it finishes`,
    }
  }

  return { action: "restore", target }
}

const chunk = <T>(items: T[], size: number) =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, i) =>
    items.slice(i * size, (i + 1) * size),
  )

const listAllProjectNames = async ({ codebuild }: AwsClients) => {
  const names: string[] = []
  let nextToken: string | undefined
  do {
    const response = await codebuild.send(
      new ListProjectsCommand({ nextToken }),
    )
    names.push(...(response.projects ?? []))
    nextToken = response.nextToken
  } while (nextToken)
  return names
}

// Decommissioned sites have no CodeBuild project, so they never show up here.
const getSites = async (
  aws: AwsClients,
  names: string[] | typeof ALL_SITES,
) => {
  const projectNames =
    names === ALL_SITES ? await listAllProjectNames(aws) : names
  const sites: Site[] = []
  const missing: Result[] = []

  for (const batch of chunk(projectNames, CODEBUILD_BATCH_SIZE)) {
    const { projects = [], projectsNotFound = [] } = await aws.codebuild.send(
      new BatchGetProjectsCommand({ names: batch }),
    )

    for (const name of projectsNotFound) {
      missing.push({
        site: name,
        status: "failed",
        detail: "no CodeBuild project (decommissioned or misspelt?)",
      })
    }

    for (const project of projects) {
      const vars = new Map(
        project.environment?.environmentVariables?.map((v) => [
          v.name,
          v.value,
        ]),
      )
      const name = vars.get("SITE_NAME")
      const distributionId = vars.get("CLOUDFRONT_DISTRIBUTION_ID")
      const bucket = vars.get("S3_BUCKET_NAME")

      if (name && distributionId && bucket) {
        sites.push({ name, distributionId, bucket })
        continue
      }

      // Under "all", non-site projects are expected; only flag ones asked for
      if (names !== ALL_SITES) {
        missing.push({
          site: project.name ?? "",
          status: "failed",
          detail: "CodeBuild project is not a site publisher",
        })
      }
    }
  }

  return { sites, missing }
}

const getLatestSuccessfulBuildNumber = async (
  { codebuild }: AwsClients,
  projectName: string,
) => {
  let nextToken: string | undefined
  do {
    const { ids = [], nextToken: next } = await codebuild.send(
      new ListBuildsForProjectCommand({
        projectName,
        sortOrder: "DESCENDING",
        nextToken,
      }),
    )
    if (ids.length === 0) {
      return undefined
    }

    // BatchGetBuilds doesn't guarantee order, so take the highest number
    const { builds = [] } = await codebuild.send(
      new BatchGetBuildsCommand({ ids }),
    )
    const succeeded = builds
      .filter((build) => build.buildStatus === "SUCCEEDED")
      .map((build) => build.buildNumber ?? 0)
    if (succeeded.length > 0) {
      return Math.max(...succeeded)
    }

    nextToken = next
  } while (nextToken)

  return undefined
}

const buildExists = async (
  { s3 }: AwsClients,
  bucket: string,
  originPath: string,
) => {
  try {
    await s3.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: `${originPath.slice(1)}/index.html`,
      }),
    )
    return true
  } catch (error) {
    if (error instanceof NotFound) {
      return false
    }
    throw error
  }
}

const restoreSiteOnce = async (
  aws: AwsClients,
  site: Site,
  apply: boolean,
): Promise<Result> => {
  const result = (status: Status, detail: string) => ({
    site: site.name,
    status,
    detail,
  })

  const latestBuildNumber = await getLatestSuccessfulBuildNumber(aws, site.name)
  if (latestBuildNumber === undefined) {
    return result("skipped", "no successful build in CodeBuild history")
  }

  const { DistributionConfig: config, ETag } = await aws.cloudfront.send(
    new GetDistributionConfigCommand({ Id: site.distributionId }),
  )
  // The site origin's ID is the bucket name; the other is `<bucket>-static`
  const origin = config?.Origins?.Items?.find((item) => item.Id === site.bucket)
  if (!config || !origin) {
    return result(
      "failed",
      `distribution ${site.distributionId} has no origin with ID ${site.bucket}`,
    )
  }

  const currentPath = origin.OriginPath ?? ""
  const plan = planRestore(site.name, currentPath, latestBuildNumber)
  if (plan.action === "none") {
    return result("unchanged", currentPath)
  }
  if (plan.action === "skip") {
    return result("skipped", plan.reason)
  }

  if (!(await buildExists(aws, site.bucket, plan.target))) {
    return result(
      "failed",
      `${currentPath} -> ${plan.target}, but s3://${site.bucket}${plan.target}/index.html does not exist`,
    )
  }

  const change = `${currentPath} -> ${plan.target}`
  if (!apply) {
    return result("mismatch", change)
  }

  origin.OriginPath = plan.target
  await aws.cloudfront.send(
    new UpdateDistributionCommand({
      Id: site.distributionId,
      IfMatch: ETag,
      DistributionConfig: config,
    }),
  )

  // Cached error responses from the stale origin outlive the origin change
  const { Invalidation } = await aws.cloudfront.send(
    new CreateInvalidationCommand({
      DistributionId: site.distributionId,
      InvalidationBatch: {
        CallerReference: `restore-origin-${site.name}-${Date.now()}`,
        Paths: { Quantity: 1, Items: ["/*"] },
      },
    }),
  )

  return result("restored", `${change} (invalidation ${Invalidation?.Id})`)
}

const restoreSite = async (
  aws: AwsClients,
  site: Site,
  apply: boolean,
): Promise<Result> => {
  for (let attempt = 1; ; attempt++) {
    try {
      // Re-resolves the build as well as the ETag: the concurrent publish may
      // have been the one that just succeeded
      return await restoreSiteOnce(aws, site, apply)
    } catch (error) {
      if (
        error instanceof PreconditionFailed &&
        attempt < PRECONDITION_MAX_ATTEMPTS
      ) {
        continue
      }
      return {
        site: site.name,
        status: "failed",
        detail:
          error instanceof Error
            ? `${error.name}: ${error.message}`
            : String(error),
      }
    }
  }
}

const print = ({ status, site, detail }: Result) =>
  console.log(`${status.padEnd(9)}  ${site.padEnd(30)}  ${detail}`)

const runAll = async (aws: AwsClients, sites: Site[], apply: boolean) => {
  const results: Result[] = []
  const queue = [...sites]
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      for (let site = queue.shift(); site; site = queue.shift()) {
        const result = await restoreSite(aws, site, apply)
        results.push(result)
        print(result)
      }
    }),
  )
  return results
}

const printSummary = (results: Result[]) => {
  const counts = new Map<Status, number>()
  for (const { status } of results) {
    counts.set(status, (counts.get(status) ?? 0) + 1)
  }
  console.log(
    `\nSummary: ${[...counts]
      .map(([status, count]) => `${count} ${status}`)
      .join(", ")}`,
  )

  const notUnchanged = results.filter((result) => result.status !== "unchanged")
  if (notUnchanged.length > 0) {
    console.log("\nEverything not unchanged:")
    notUnchanged.forEach(print)
  }
}

export const restoreCloudfrontOrigins = async (): Promise<void> => {
  const awsProfile = await input({
    message:
      "AWS profile to use (leave blank to use your current default AWS credentials)",
    default: process.env.AWS_PROFILE,
  })
  if (awsProfile.trim()) {
    process.env.AWS_PROFILE = awsProfile.trim()
  }

  const sitesInput = await input({
    message: `Site names (CodeBuild project names, comma-separated), or "${ALL_SITES}"`,
    validate: (value) => Boolean(value.trim()) || "Enter at least one site.",
  })
  const names =
    sitesInput.trim() === ALL_SITES
      ? ALL_SITES
      : sitesInput
          .split(",")
          .map((name) => name.trim())
          .filter(Boolean)

  // Created after the profile prompt so they pick up AWS_PROFILE
  const aws: AwsClients = {
    codebuild: new CodeBuildClient({
      region: SITES_REGION,
      maxAttempts: SDK_MAX_ATTEMPTS,
    }),
    cloudfront: new CloudFrontClient({
      region: CLOUDFRONT_REGION,
      maxAttempts: SDK_MAX_ATTEMPTS,
    }),
    s3: new S3Client({ region: SITES_REGION, maxAttempts: SDK_MAX_ATTEMPTS }),
  }

  const { sites, missing } = await getSites(aws, names)
  console.log(`\nChecking ${sites.length} site(s); nothing is changed yet.\n`)
  missing.forEach(print)
  const checked = [...missing, ...(await runAll(aws, sites, false))]
  printSummary(checked)

  const mismatched = checked.filter((result) => result.status === "mismatch")
  if (mismatched.length === 0) {
    console.log("\nNo origins to restore.")
    return
  }

  const shouldApply = await confirm({
    message: `Restore ${mismatched.length} origin(s) and invalidate their caches? This mutates production if your profile points at it; get a second engineer to check the list above first.`,
    default: false,
  })
  if (!shouldApply) {
    console.log("Aborted. No origins were changed.")
    return
  }

  const mismatchedNames = new Set(mismatched.map((result) => result.site))
  console.log()
  printSummary(
    await runAll(
      aws,
      sites.filter((site) => mismatchedNames.has(site.name)),
      true,
    ),
  )
}
