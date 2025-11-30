import type { Build } from "@aws-sdk/client-codebuild"

/**
 * Describes the changes in build status and whether a new build is needed
 * based on the latest builds for a CodeBuild project. There should be a startedBuild,
 * and optionally a stoppedBuild if a build was recently stopped to start a new one.
 */
export interface RequiresNewBuild {
  stoppedBuild?: Required<Pick<Build, "id" | "startTime">>
  startedBuild: Required<Pick<Build, "id" | "startTime">>
  isNewBuildNeeded: true
}

/**
 * Describes the scenario where no new build is needed, and optionally
 * provides the latest running build if one such build should be linked to
 * the resource
 */
export interface RequiresNoNewBuild {
  latestRunningBuild?: Required<Pick<Build, "id" | "startTime">>
  isNewBuildNeeded: false
}

export type BuildChanges = RequiresNewBuild | RequiresNoNewBuild
