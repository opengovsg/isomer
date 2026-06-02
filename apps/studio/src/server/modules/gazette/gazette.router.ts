import { TRPCError } from "@trpc/server"
import { isBefore, subYears } from "date-fns"
import { env } from "~/env.mjs"
import { sendScheduledPageEmail } from "~/features/mail/service"
import { getFileSize } from "~/lib/s3"
import {
  createGazetteServerSchema,
  gazetteListSchema,
  updateGazetteServerSchema,
} from "~/schemas/gazette"
import { protectedProcedure, router } from "~/server/trpc"

import {
  copyFileWithNewName,
  doAllFileKeysBelongToSite,
  markFileAsDeleted,
} from "../asset/asset.service"
import { logResourceEvent } from "../audit/audit.service"
import { createCollectionLinkJson } from "../collection/collection.service"
import { AuditLogEvent, db, jsonb, ResourceType, sql } from "../database"
import { PG_ERROR_CODES } from "../database/constants"
import { bulkValidateUserPermissionsForResources } from "../permissions/permissions.service"
import {
  defaultResourceSelect,
  getBlobOfResource,
  updateBlobById,
  updatePageById,
} from "../resource/resource.service"
import {
  assertGazetteAccess,
  findCollectionLinkWithFilename,
} from "./gazette.service"

interface GazetteBlobInputs {
  ref: string
  category: string
  date: string
  description?: string
  tagged: string[]
}

// Blob.content adheres to the PrismaJson.BlobJsonContent contract shared with
// the components package. We deliberately do NOT add gazette-only fields like
// `fileSize` here — the file size is read from S3 at list time instead, since
// the page is bounded to ~25 rows and S3 HEAD scales to thousands of QPS.
const buildGazetteBlobContent = ({
  ref,
  category,
  date,
  description,
  tagged,
}: GazetteBlobInputs) => {
  const base = createCollectionLinkJson({ type: ResourceType.CollectionLink })
  return {
    ...base,
    page: {
      ...base.page,
      ref,
      category,
      date,
      description,
      tagged,
    },
  }
}

const GAZETTE_FILE_SCOPE_ERROR_MESSAGE =
  "The gazette file does not belong to the specified site. You may only use assets for the site you are authorized for."

const toS3Key = (ref: string) => ref.replace(/^\//, "")

const assertGazetteRefsBelongToSite = ({
  refs,
  siteId,
}: {
  refs: string[]
  siteId: number
}) => {
  const fileKeys = refs.filter(Boolean).map(toS3Key)
  if (!doAllFileKeysBelongToSite({ fileKeys, siteId })) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: GAZETTE_FILE_SCOPE_ERROR_MESSAGE,
    })
  }
}

