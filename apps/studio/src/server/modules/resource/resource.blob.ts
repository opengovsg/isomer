import { TRPCError } from "@trpc/server"
import { hasNonEmptyString } from "~/utils/truthiness"

import type { SafeKysely } from "../database/types"
import { ResourceType } from "../database/types"

interface GetBlobProps {
  db: SafeKysely
  resourceId: string
}

export const getBlobOfResource = async ({
  db: kysely,
  resourceId,
}: GetBlobProps) => {
  const { draftBlobId, publishedVersionId } = await kysely
    .selectFrom("Resource")
    .where("id", "=", resourceId)
    .select(["draftBlobId", "publishedVersionId"])
    .executeTakeFirstOrThrow(
      () =>
        new TRPCError({
          code: "NOT_FOUND",
          message: "The specified resource could not be found",
        }),
    )

  if (hasNonEmptyString(draftBlobId)) {
    return await kysely
      .selectFrom("Blob")
      .where("id", "=", draftBlobId)
      .selectAll()
      // NOTE: Guaranteed to exist since this is a foreign key
      .executeTakeFirstOrThrow()
  }

  return await kysely
    .selectFrom("Blob")
    .selectAll()
    .where("Blob.id", "=", (eb) =>
      eb
        .selectFrom("Version")
        .where("id", "=", publishedVersionId)
        .select("blobId"),
    )
    .executeTakeFirstOrThrow()
}

// NOTE: This function gets the published blob preferentially,
// and if it fails to get a published blob (because the resource has never been published),
// it will fall back to the draft blob
export const getPublishedIndexBlobByParentId = async ({
  db: kysely,
  resourceId,
}: GetBlobProps) => {
  const { draftBlobId, publishedVersionId } = await kysely
    .selectFrom("Resource")
    .where("parentId", "=", resourceId)
    .where("type", "=", ResourceType.IndexPage)
    .select(["draftBlobId", "publishedVersionId"])
    .executeTakeFirstOrThrow(
      () =>
        new TRPCError({
          code: "NOT_FOUND",
          message: "The specified resource could not be found",
        }),
    )

  if (hasNonEmptyString(publishedVersionId)) {
    return await kysely
      .selectFrom("Blob")
      .selectAll()
      .where("Blob.id", "=", (eb) =>
        eb
          .selectFrom("Version")
          .where("id", "=", publishedVersionId)
          .select("blobId"),
      )
      .executeTakeFirstOrThrow()
  }

  return await kysely
    .selectFrom("Blob")
    .where("id", "=", draftBlobId)
    .selectAll()
    // NOTE: Guaranteed to exist since this is a foreign key
    .executeTakeFirstOrThrow()
}
