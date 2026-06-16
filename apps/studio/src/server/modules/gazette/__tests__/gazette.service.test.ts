import { TRPCError } from "@trpc/server"
import { resetTables } from "tests/integration/helpers/db"
import { setupIsomerAdmin, setupUser } from "tests/integration/helpers/seed"
import { beforeEach, describe, expect, it, vi } from "vitest"
import * as s3Lib from "~/lib/s3"
import { IsomerAdminRole } from "~prisma/generated/generatedEnums"

// algolia.ts constructs the Algolia client at module load via
// algoliasearch(env.ALGOLIA_APP_ID, env.ALGOLIA_API_KEY). Those env vars are
// not set in the test environment, so the import throws "appId is missing"
// before any test runs. Mock the whole module to prevent this.
vi.mock("~/lib/algolia")

import * as algoliaLib from "~/lib/algolia"

import {
  assertGazetteAccess,
  buildGazetteSearchRecords,
  copyFileWithNewName,
  getPresignedPutUrl,
  removeGazetteFromAlgolia,
} from "../gazette.service"

describe("gazette.service", () => {
  beforeEach(async () => {
    vi.restoreAllMocks()
    await resetTables(
      "AuditLog",
      "ResourcePermission",
      "Blob",
      "Version",
      "Resource",
      "Site",
      "IsomerAdmin",
      "User",
    )
  })

  describe("assertGazetteAccess", () => {
    it("allows a Toppan-email user", async () => {
      const user = await setupUser({ email: "anyone@toppannext.com" })
      await expect(assertGazetteAccess(user.id)).resolves.toBeUndefined()
    })

    it("allows a Core IsomerAdmin even without a Toppan email", async () => {
      const user = await setupUser({ email: "admin@example.com" })
      await setupIsomerAdmin({ userId: user.id, role: IsomerAdminRole.Core })
      await expect(assertGazetteAccess(user.id)).resolves.toBeUndefined()
    })

    it("allows a Migrator IsomerAdmin", async () => {
      const user = await setupUser({ email: "migrator@example.com" })
      await setupIsomerAdmin({
        userId: user.id,
        role: IsomerAdminRole.Migrator,
      })
      await expect(assertGazetteAccess(user.id)).resolves.toBeUndefined()
    })

    it("rejects a user who is neither Toppan nor a qualifying admin", async () => {
      const user = await setupUser({ email: "user@example.com" })
      await expect(assertGazetteAccess(user.id)).rejects.toThrowError(
        new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to the gazette feature",
        }),
      )
    })

    it("throws INTERNAL_SERVER_ERROR if the user row is missing", async () => {
      await expect(
        assertGazetteAccess("11111111-1111-1111-1111-111111111111"),
      ).rejects.toThrowError(new TRPCError({ code: "INTERNAL_SERVER_ERROR" }))
    })
  })

  describe("copyFileWithNewName", () => {
    it("rejects a sourceKey that does not have the expected /year/cat/sub/file shape", async () => {
      await expect(
        copyFileWithNewName({
          sourceKey: "too/few/parts",
          newFileName: "renamed.pdf",
        }),
      ).rejects.toThrowError(
        new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid source key format",
        }),
      )
    })

    it("invokes copyFile with the new key built from the sanitized filename", async () => {
      const copySpy = vi.spyOn(s3Lib, "copyFile").mockResolvedValue({} as never)

      const newKey = await copyFileWithNewName({
        sourceKey: "2026/Government Gazette/Public/original.pdf",
        newFileName: "renamed:weird*name.pdf",
      })

      // filenamify replaces disallowed characters with `-`.
      expect(newKey).toBe(
        "2026/Government Gazette/Public/renamed-weird-name.pdf",
      )
      expect(copySpy).toHaveBeenCalledTimes(1)
      const args = copySpy.mock.calls[0]![0]
      expect(args.SourceKey).toBe("2026/Government Gazette/Public/original.pdf")
      expect(args.DestKey).toBe(newKey)
    })
  })

  describe("getPresignedPutUrl", () => {
    it("includes Tagging in the signer call when tags are supplied", async () => {
      const signedPutSpy = vi
        .spyOn(s3Lib, "generateSignedPutUrl")
        .mockResolvedValue("https://signed.example/put")

      await getPresignedPutUrl({
        key: "2026/Government Gazette/Public/notice.pdf",
        tags: [{ key: "scheduledAt", value: "1700000000000" }],
      })

      const args = signedPutSpy.mock.calls[0]![0]
      expect(args.Tagging).toContain("scheduledAt=1700000000000")
    })

    it("omits Tagging when no tags supplied", async () => {
      const signedPutSpy = vi
        .spyOn(s3Lib, "generateSignedPutUrl")
        .mockResolvedValue("https://signed.example/put")

      await getPresignedPutUrl({
        key: "2026/Government Gazette/Public/notice.pdf",
      })

      const args = signedPutSpy.mock.calls[0]![0]
      expect(args.Tagging).toBeUndefined()
    })
  })

  describe("buildGazetteSearchRecords", () => {
    // A fixed date in SGT (UTC+8): 2026-04-30T12:00:00 SGT = 2026-04-30T04:00:00Z
    const SGT_DATE = new Date("2026-04-30T04:00:00.000Z")

    const BASE_PARAMS = {
      parsedText: "Hello world",
      objectGroup: "2026/Government Gazette/Public/notice-123.pdf",
      title: "Government Gazette Notice 123",
      category: "Government Gazette",
      subCategory: "Public",
      fileUrl:
        "https://gazettes.example/2026/Government Gazette/Public/notice-123.pdf",
      scheduledAt: SGT_DATE,
    }

    it("returns an empty array when parsedText is empty", () => {
      // Arrange / Act
      const result = buildGazetteSearchRecords({
        ...BASE_PARAMS,
        parsedText: "",
      })

      // Assert
      expect(result).toEqual([])
    })

    it("returns a single record for short text", () => {
      // Arrange / Act
      const result = buildGazetteSearchRecords(BASE_PARAMS)

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0]!.objectID).toBe(
        "2026/Government Gazette/Public/notice-123.pdf-text-0",
      )
      expect(result[0]!.text).toBe("Hello world")
    })

    it("produces multiple records with sequential objectIDs for text > 7000 chars", () => {
      // Arrange — build text that exceeds one chunk boundary
      const chunk1 = "a".repeat(7000)
      const chunk2 = "b".repeat(100)
      const longText = chunk1 + " " + chunk2

      // Act
      const result = buildGazetteSearchRecords({
        ...BASE_PARAMS,
        parsedText: longText,
      })

      // Assert
      expect(result.length).toBeGreaterThanOrEqual(2)
      expect(result[0]!.objectID).toBe(
        "2026/Government Gazette/Public/notice-123.pdf-text-0",
      )
      expect(result[1]!.objectID).toBe(
        "2026/Government Gazette/Public/notice-123.pdf-text-1",
      )
    })

    it("sets objectGroup correctly on every record", () => {
      // Arrange / Act
      const result = buildGazetteSearchRecords(BASE_PARAMS)

      // Assert
      expect(result[0]!.objectGroup).toBe(
        "2026/Government Gazette/Public/notice-123.pdf",
      )
    })

    it("derives SG-local date fields correctly from scheduledAt", () => {
      // Arrange / Act
      // SGT_DATE is 2026-04-30 12:00 SGT, so: DD=30, MM=04, YYYY=2026
      const result = buildGazetteSearchRecords(BASE_PARAMS)
      const record = result[0]!

      // Assert
      expect(record.publishDate).toBe("30/04/2026")
      expect(record.publishYear).toBe(2026)
      expect(record.publishMonth).toBe(4)
      expect(record.publishDay).toBe(30)
      expect(record.publishTimestamp).toBe(SGT_DATE.getTime())
    })

    it("pads notificationNum to 10 chars for lexiNotificationNum when present", () => {
      // Arrange / Act
      const result = buildGazetteSearchRecords({
        ...BASE_PARAMS,
        notificationNum: "123",
      })

      // Assert
      expect(result[0]!.notificationNum).toBe("123")
      expect(result[0]!.lexiNotificationNum).toBe("0000000123")
    })

    it("omits lexiNotificationNum when notificationNum is absent (advertisement case)", () => {
      // Arrange / Act — no notificationNum in BASE_PARAMS
      const result = buildGazetteSearchRecords(BASE_PARAMS)

      // Assert
      expect(result[0]!.notificationNum).toBeUndefined()
      expect(result[0]!.lexiNotificationNum).toBeUndefined()
    })

    it("passes subCategory through unchanged", () => {
      // Arrange / Act
      const result = buildGazetteSearchRecords({
        ...BASE_PARAMS,
        subCategory: "Extraordinary",
      })

      // Assert
      expect(result[0]!.subCategory).toBe("Extraordinary")
    })
  })

  describe("removeGazetteFromAlgolia", () => {
    it("calls deleteObjectsFromSearchIndexByFilter with a correctly-quoted objectGroup filter", async () => {
      // Arrange
      const deleteSpy = vi
        .spyOn(algoliaLib, "deleteObjectsFromSearchIndexByFilter")
        .mockResolvedValue(undefined)

      // Act
      await removeGazetteFromAlgolia(
        "/2026/Government Gazette/Public/notice-123.pdf",
      )

      // Assert
      expect(deleteSpy).toHaveBeenCalledTimes(1)
      expect(deleteSpy).toHaveBeenCalledWith(
        'objectGroup:"2026/Government Gazette/Public/notice-123.pdf"',
      )
    })
  })
})
