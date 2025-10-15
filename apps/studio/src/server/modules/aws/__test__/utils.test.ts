import type { GrowthBook } from "@growthbook/growthbook"
import { BuildStatusType, ResourceType } from "@prisma/client"
import MockDate from "mockdate"
import { auth } from "tests/integration/helpers/auth"
import { resetTables } from "tests/integration/helpers/db"
import {
  addCodebuildProjectToSite,
  createSupersededBuildRows,
  setupCodeBuildJob,
  setupPageResource,
  setupUser,
} from "tests/integration/helpers/seed"

import type { User } from "../../database"
import { getIsScheduledPublishingEnabledForSite } from "~/lib/growthbook"
import { createBaseLogger } from "~/lib/logger"
import { db } from "../../database"
import { publishPageResource } from "../../resource/resource.service"
import { publishSite } from "../codebuild.service"
import { updateStoppedBuild } from "../utils"

vi.mock("~/server/modules/aws/utils.ts", async () => {
  const actual = await vi.importActual<
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    typeof import("~/server/modules/aws/utils.ts")
  >("~/server/modules/aws/utils.ts")
  return {
    ...actual,
    // mock the buildChanges to always return that a new build is needed
    computeBuildChanges: vi.fn().mockResolvedValue({ isNewBuildNeeded: true }),
    // do not actually start a codebuild project
    startProjectById: vi.fn().mockResolvedValue({
      id: "test-build-id",
      startTime: new Date("2024-01-01T00:00:00.000Z"),
    }),
  }
})

const getMockGrowthbook = (mockReturnValue = true) => {
  const mockGrowthBook: Partial<GrowthBook> = {
    isOn: vi.fn().mockReturnValue(mockReturnValue),
  }
  return mockGrowthBook as GrowthBook
}

describe("codebuild.service", () => {
  let user: User
  const FIXED_NOW = new Date("2024-01-01T00:00:00.000Z")
  const logger = createBaseLogger({ path: "test" })
  afterEach(() => {
    MockDate.reset() // Reset time after each test
  })
  beforeEach(async () => {
    await resetTables(
      "AuditLog",
      "ResourcePermission",
      "Blob",
      "Version",
      "Resource",
      "CodeBuildJobs",
      "Site",
      "User",
    )
    MockDate.set(FIXED_NOW) // Set a fixed time for each test
    vi.clearAllMocks()
    user = await setupUser({
      email: "test@mock.com",
      isDeleted: false,
    })
    await auth(user)
  })
  describe("publishSite", () => {
    it("updates codebuildjobs table correctly when isNewBuildNeeded is true", async () => {
      // Arrange - setup the page and publish the resource to create a codebuildjob row
      const { page } = await setupPageResource({
        resourceType: ResourceType.Page,
      })
      await addCodebuildProjectToSite(page.siteId)
      await publishPageResource({
        logger,
        user,
        siteId: page.siteId,
        resourceId: page.id,
        isScheduled: false,
        startSitePublish: false, // do not start site publish here
        addCodebuildJobRow: await getIsScheduledPublishingEnabledForSite({
          gb: getMockGrowthbook(true),
          siteId: page.siteId,
        }),
      })
      // At this point there should be a codebuildjob row with a null buildId
      const initialCodebuildJobs = await db
        .selectFrom("CodeBuildJobs")
        .selectAll()
        .where("resourceId", "=", page.id)
        .execute()

      // Act - publish the site, which should update the codebuildjob row with the started build id
      await publishSite(logger, page.siteId)

      // Assert
      // Check the initial codebuild job row
      expect(initialCodebuildJobs).toHaveLength(1)
      expect(initialCodebuildJobs[0]!.buildId).toBeNull()
      expect(initialCodebuildJobs[0]!.status).toEqual(BuildStatusType.PENDING)
      expect(initialCodebuildJobs[0]!.startedAt).toBeNull()

      // Check the updated codebuild job row
      const codebuildJobs = await db
        .selectFrom("CodeBuildJobs")
        .selectAll()
        .where("resourceId", "=", page.id)
        .execute()

      expect(codebuildJobs).toHaveLength(1)
      expect(codebuildJobs[0]!.buildId).toEqual("test-build-id")
      expect(codebuildJobs[0]!.status).toEqual(BuildStatusType.IN_PROGRESS)
      expect(codebuildJobs[0]!.startedAt).toEqual(FIXED_NOW)
    })
  })
  describe("updateStoppedBuild", () => {
    it("should mark the stopped build and any builds it has superseded as being superseded by the newly started build", async () => {
      // Arrange
      // Create a main build and 4 builds that it has superseded
      const NUMBER_SUPERSEDED_BUILDS = 4
      const NEWLY_STARTED_BUILD_ID = "newly-started-build-id"
      const { codebuildJob, page: pageForMainBuild } = await setupCodeBuildJob({
        userId: user.id,
        arn: "build/test-id",
        status: "IN_PROGRESS",
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
      if (!codebuildJob.buildId) {
        throw new Error("Codebuild job has no buildId provided")
      }
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
})
