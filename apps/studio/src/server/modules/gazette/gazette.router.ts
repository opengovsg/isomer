import { TRPCError } from "@trpc/server"
import { differenceInMinutes, isBefore, subYears } from "date-fns"
import filenamify from "filenamify"
import { ALLOWED_GAZETTE_DELETION_TIMEFRAME_IN_MINUTES } from "~/constants/gazette"
import { env } from "~/env.mjs"
import {
  sendGazetteDeletionEmail,
  sendScheduledPageEmail,
} from "~/features/mail/service"
import { ENABLE_SEARCHSG_GAZETTE_INGESTION } from "~/lib/growthbook"
import { getFileSize, markScheduledAssetAsCancelled } from "~/lib/s3"
import {
  cancelScheduledPublishSchema,
  createGazetteServerSchema,
  deleteGazetteSchema,
  gazetteListSchema,
  getPresignedGetUrlSchema,
  getPresignedPutUrlSchema,
  updateGazetteServerSchema,
} from "~/schemas/gazette"
import { protectedProcedure, router } from "~/server/trpc"

import { validateUserPermissionsForAsset } from "../asset/asset.service"
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
  findCollectionLinkWithFilename,
  hasDuplicateNotificationNumber,
  assertGazetteAccess,
  copyFileWithNewName,
  deleteGazetteAsset,
  getPresignedGetUrl,
  getPresignedPutUrl,
  markFileAsDeleted,
  removeGazetteFromAlgolia,
  removeGazetteFromSearchIndex,
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
        // 2. Category priority from blob content
        .orderBy((eb) => {
          const categoryExpr = sql<string>`COALESCE("DraftBlob"."content", "PublishedBlob"."content")->'page'->>'category'`
          return eb
            .case()
            .when(categoryExpr, "=", "Government Gazette")
            .then(1)
            .when(categoryExpr, "=", "Legislative Supplements")
            .then(2)
            .when(categoryExpr, "=", "Other Supplements")
            .then(3)
            .else(4)
            .end()
        }, "asc")
        // 3. Notification number descending (stored in page.description)
        .orderBy(
          sql`COALESCE("DraftBlob"."content", "PublishedBlob"."content")->'page'->>'description'`,
          (ob) => ob.desc(),
        )
        // 4. Publish date descending
        .orderBy("Version.publishedAt", (ob) => ob.desc())
        // 5. Scheuled date descending
        .orderBy("Resource.scheduledAt", (ob) => ob.desc())
        // 6. Toppan file ID descending — the last path segment of page.ref.
        //    e.g. "/2026/Government Gazette/Advertisements/26adv6175b.pdf"
        //    -> "26adv6175b.pdf". Strip everything up to the final slash so we
        //    sort on the file ID, not the full path.
        .orderBy(
          sql`regexp_replace(COALESCE("DraftBlob"."content", "PublishedBlob"."content")->'page'->>'ref', '.*/', '')`,
          (ob) => ob.desc(),
        )
        // 7. Updated at descending (tie-breaker)
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
          const fileSize = await getFileSize({
            Bucket: env.S3_GAZETTE_BUCKET_NAME,
            // NOTE: s3 keys don't have a leading /
            // so we trim the first key since our `ref`
            // begins with one internally
            Key: ref.slice(1),
          })
          return {
            ...result,
            fileSize,
            scheduledAt: result.scheduledAt ?? result.publishedAt,
            publishedAt: result.publishedAt,
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

          // Reject a duplicate notification number within the same category and
          // publish year (and subcategory, for non-Government Gazette categories).
          if (
            description &&
            (await hasDuplicateNotificationNumber({
              trx: tx,
              siteId,
              parentId: String(collectionId),
              notificationNumber: description,
              publishDate: date,
              category,
              subCategory: tagged[0] ?? "",
            }))
          ) {
            throw new TRPCError({
              code: "CONFLICT",
              message:
                "A gazette with the same notification number already exists",
            })
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

          // NOTE: Schedule the document to be ingested into searchsg later
          await tx
            .insertInto("PushDocumentJob")
            .values({
              resourceId: resource.id,
              scheduledAt,
              scheduledBy: user.id,
            })
            .executeTakeFirstOrThrow()

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
          // S3 keys are deterministic (year/category/subcategory/filename), so
          // a re-upload that keeps the same metadata lands on the SAME key as
          // the existing ref — cleaning up would tombstone the live file.
          if (existingRef && existingRef !== newRef) {
            oldRefToCleanUp = existingRef.replace(/^\//, "")
          }
        } else if (
          desiredFileName &&
          existingRef &&
          desiredFileName !== oldFilename
        ) {
          newFilename = desiredFileName

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

          const sourceKey = existingRef.replace(/^\//, "")
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

            // Reject a duplicate notification number within the same category
            // and publish year (and subcategory, for non-Government Gazette
            // categories), excluding the gazette being edited.
            if (
              description &&
              (await hasDuplicateNotificationNumber({
                trx: tx,
                siteId,
                parentId: existingResource.parentId,
                notificationNumber: description,
                publishDate: date,
                category,
                subCategory: tagged[0] ?? "",
                excludeId: String(gazetteId),
              }))
            ) {
              throw new TRPCError({
                code: "CONFLICT",
                message:
                  "A gazette with the same notification number already exists",
              })
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
              // NOTE: Need to update the associated PushDocumentJob.
              // Defence-in-depth: scope to a PushDocumentJob whose Resource
              // belongs to this siteId (PushDocumentJob has no direct siteId
              // column, so we constrain via the Resource subquery).
              await tx
                .updateTable("PushDocumentJob")
                .set({
                  scheduledAt,
                  scheduledBy: user.id,
                })
                .where("resourceId", "=", String(gazetteId))
                .where("resourceId", "in", (eb) =>
                  eb
                    .selectFrom("Resource")
                    .select("Resource.id")
                    .where("Resource.siteId", "=", siteId),
                )
                .executeTakeFirstOrThrow(
                  () =>
                    new TRPCError({
                      code: "INTERNAL_SERVER_ERROR",
                      message: "Failed to update push document job",
                    }),
                )

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

  cancelScheduledPublish: protectedProcedure
    .input(cancelScheduledPublishSchema)
    .mutation(async ({ ctx, input: { siteId, gazetteId } }) => {
      await assertGazetteAccess(ctx.user.id)
      await bulkValidateUserPermissionsForResources({
        siteId,
        action: "delete",
        userId: ctx.user.id,
        resourceIds: [String(gazetteId)],
      })

      const user = await db
        .selectFrom("User")
        .where("id", "=", ctx.user.id)
        .selectAll()
        .executeTakeFirstOrThrow(() => new TRPCError({ code: "BAD_REQUEST" }))

      // Pre-fetch the resource and blob for audit delta
      const existingResource = await db
        .selectFrom("Resource")
        .where("Resource.id", "=", String(gazetteId))
        .where("Resource.siteId", "=", siteId)
        .where("Resource.type", "=", ResourceType.CollectionLink)
        .selectAll()
        .executeTakeFirstOrThrow(
          () =>
            new TRPCError({ code: "NOT_FOUND", message: "Gazette not found" }),
        )

      if (!existingResource.scheduledAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot cancel a gazette that is not scheduled",
        })
      }

      const existingBlob = await getBlobOfResource({
        db,
        resourceId: existingResource.id,
      })
      const ref = (existingBlob.content as { page?: { ref?: string } } | null)
        ?.page?.ref

      // Atomic transaction: delete PushDocumentJob + Resource + Blob, then log audits.
      // Logs go last so each entry describes a deletion that has actually happened.
      const deletedResource = await db.transaction().execute(async (tx) => {
        // 1. Delete the PushDocumentJob and capture the row. Defence-in-depth:
        // scope via Resource subquery on siteId (PushDocumentJob has no direct
        // siteId column).
        const deletedJobs = await tx
          .deleteFrom("PushDocumentJob")
          .where("resourceId", "=", String(gazetteId))
          .where("resourceId", "in", (eb) =>
            eb
              .selectFrom("Resource")
              .select("Resource.id")
              .where("Resource.siteId", "=", siteId),
          )
          .returningAll()
          .execute()

        // 2. Delete the Blob first (foreign key constraint)
        if (existingResource.draftBlobId) {
          await tx
            .deleteFrom("Blob")
            .where("id", "=", existingResource.draftBlobId)
            .execute()
        }

        // 3. Delete the Resource — scoped to siteId defence-in-depth.
        const deletedResources = await tx
          .deleteFrom("Resource")
          .where("id", "=", String(gazetteId))
          .where("siteId", "=", siteId)
          .returningAll()
          .execute()

        // 4. Log the cancellation audit event against the deleted job row.
        // The truthful subject of "cancel scheduled publish" is the job that
        // was cancelled.
        const [deletedJob] = deletedJobs
        if (deletedJob) {
          const {
            createdAt: _createdAt,
            updatedAt: _updatedAt,
            ...job
          } = deletedJob
          await logResourceEvent(tx, {
            siteId,
            eventType: AuditLogEvent.CancelSchedulePublish,
            by: user,
            delta: { before: job, after: null },
          })
        }

        // 5. Log the resource deletion audit event
        await logResourceEvent(tx, {
          siteId,
          eventType: AuditLogEvent.ResourceDelete,
          by: user,
          delta: {
            before: { resource: existingResource, blob: existingBlob },
            after: null,
          },
        })

        return deletedResources
      })

      // After DB transaction commits, update S3 tags (best-effort)
      // No need to guarantee this because we already set a `scheduledAt` tag
      // which prevents the gazette from being seen by MOP anyway
      if (ref) {
        try {
          await markScheduledAssetAsCancelled({
            Key: ref.slice(1), // Remove leading slash
            Bucket: env.S3_GAZETTE_BUCKET_NAME,
          })
        } catch (err) {
          ctx.logger.warn(
            { err, key: ref },
            "Failed to mark cancelled gazette file in S3",
          )
        }
      }

      return { resource: deletedResource }
    }),
  getPresignedPutUrl: protectedProcedure
    .input(getPresignedPutUrlSchema)
    .mutation(
      async ({
        ctx,
        input: {
          year,
          category,
          subcategory,
          tags,
          siteId,
          fileName,
          fileSize,
          resourceId,
        },
      }) => {
        await assertGazetteAccess(ctx.user.id)
        await validateUserPermissionsForAsset({
          siteId,
          resourceId,
          action: "create",
          userId: ctx.user.id,
        })

        const sanitizedFileName = filenamify(fileName, { replacement: "-" })
        const fileKey = `${year}/${category}/${subcategory}/${sanitizedFileName}`

        const { presignedPutUrl, contentType, contentDisposition } =
          await getPresignedPutUrl({
            key: fileKey,
            fileSize,
            tags,
          })

        ctx.logger.info(
          {
            userId: ctx.session?.userId,
            siteId,
            fileName,
            fileKey,
          },
          `Generated presigned PUT URL for ${fileKey} for site ${siteId}`,
        )

        return {
          fileKey,
          presignedPutUrl,
          contentType,
          contentDisposition,
        }
      },
    ),

  getPresignedGetUrl: protectedProcedure
    .input(getPresignedGetUrlSchema)
    .mutation(async ({ ctx, input: { siteId, fileKey } }) => {
      await assertGazetteAccess(ctx.user.id)

      await bulkValidateUserPermissionsForResources({
        siteId,
        action: "read",
        userId: ctx.user.id,
      })

      const presignedGetUrl = await getPresignedGetUrl({ key: fileKey })

      ctx.logger.info(
        { userId: ctx.session?.userId, siteId, fileKey },
        `Generated presigned GET URL for gazette ${fileKey}`,
      )

      return { presignedGetUrl }
    }),
  delete: protectedProcedure
    .input(deleteGazetteSchema)
    .mutation(async ({ ctx, input: { siteId, gazetteId } }) => {
      // First, make sure that the users are from Toppan and can actually delete gazettes
      await assertGazetteAccess(ctx.user.id)
      await bulkValidateUserPermissionsForResources({
        siteId,
        action: "delete",
        userId: ctx.user.id,
        resourceIds: [String(gazetteId)],
      })

      const user = await db
        .selectFrom("User")
        .where("id", "=", ctx.user.id)
        .selectAll()
        .executeTakeFirstOrThrow(() => new TRPCError({ code: "BAD_REQUEST" }))

      // Next, fetch the gazettes that they are trying to delete and
      // make sure that the time is within the allowed timeframe.
      // This has to be on the version already cos otherwise they should be able to cancel the publish
      const gazette = await db
        .selectFrom("Resource")
        .innerJoin("Version", "Version.id", "Resource.publishedVersionId")
        .where("Resource.siteId", "=", siteId)
        .where("Resource.id", "=", String(gazetteId))
        .select([...defaultResourceSelect, "Version.publishedAt"])
        .executeTakeFirstOrThrow(
          () =>
            new TRPCError({
              message:
                "The gazette you are trying to delete could not be found",
              code: "NOT_FOUND",
            }),
        )
      const { publishedAt } = gazette
      const isWithinGracePeriod =
        publishedAt &&
        differenceInMinutes(new Date(), publishedAt) <=
          ALLOWED_GAZETTE_DELETION_TIMEFRAME_IN_MINUTES

      if (!isWithinGracePeriod) {
        throw new TRPCError({
          message: `Gazettes are unable to be deleted after the given grace period of ${ALLOWED_GAZETTE_DELETION_TIMEFRAME_IN_MINUTES} minutes`,
          code: "FORBIDDEN",
        })
      }

      // Fetch the blob to get the S3 ref
      const blob = await getBlobOfResource({ db, resourceId: gazette.id })
      const ref = (blob.content as { page?: { ref?: string } } | null)?.page
        ?.ref

      if (!ref) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gazette does not have a valid S3 reference",
        })
      }

      // Always try to delete the asset and search record first
      // before proceeding to remove the database resource.
      // This is because the public uses those to access the gazette
      // but the database resource is purely for internal view.
      //
      // When OFF (default): gazette records live in Algolia, so delete from Algolia.
      // When ON: records were pushed to SearchSG instead, so delete from SearchSG.
      if (ctx.gb.isOn(ENABLE_SEARCHSG_GAZETTE_INGESTION)) {
        await removeGazetteFromSearchIndex(ref, gazette.id)
      } else {
        await removeGazetteFromAlgolia(ref)
      }
      await deleteGazetteAsset(ref)

      // Delete the resource in a transaction, then audit-log the deletion.
      // Log goes after the delete so the entry describes a deletion that has
      // actually happened.
      await db.transaction().execute(async (tx) => {
        // Delete the PushDocumentJob first. The FK is `onDelete: Restrict`
        // (see PushDocumentJob in schema.prisma), so the Resource delete
        // below would throw whenever a job row still exists. In practice
        // the cron runs every minute so for up to ~60s after publish there
        // is one — and the grace period is 15 minutes, so the very first
        // deletion attempt would otherwise 500.
        // Defence-in-depth: scope via Resource subquery on siteId
        // (PushDocumentJob has no direct siteId column).
        await tx
          .deleteFrom("PushDocumentJob")
          .where("resourceId", "=", String(gazetteId))
          .where("resourceId", "in", (eb) =>
            eb
              .selectFrom("Resource")
              .select("Resource.id")
              .where("Resource.siteId", "=", siteId),
          )
          .execute()

        await tx
          .deleteFrom("Resource")
          .where("siteId", "=", siteId)
          .where("id", "=", String(gazetteId))
          .execute()

        await logResourceEvent(tx, {
          siteId,
          eventType: AuditLogEvent.ResourceDelete,
          by: user,
          delta: {
            before: { resource: gazette, blob },
            after: null,
          },
        })
      })
      // NOTE: Send email out to IMDA so that they get visibility on what gazettes are deleted.
      // The gazette feature operates on a single site, so the input siteId is the
      // site whose admins should be notified — no separate growthbook lookup needed.
      const admins = await db
        .selectFrom("Site")
        .where("Site.id", "=", siteId)
        .innerJoin("ResourcePermission", "Site.id", "ResourcePermission.siteId")
        .where("ResourcePermission.deletedAt", "is", null)
        .innerJoin("User", "ResourcePermission.userId", "User.id")
        .where("User.deletedAt", "is", null)
        .where("ResourcePermission.role", "=", "Admin")
        // Exclude Isomer admins (internal team) — this notification is meant
        // for the agency's own site admins only.
        .where(({ not, exists, selectFrom }) =>
          not(
            exists(
              selectFrom("IsomerAdmin")
                .select("IsomerAdmin.id")
                .whereRef("IsomerAdmin.userId", "=", "User.id"),
            ),
          ),
        )
        .select("User.email")
        .execute()

      const filename = ref.split("/").pop() ?? ref
      // Send a single email: the Datadog events address is the primary
      // recipient (so deletions always alert ops, even with zero admins) and
      // every site admin is cc'd. Dedupe is required: a user can hold
      // multiple Admin permission rows, and Postman rejects duplicate cc
      // entries.
      const cc = [...new Set(admins.map(({ email }) => email))]
      await sendGazetteDeletionEmail({
        fileId: filename,
        gazetteTitle: gazette.title,
        // Provisioned via SSM and treated as a secret so that it cannot be
        // scraped and spammed.
        recipientEmail: env.DD_DELETION_EMAIL,
        cc,
      })
    }),
})
