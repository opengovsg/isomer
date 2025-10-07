import MockDate from "mockdate"
import { resetTables } from "tests/integration/helpers/db"
import {
  createSupersededBuildRows,
  setupCodeBuildJob,
  setupUser,
} from "tests/integration/helpers/seed"

import { db, User } from "../../database"
import { updateStoppedBuild } from "../utils"

describe("updateStoppedBuild", () => {
  let user: User
  const FIXED_NOW = new Date("2024-01-01T00:15:00.000Z")
  afterEach(() => {
    MockDate.reset() // Reset time after each test
  })
  beforeEach(async () => {
    MockDate.set(FIXED_NOW) // Freeze time before each test
    vi.clearAllMocks()
    await resetTables("CodeBuildJobs", "User", "Resource", "Site")
    user = await setupUser({})
  })
  it("should mark the stopped build and any builds it has superseded as being superseded by the newly started build", async () => {
    // Arrange
    // Create a main build and 4 builds that it has superseded
    const NUMBER_SUPERSEDED_BUILDS = 4
    const NEWLY_STARTED_BUILD_ID = "newly-started-build-id"
    const { codebuildJob, page: pageForMainBuild } = await setupCodeBuildJob({
      userId: user.id,
      arn: "build/test-id",
      buildStatus: "IN_PROGRESS",
      startedAt: FIXED_NOW,
      isScheduled: true,
    })
    await createSupersededBuildRows({
      numberOfSupersededBuilds: NUMBER_SUPERSEDED_BUILDS,
      supersedingBuild: codebuildJob,
      resourceId: pageForMainBuild.id,
      userId: user.id,
    })

    // Act
    // stop the main build (1) and mark it and the builds it has superseded (4) as being
    // superseded by the newly started build
    await updateStoppedBuild({
      stoppedBuildId: codebuildJob.buildId,
      startedBuildId: NEWLY_STARTED_BUILD_ID,
    })

    // Assert
    const allSupersededBuilds = await db
      .selectFrom("CodeBuildJobs")
      .selectAll()
      .where("supersededByBuildId", "=", NEWLY_STARTED_BUILD_ID)
      .execute()
    expect(allSupersededBuilds.length).toEqual(NUMBER_SUPERSEDED_BUILDS + 1) // +1 for the main build
    // expect all superseded builds to have status STOPPED
    allSupersededBuilds.forEach((build) => {
      expect(build.status).toEqual("STOPPED")
    })
  })
})
