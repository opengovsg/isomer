import { TRPCError } from "@trpc/server"
import { differenceInMinutes, isBefore, subYears } from "date-fns"
import { env } from "~/env.mjs"
import {
  sendGazetteDeletionEmail,
  sendScheduledPageEmail,
} from "~/features/mail/service"
import { EGAZETTE_INFO_FEATURE_KEY } from "~/lib/growthbook"
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
import { assertGazetteAccess, copyFileWithNewName, markFileAsDeleted, getPresignedGetUrl, getPresignedPutUrl, deleteGazetteAsset, removeGazetteFromSearchIndex } from "./gazette.service"
import filenamify from "filenamify";
const ALLOWED_GAZETTE_DELETION_TIMEFRAME_IN_MINUTES = 15

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
        //   2. desiredFileName + existing ref → S3 copy now, soft-delete old
        //      AFTER the DB commit so a tx rollback never strands the
        //      resource pointing at a tombstoned key
        //   3. unchanged
        // Any S3 failure here aborts before the DB transaction starts.
        let finalRef = existingRef
        let oldRefToCleanUp: string | null = null
        if (newRef) {
          finalRef = newRef
          if (existingRef) oldRefToCleanUp = existingRef.replace(/^\//, "")
        } else if (desiredFileName && existingRef) {
          const currentFileName = existingRef.split("/").pop()
          if (currentFileName !== desiredFileName) {
            const sourceKey = existingRef.replace(/^\//, "")
            const newKey = await copyFileWithNewName({
              sourceKey,
              newFileName: desiredFileName,
            })
            finalRef = `/${newKey}`
            oldRefToCleanUp = sourceKey
          }
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
              // NOTE: Need to update the associated PushDocumentJob
              await tx
                .updateTable("PushDocumentJob")
                .set({
                  scheduledAt,
                  scheduledBy: user.id,
                })
                .where("resourceId", "=", String(gazetteId))
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
        // gazette no longer points at. Best-effort: if S3 fails the lifecycle
        // policy will reap orphans.
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

      // Atomic transaction: delete PushDocumentJob, log audit, delete Resource + Blob
      const deletedResource = await db.transaction().execute(async (tx) => {
        // 1. Delete the PushDocumentJob
        await tx
          .deleteFrom("PushDocumentJob")
          .where("resourceId", "=", String(gazetteId))
          .execute()

        // 2. Log the cancellation audit event
        await logResourceEvent(tx, {
          siteId,
          eventType: AuditLogEvent.CancelSchedulePublish,
          by: user,
          delta: {
            before: { resource: existingResource, blob: existingBlob },
            after: { resource: existingResource, blob: existingBlob },
          },
        })

        // 3. Log the resource deletion audit event
        await logResourceEvent(tx, {
          siteId,
          eventType: AuditLogEvent.ResourceDelete,
          by: user,
          delta: {
            before: { resource: existingResource, blob: existingBlob },
            after: null,
          },
        })

        // 4. Delete the Blob first (foreign key constraint)
        if (existingResource.draftBlobId) {
          await tx
            .deleteFrom("Blob")
            .where("id", "=", existingResource.draftBlobId)
            .execute()
        }

        // 5. Delete the Resource
        return await tx
          .deleteFrom("Resource")
          .where("id", "=", String(gazetteId))
          .returningAll()
          .execute()
      })

      // After DB transaction commits, update S3 tags (best-effort)
      // No need to guarantee this because we already set a `scheduledAt` tag
      // which prevents the gazette from being seen by MOP anyway
      if (ref) {
        try {
          await markScheduledAssetAsCancelled({
            Key: ref.slice(1), // Remove leading slash
            Bucket: env.NEXT_PUBLIC_S3_ASSETS_BUCKET_NAME,
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
      async ({ ctx, input: { year, category, subcategory, tags, siteId, fileName, resourceId } }) => {
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
      await removeGazetteFromSearchIndex(ref, gazette.id)
      await deleteGazetteAsset(ref)

      // Delete the resource in a transaction
      await db.transaction().execute(async (tx) => {
        await logResourceEvent(tx, {
          siteId,
          eventType: AuditLogEvent.ResourceDelete,
          by: user,
          delta: {
            before: { resource: gazette, blob },
            after: null,
          },
        })

        await tx
          .deleteFrom("Resource")
          .where("id", "=", String(gazetteId))
          .execute()
      })
      // NOTE: Send email out to IMDA so that they get visibility on what gazettes are deleted
      const gb = ctx.gb
      const { siteId: gazetteSiteId } = gb.getFeatureValue(
        EGAZETTE_INFO_FEATURE_KEY,
        {
          siteId: "",
          gazettesCollectionId: "",
        },
      )
      const admins = await db
        .selectFrom("Site")
        .where("Site.id", "=", Number(gazetteSiteId))
        .innerJoin("ResourcePermission", "Site.id", "ResourcePermission.siteId")
        .innerJoin("User", "ResourcePermission.userId", "User.id")
        .where("ResourcePermission.role", "=", "Admin")
        .select("User.email")
        .execute()

      await Promise.all(
        admins.map(async ({ email }) => {
          await sendGazetteDeletionEmail({
            fileId: ref,
            gazetteTitle: gazette.title,
            recipientEmail: email,
          })
        }),
      )
    }),
})
