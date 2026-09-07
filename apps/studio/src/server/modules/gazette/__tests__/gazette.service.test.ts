import { TRPCError } from "@trpc/server"
import { resetTables } from "tests/integration/helpers/db"
import { setupIsomerAdmin, setupUser } from "tests/integration/helpers/seed"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { env } from "~/env.mjs"
import * as algoliaLib from "~/lib/algolia"
import * as s3Lib from "~/lib/s3"
import { IsomerAdminRole } from "~prisma/generated/generatedEnums"

import {
  assertGazetteAccess,
  copyFileWithNewName,
  getPresignedPutUrl,
  removeGazetteFromAlgolia,
} from "../gazette.service"

describe("gazette.service", () => {
  beforeEach(async () => {
    vi.restoreAllMocks()
    env.ALGOLIA_APP_ID = "test-app-id"
    env.ALGOLIA_API_KEY = "test-api-key"
    env.ALGOLIA_INDEX_NAME = "test-index"
    vi.spyOn(algoliaLib, "saveObjectsToSearchIndex").mockResolvedValue(
      )
    vi.spyOn(
      algoliaLib,
      "deleteObjectsFromSearchIndexByFilter",
    ).mockResolvedValue()
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
      await setupIsomerAdmin({ role: IsomerAdminRole.Core, userId: user.id })
      await expect(assertGazetteAccess(user.id)).resolves.toBeUndefined()
    })

    it("allows a Migrator IsomerAdmin", async () => {
      const user = await setupUser({ email: "migrator@example.com" })
      await setupIsomerAdmin({
        role: IsomerAdminRole.Migrator,
        userId: user.id,
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
          newFileName: "renamed.pdf",
          sourceKey: "too/few/parts",
        }),
      ).rejects.toThrowError(
        new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid source key format",
        }),
      )
    })

    it("invokes copyFile with the new key built from the sanitized filename", async () => {
      const copySpy = vi.spyOn(s3Lib, "copyFile").mockResolvedValue(
        // SAFETY: s3 copy response fields are unused by copyFileWithNewName.
        {} as Awaited<ReturnType<typeof s3Lib.copyFile>>,
      )

      const newKey = await copyFileWithNewName({
        newFileName: "renamed:weird*name.pdf",
        sourceKey: "2026/Government Gazette/Public/original.pdf",
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
        fileSize: 1234,
        key: "2026/Government Gazette/Public/notice.pdf",
        tags: [{ key: "scheduledAt", value: "1700000000000" }],
      })

      const args = signedPutSpy.mock.calls[0]![0]
      expect(args.Tagging).toContain("scheduledAt=1700000000000")
      expect(args.ContentLength).toBe(1234)
    })

    it("omits Tagging when no tags supplied", async () => {
      const signedPutSpy = vi
        .spyOn(s3Lib, "generateSignedPutUrl")
        .mockResolvedValue("https://signed.example/put")

      await getPresignedPutUrl({
        fileSize: 1234,
        key: "2026/Government Gazette/Public/notice.pdf",
      })

      const args = signedPutSpy.mock.calls[0]![0]
      expect(args.Tagging).toBeUndefined()
    })
  })

  describe("removeGazetteFromAlgolia", () => {
    it("calls deleteObjectsFromSearchIndexByFilter with a correctly-quoted objectGroup filter", async () => {
      // Arrange
      const deleteSpy = vi
        .spyOn(algoliaLib, "deleteObjectsFromSearchIndexByFilter")
        .mockResolvedValue()

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

    it("throws TRPCError with PRECONDITION_FAILED when the Algolia delete rejects", async () => {
      // Arrange
      vi.spyOn(
        algoliaLib,
        "deleteObjectsFromSearchIndexByFilter",
      ).mockRejectedValue(new Error("Algolia SDK error"))

      // Act
      const act = removeGazetteFromAlgolia(
        "/2026/Government Gazette/Public/notice-123.pdf",
      )

      // Assert
      await expect(act).rejects.toThrowError(
        new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Failed to remove gazette from search index",
        }),
      )
    })
  })
})
