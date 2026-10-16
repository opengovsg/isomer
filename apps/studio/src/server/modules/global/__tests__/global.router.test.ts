import type * as S3 from "~/lib/s3"
import { TRPCError } from "@trpc/server"
import { resetTables } from "tests/integration/helpers/db"
import {
  applyAuthedSession,
  createMockRequest,
} from "tests/integration/helpers/iron-session"
import {
  setupIsomerAdmin,
  setUpWhitelist,
} from "tests/integration/helpers/seed"
import { vi } from "vitest"
import { MOE_SITES } from "~/constants/misc"
import { getTextObject, putObjectDirect } from "~/lib/s3"
import { createCallerFactory } from "~/server/trpc"
import { IsomerAdminRole } from "~prisma/generated/generatedEnums"

import { globalRouter } from "../global.router"

vi.mock("~/lib/s3", async (importOriginal) => ({
  ...(await importOriginal<typeof S3>()),
  getTextObject: vi.fn(),
  putObjectDirect: vi.fn(),
}))

const createCaller = createCallerFactory(globalRouter)

const NOTIFICATION = { title: "Haze advisory" }
const ETAG = '"abc123"'
const HTTP_PRECONDITION_FAILED = 412

describe("global.router", async () => {
  let caller: ReturnType<typeof createCaller>
  const session = await applyAuthedSession()

  beforeAll(() => {
    caller = createCaller(createMockRequest(session))
  })

  beforeEach(async () => {
    await resetTables("IsomerAdmin")
    await setUpWhitelist({ email: "test@open.gov.sg" })
    vi.clearAllMocks()
    vi.mocked(putObjectDirect).mockResolvedValue(undefined)
  })

  describe("getNotification", () => {
    it("returns the first entry and its version for a Core admin", async () => {
      // Arrange
      await setupIsomerAdmin({ userId: session.userId! })
      vi.mocked(getTextObject).mockResolvedValue({
        body: JSON.stringify([
          { notification: NOTIFICATION, targetSites: MOE_SITES },
        ]),
        eTag: ETAG,
      })

      // Act
      const result = await caller.getNotification()

      // Assert
      expect(result).toEqual({ notification: NOTIFICATION, version: ETAG })
    })

    it("returns an empty state when nothing is published yet", async () => {
      // Arrange
      await setupIsomerAdmin({ userId: session.userId! })
      vi.mocked(getTextObject).mockResolvedValue(null)

      // Act
      const result = await caller.getNotification()

      // Assert
      expect(result).toEqual({ notification: null, version: null })
    })

    it("rejects a Migrator before reading S3", async () => {
      // Arrange
      await setupIsomerAdmin({
        userId: session.userId!,
        role: IsomerAdminRole.Migrator,
      })

      // Act
      const result = caller.getNotification()

      // Assert
      await expect(result).rejects.toThrow(TRPCError)
      expect(getTextObject).not.toHaveBeenCalled()
    })
  })

  describe("setNotification", () => {
    it("publishes to MOE sites conditioned on the loaded version", async () => {
      // Arrange
      await setupIsomerAdmin({ userId: session.userId! })

      // Act
      await caller.setNotification({
        notification: NOTIFICATION,
        version: ETAG,
      })

      // Assert
      expect(putObjectDirect).toHaveBeenCalledWith(
        expect.objectContaining({
          Body: JSON.stringify([
            { notification: NOTIFICATION, targetSites: MOE_SITES },
          ]),
          IfMatch: ETAG,
        }),
      )
    })

    it("only creates the file when no version was loaded", async () => {
      // Arrange
      await setupIsomerAdmin({ userId: session.userId! })

      // Act
      await caller.setNotification({ notification: null, version: null })

      // Assert
      expect(putObjectDirect).toHaveBeenCalledWith(
        expect.objectContaining({ Body: "[]", IfNoneMatch: "*" }),
      )
    })

    it("returns CONFLICT when someone else published first", async () => {
      // Arrange
      await setupIsomerAdmin({ userId: session.userId! })
      vi.mocked(putObjectDirect).mockRejectedValue(
        Object.assign(new Error("PreconditionFailed"), {
          $metadata: { httpStatusCode: HTTP_PRECONDITION_FAILED },
        }),
      )

      // Act
      const result = caller.setNotification({
        notification: NOTIFICATION,
        version: ETAG,
      })

      // Assert
      await expect(result).rejects.toMatchObject({ code: "CONFLICT" })
    })

    it("rejects content the site cannot render", async () => {
      // Arrange
      await setupIsomerAdmin({ userId: session.userId! })

      // Act
      const result = caller.setNotification({
        notification: { title: "Notice", content: {} } as never,
        version: ETAG,
      })

      // Assert
      await expect(result).rejects.toMatchObject({ code: "BAD_REQUEST" })
      expect(putObjectDirect).not.toHaveBeenCalled()
    })

    it("rejects a user who is not an Isomer admin before writing S3", async () => {
      // Act
      const result = caller.setNotification({
        notification: NOTIFICATION,
        version: ETAG,
      })

      // Assert
      await expect(result).rejects.toThrow(TRPCError)
      expect(putObjectDirect).not.toHaveBeenCalled()
    })
  })
})