export const gazetteRouter = router({
  list: protectedProcedure
    .input(gazetteListSchema)
    .query(async ({ ctx, input: { siteId, collectionId, limit, offset } }) => {
      await assertGazetteAccess(ctx.user.id)
      await bulkValidateUserPermissionsForResources({
        siteId,
        action: "read",
        userId: ctx.user.id,
      })

      const results = await db
        .selectFrom("Resource")
        .leftJoin("Blob as DraftBlob", "Resource.draftBlobId", "DraftBlob.id")
        .leftJoin("Version", "Resource.publishedVersionId", "Version.id")
        .leftJoin("Blob as PublishedBlob", "Version.blobId", "PublishedBlob.id")
        .where("parentId", "=", String(collectionId))
        .where("Resource.siteId", "=", siteId)
        .where("Resource.type", "in", [
          ResourceType.CollectionPage,
          ResourceType.CollectionLink,
        ])
        // NOTE: Only show gazettes published within the past year (or not yet published)
        .where((eb) =>
          eb.or([
            eb("Version.publishedAt", ">", subYears(new Date(), 1)),
            eb("Version.publishedAt", "is", null),
          ]),
        )
        // 1. Status priority: Published last (8), Scheduled first (7)
        .orderBy(
          sql`CASE
              WHEN "Resource"."state" = 'Published' THEN 8
              WHEN "Resource"."scheduledAt" IS NOT NULL THEN 7
              ELSE 9
            END`,
          "asc",
        )
        // 2. Publish date descending
        .orderBy("Version.publishedAt", (ob) => ob.desc().nullsLast())
        // 3. Category priority from blob content
        .orderBy((eb) => {
          const categoryExpr = sql<string>`COALESCE("DraftBlob"."content", "PublishedBlob"."content")->'page'->>'category'`
          return eb
            .case()
            .when(categoryExpr, "=", "Government Gazette")
            .then(1)
            .when(categoryExpr, "=", "Legislation Supplements")
            .then(2)
            .when(categoryExpr, "=", "Other Supplements")
            .then(3)
            .else(4)
            .end()
        }, "asc")
        // 4. Notification number descending (stored in page.description)
        .orderBy(
          sql`COALESCE("DraftBlob"."content", "PublishedBlob"."content")->'page'->>'description'`,
          (ob) => ob.desc().nullsLast(),
        )
        // 5. File ID descending (extract filename from page.ref)
        .orderBy(
          sql`COALESCE("DraftBlob"."content", "PublishedBlob"."content")->'page'->>'ref'`,
          (ob) => ob.desc().nullsLast(),
        )
        // 6. Updated at descending (tie-breaker)
        .orderBy("Resource.updatedAt", "desc")
        .orderBy("Resource.id", "asc")
        .limit(limit)
        .offset(offset)
        .select([
          ...defaultResourceSelect,
          "Version.publishedAt",
          (eb) =>
            eb.fn
              .coalesce("DraftBlob.content", "PublishedBlob.content")
              .as("content"),
        ])
        .execute()

      // Fetch each gazette's file size from S3 in parallel. The page is
      // bounded to ~25 rows per request and S3 HEAD scales to thousands of
      // QPS, so the N HEADs are fine — keeping the size out of the blob
      // preserves the PrismaJson.BlobJsonContent contract with the
      // components package.
      return Promise.all(
        results.map(async (result) => {
          const ref = (result.content as { page?: { ref?: string } } | null)
            ?.page?.ref

          if (!ref) {
            return {
              ...result,
              fileSize: null,
              scheduledAt: result.scheduledAt ?? result.publishedAt,
            }
          }
          if (
            !doAllFileKeysBelongToSite({ fileKeys: [toS3Key(ref)], siteId })
          ) {
            ctx.logger.warn(
              { ref, siteId, resourceId: result.id },
              "Skipped gazette file size lookup for out-of-scope ref",
            )
            return {
              ...result,
              fileSize: null,
              scheduledAt: result.scheduledAt ?? result.publishedAt,
            }
          }

          const fileSize = await getFileSize({
            Bucket: env.NEXT_PUBLIC_S3_ASSETS_BUCKET_NAME,
            // NOTE: s3 keys don't have a leading /
            // so we trim the first key since our `ref`
            // begins with one internally
            Key: ref.slice(1),
          })
          return {
            ...result,
            fileSize,
            scheduledAt: result.scheduledAt ?? result.publishedAt,
          }
        }),
      )
    }),

  create: protectedProcedure
    .input(createGazetteServerSchema)
    .mutation(
      async ({
        ctx,
        input: {
          siteId,
          collectionId,
          title,
          permalink,
          ref,
          category,
          date,
          description,
          tagged,
          scheduledAt,
        },
      }) => {
        await assertGazetteAccess(ctx.user.id)
        await bulkValidateUserPermissionsForResources({
          siteId,
          action: "create",
          userId: ctx.user.id,
          resourceIds: [String(collectionId)],
        })
        assertGazetteRefsBelongToSite({ refs: [ref], siteId })

        const user = await db
          .selectFrom("User")
          .where("id", "=", ctx.user.id)
          .selectAll()
          .executeTakeFirstOrThrow(() => new TRPCError({ code: "BAD_REQUEST" }))

        const blobContent = buildGazetteBlobContent({
          ref,
          category,
          date,
          description,
          tagged,
        })

        const created = await db.transaction().execute(async (tx) => {
          // Check for duplicate file ID (filename portion of ref) in the same collection
          // ref format: /sites/{siteId}/gazettes/{uuid}/filename.pdf
          const filename = ref.split("/").pop()
          if (filename) {
            const duplicate = await findCollectionLinkWithFilename({
              trx: tx,
              siteId,
              parentId: String(collectionId),
              filename,
            })
            if (duplicate) {
              throw new TRPCError({
                code: "CONFLICT",
                message: "A gazette with the same file ID already exists",
              })
            }
          }
          const parentCollection = await tx
            .selectFrom("Resource")
            .where("Resource.id", "=", String(collectionId))
            .where("Resource.siteId", "=", siteId)
            .where("Resource.type", "=", ResourceType.Collection)
            .select(["Resource.id"])
            .executeTakeFirst()

          if (!parentCollection) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Parent collection does not exist",
            })
          }

          const blob = await tx
            .insertInto("Blob")
            .values({ content: jsonb(blobContent) })
            .returningAll()
            .executeTakeFirstOrThrow()

          const resource = await tx
            .insertInto("Resource")
            .values({
              title,
              permalink,
              siteId,
              parentId: String(collectionId),
              draftBlobId: blob.id,
              type: ResourceType.CollectionLink,
              scheduledAt,
              scheduledBy: user.id,
            })
            .returningAll()
            .executeTakeFirstOrThrow()
            .catch((err: unknown) => {
              if (
                (err as { code?: string }).code ===
                PG_ERROR_CODES.uniqueViolation
              ) {
                throw new TRPCError({
                  code: "CONFLICT",
                  message: "A resource with the same permalink already exists",
                })
              }
              throw err
            })

          await logResourceEvent(tx, {
            siteId,
            eventType: AuditLogEvent.ResourceCreate,
            by: user,
            delta: {
              before: null,
              after: { resource, blob },
            },
          })

          await logResourceEvent(tx, {
            siteId,
            eventType: AuditLogEvent.SchedulePublish,
            by: user,
            delta: {
              before: { ...resource, scheduledAt: null, scheduledBy: null },
              after: resource,
            },
          })

          return resource
        })

        // Skip the email when scheduledAt is in the past — that is the
        // immediate-publish path used by eGazette.
        if (!isBefore(scheduledAt, new Date())) {
          await sendScheduledPageEmail({
            resource: created,
            scheduledAt,
            recipientEmail: user.email,
          })
        }

        return { gazetteId: created.id }
      },
    ),

  update: protectedProcedure
    .input(updateGazetteServerSchema)
    .mutation(
      async ({
        ctx,
        input: {
          siteId,
          gazetteId,
          title,
          newRef,
          desiredFileName,
          category,
          date,
          description,
          tagged,
          scheduledAt,
        },
      }) => {
        await assertGazetteAccess(ctx.user.id)
        await bulkValidateUserPermissionsForResources({
          siteId,
          action: "update",
          userId: ctx.user.id,
          resourceIds: [String(gazetteId)],
        })

        const user = await db
          .selectFrom("User")
          .where("id", "=", ctx.user.id)
          .selectAll()
          .executeTakeFirstOrThrow(() => new TRPCError({ code: "BAD_REQUEST" }))

        // Pre-fetch the existing blob so we know the current ref. Held briefly
        // outside the transaction; the real consistency boundary is the tx
        // below where we write the resolved ref.
        const existingResource = await db
          .selectFrom("Resource")
          .where("Resource.id", "=", String(gazetteId))
          .where("Resource.siteId", "=", siteId)
          .where("Resource.type", "=", ResourceType.CollectionLink)
          .selectAll()
          .executeTakeFirstOrThrow(
            () =>
              new TRPCError({
                code: "NOT_FOUND",
                message: "Gazette not found",
              }),
          )

        const existingBlob = await getBlobOfResource({
          db,
          resourceId: existingResource.id,
        })
        const existingRef =
          (existingBlob.content as { page?: { ref?: string } } | null)?.page
            ?.ref ?? ""
        if (newRef) {
          assertGazetteRefsBelongToSite({ refs: [newRef], siteId })
        }

        // Resolve the final ref. Preference order:
        //   1. newRef (a fresh upload) — caller has already PUT to S3
        //   2. desiredFileName + existing ref → S3 copy
        //   3. unchanged
        // For the rename case we pre-check for a duplicate file ID BEFORE the
        // S3 copy so a conflict never orphans a freshly copied object; the
        // authoritative atomic check still runs inside the transaction below.
        // Soft-delete of the old key happens AFTER DB commit so a tx rollback
        // never strands the resource pointing at a tombstoned key.
        const oldFilename = existingRef.split("/").pop()

        let newFilename: string | undefined
        let finalRef = existingRef
        let oldRefToCleanUp: string | null = null
        if (newRef) {
          newFilename = newRef.split("/").pop()
          finalRef = newRef
          if (existingRef) {
            assertGazetteRefsBelongToSite({ refs: [existingRef], siteId })
            oldRefToCleanUp = toS3Key(existingRef)
          }
        } else if (
          desiredFileName &&
          existingRef &&
          desiredFileName !== oldFilename
        ) {
          newFilename = desiredFileName
          assertGazetteRefsBelongToSite({ refs: [existingRef], siteId })

          const duplicate = await findCollectionLinkWithFilename({
            siteId,
            parentId: existingResource.parentId,
            filename: newFilename,
            excludeId: String(gazetteId),
          })
          if (duplicate) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "A gazette with the same file ID already exists",
            })
          }

          const sourceKey = toS3Key(existingRef)
          const newKey = await copyFileWithNewName({
            sourceKey,
            newFileName: desiredFileName,
          })
          finalRef = `/${newKey}`
          oldRefToCleanUp = sourceKey
        }

        const newBlobContent = buildGazetteBlobContent({
          ref: finalRef,
          category,
          date,
          description,
          tagged,
        })

        const { resource: updatedResource, scheduledAtChanged } = await db
          .transaction()
          .execute(async (tx) => {
            // Authoritative duplicate check inside the tx for atomicity.
            if (newFilename && newFilename !== oldFilename) {
              const duplicate = await findCollectionLinkWithFilename({
                trx: tx,
                siteId,
                parentId: existingResource.parentId,
                filename: newFilename,
                excludeId: String(gazetteId),
              })
              if (duplicate) {
                throw new TRPCError({
                  code: "CONFLICT",
                  message: "A gazette with the same file ID already exists",
                })
              }
            }

            const updatedBlob = await updateBlobById(tx, {
              content: newBlobContent,
              pageId: gazetteId,
              siteId,
            })

            // Mirror gazette.create: past timestamps are accepted and treated
            // as "publish immediately" — the schedule worker will pick them up
            // on its next tick. We don't silently rewrite the value the caller
            // sent.
            const scheduledAtChanged =
              scheduledAt.getTime() !== existingResource.scheduledAt?.getTime()

            const updated = await updatePageById(
              {
                id: gazetteId,
                siteId,
                title,
                scheduledAt,
                scheduledBy: scheduledAtChanged
                  ? user.id
                  : existingResource.scheduledBy,
              },
              tx,
            )
            if (!updated) {
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to update gazette",
              })
            }

            await logResourceEvent(tx, {
              siteId,
              eventType: AuditLogEvent.ResourceUpdate,
              by: user,
              delta: {
                before: { blob: existingBlob, resource: existingResource },
                after: { blob: updatedBlob, resource: updated },
              },
            })

            if (scheduledAtChanged) {
              await logResourceEvent(tx, {
                siteId,
                eventType: AuditLogEvent.SchedulePublish,
                by: user,
                delta: { before: existingResource, after: updated },
              })
            }

            return { resource: updated, scheduledAtChanged }
          })

        // After the DB has committed the new ref, soft-delete the file the
        // gazette no longer points at.
        if (oldRefToCleanUp) {
          try {
            await markFileAsDeleted({ key: oldRefToCleanUp })
          } catch (err) {
            ctx.logger.warn(
              { err, key: oldRefToCleanUp },
              "Failed to soft-delete superseded gazette file",
            )
          }
        }

        if (
          scheduledAtChanged &&
          updatedResource.scheduledAt &&
          !isBefore(updatedResource.scheduledAt, new Date())
        ) {
          await sendScheduledPageEmail({
            resource: updatedResource,
            scheduledAt: updatedResource.scheduledAt,
            recipientEmail: user.email,
          })
        }

        return { gazetteId: updatedResource.id }
      },
    ),
})
