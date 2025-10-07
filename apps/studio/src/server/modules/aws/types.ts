import { Build } from "@aws-sdk/client-codebuild"

interface RequiresNewBuild {
  startedBuild: Pick<Build, "id" | "startTime">
  stoppedBuild?: Pick<Build, "id" | "startTime">
  isNewBuildNeeded: true
}

interface RequiresNoNewBuild {
  latestRunningBuild?: Pick<Build, "id" | "startTime">
  isNewBuildNeeded: false
}

export type BuildChanges = RequiresNewBuild | RequiresNoNewBuild
