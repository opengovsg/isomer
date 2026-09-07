/* oxlint-disable typescript/strict-boolean-expressions, typescript/no-confusing-void-expression, anti-slop/no-unknown-parameters, unicorn/prefer-ternary -- server lint cleanup */
import type { UnwrapTagged } from "type-fest"
import { TRPCError } from "@trpc/server"
import { get, pick } from "lodash-es"
import { INDEX_PAGE_PERMALINK } from "~/constants/sitemap"
import {
  countTagOptionsUsageSchema,
  createCollectionSchema,
  editLinkSchema,
  getCollectionsSchema,
  getCollectionTagsSchema,
  readCollectionSchema,
  readLinkSchema,
} from "~/schemas/collection"
import { readFolderSchema } from "~/schemas/folder"
import { createCollectionPageSchema } from "~/schemas/page"
import { protectedProcedure, router } from "~/server/trpc"
import { hasNonEmptyString, isDefinedNumber } from "~/utils/truthiness"

import { logResourceEvent } from "../audit/audit.service"
import { PG_ERROR_CODES } from "../database/constants"
import { db } from "../database/database"
import {
  AuditLogEvent,
  ResourceState,
  ResourceType,
  sql,
} from "../database/types"
import { jsonb } from "../database/utils"
import { bulkValidateUserPermissionsForResources } from "../permissions/permissions.service"
import {
  applyResourceOrderBy,
  defaultResourceSelect,
  getBlobOfResource,
  getSiteResourceById,
  publishResource,
  updateBlobById,
} from "../resource/resource.service"
import { validateUserPermissionsForSite } from "../site/site.service"
import { defaultCollectionSelect } from "./collection.select"
import {
  createCollectionIndexJson,
  createCollectionLinkJson,
  createCollectionPageJson,
  getCollectionTagsForResource,
} from "./collection.service"

export const collectionRouter = router({
  countTagOptionsUsage: protectedProcedure
    .input(countTagOptionsUsageSchema)
    .query(async ({ ctx, input: { siteId, pageId, tagOptionIds } }) => {
      await bulkValidateUserPermissionsForResources({
        action: "read",
        siteId,
        userId: ctx.user.id,
      })

      const indexPage = await db
        .selectFrom("Resource")
        .where("id", "=", String(pageId))
        .where("siteId", "=", siteId)
        .where("type", "=", ResourceType.IndexPage)
        .select(["parentId"])
        .executeTakeFirstOrThrow(
          () =>
            new TRPCError({
              code: "NOT_FOUND",
              message: "Collection index page not found",
            }),
        )

      const { parentId } = indexPage
      if (!hasNonEmptyString(parentId)) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Collection index page has no parent collection",
        })
      }
      const collection = await getSiteResourceById({
        resourceId: parentId,
        siteId,
        type: ResourceType.Collection,
      })
      if (!hasNonEmptyString(collection)) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Collection not found",
        })
      }

      const uniqueTagOptionIds = [...new Set(tagOptionIds)]
      if (uniqueTagOptionIds.length === 0) {
        return { count: 0 }
      }

      // Bound parameters as a Postgres text[] for use with = ANY(...).
      // Compare as text: `tagged` is stored inside jsonb (no native uuid type),
      // and jsonb_array_elements_text returns text. The z.string().uuid() validator
      // is a request-boundary check, not a storage-type contract.
      const optionIdsAsSqlArray = sql.join(
        uniqueTagOptionIds.map((id) => sql`${id}::text`),
        sql`, `,
      )
      const tagOptionIdArray = sql`ARRAY[${optionIdsAsSqlArray}]::text[]`

      const row = await db
        .selectFrom("Resource as r")
        .leftJoin("Blob as draftBlob", "r.draftBlobId", "draftBlob.id")
        .leftJoin("Version as v", "r.publishedVersionId", "v.id")
        .leftJoin("Blob as publishedBlob", "v.blobId", "publishedBlob.id")
        .where("r.parentId", "=", parentId)
        .where("r.siteId", "=", siteId)
        .where("r.type", "in", [
          ResourceType.CollectionPage,
          ResourceType.CollectionLink,
        ])
        // Match child resources whose page.tagged JSON array overlaps the queried
        // option ids. Postgres has no jsonb && jsonb overlap; unnest to text and use ANY.
        // Draft or published blob alone is enough; one row per resource still counts once.
        .where(
          sql<boolean>`(
            EXISTS (
              SELECT 1
              FROM jsonb_array_elements_text(
                COALESCE("draftBlob"."content"->'page'->'tagged', '[]'::jsonb)
              ) AS tag
              WHERE tag = ANY(${tagOptionIdArray})
            )
            OR EXISTS (
              SELECT 1
              FROM jsonb_array_elements_text(
                COALESCE("publishedBlob"."content"->'page'->'tagged', '[]'::jsonb)
              ) AS tag
              WHERE tag = ANY(${tagOptionIdArray})
            )
          )`,
        )
        .select(sql<number>`cast(count(*) as int)`.as("count"))
        .executeTakeFirstOrThrow()

      return { count: row.count }
    }),
  create: protectedProcedure
    .input(createCollectionSchema)
    .mutation(
      async ({
        ctx,
        input: { collectionTitle, permalink, siteId, parentFolderId },
      }) => {
        await bulkValidateUserPermissionsForResources({
          action: "create",
          resourceIds: [parentFolderId ? String(parentFolderId) : null],
          siteId,
          userId: ctx.user.id,
        })

        const user = await db
          .selectFrom("User")
          .where("id", "=", ctx.user.id)
          .selectAll()
          .executeTakeFirstOrThrow(() => new TRPCError({ code: "BAD_REQUEST" }))

        const result = await db.transaction().execute(async (tx) => {
          if (hasNonEmptyString(parentFolderId)) {
            const parentFolder = await tx
              .selectFrom("Resource")
              .where("Resource.id", "=", String(parentFolderId))
              .where("Resource.siteId", "=", siteId)
              .select(["Resource.type", "Resource.id"])
              .executeTakeFirst()

            if (!hasNonEmptyString(parentFolder)) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Parent folder does not exist",
              })
            }

            if (parentFolder.type !== ResourceType.Folder) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                  "Collections can only be created inside other folders or at the root",
              })
            }
          }

          const collection = await tx
            .insertInto("Resource")
            .values({
              parentId: parentFolderId ? String(parentFolderId) : null,
              permalink,
              siteId,
              state: ResourceState.Published,
              title: collectionTitle,
              type: ResourceType.Collection,
            })
            .returningAll()
            .executeTakeFirstOrThrow()
            .catch((error: unknown) => {
              if (get(error, "code") === PG_ERROR_CODES.uniqueViolation) {
                throw new TRPCError({
                  code: "CONFLICT",
                  message: "A resource with the same permalink already exists",
                })
              }
              throw error
            })

          await logResourceEvent(tx, {
            by: user,
            delta: { after: collection, before: null },
            eventType: AuditLogEvent.ResourceCreate,
            siteId,
          })

          const indexJson = createCollectionIndexJson(collection.title)

          const blob = await tx
            .insertInto("Blob")
            .values({ content: jsonb(indexJson) })
            .returning("Blob.id")
            .executeTakeFirstOrThrow()

          const indexPage = await tx
            .insertInto("Resource")
            .values({
              draftBlobId: blob.id,
              parentId: collection.id,
              permalink: INDEX_PAGE_PERMALINK,
              siteId,
              state: ResourceState.Draft,
              title: collection.title,
              type: ResourceType.IndexPage,
            })
            .returningAll()
            .executeTakeFirstOrThrow()
            .catch((error: unknown) => {
              if (get(error, "code") === PG_ERROR_CODES.uniqueViolation) {
                throw new TRPCError({
                  code: "CONFLICT",
                  message: "A resource with the same permalink already exists",
                })
              }
              throw error
            })

          await logResourceEvent(tx, {
            by: user,
            delta: { after: indexPage, before: null },
            eventType: AuditLogEvent.ResourceCreate,
            siteId,
          })

          return collection
        })

        // Deferred: Create the index page for the collection and publish it
        await publishResource(user.id, result, ctx.logger)

        return pick(result, defaultCollectionSelect)
      },
    ),
  createCollectionPage: protectedProcedure
    .input(createCollectionPageSchema)
    .mutation(async ({ ctx, input }) => {
      await bulkValidateUserPermissionsForResources({
        action: "create",
        resourceIds: [input.collectionId ? String(input.collectionId) : null],
        siteId: input.siteId,
        userId: ctx.user.id,
      })

      const user = await db
        .selectFrom("User")
        .where("id", "=", ctx.user.id)
        .selectAll()
        .executeTakeFirstOrThrow(() => new TRPCError({ code: "BAD_REQUEST" }))

      let newPage: UnwrapTagged<PrismaJson.BlobJsonContent>
      const { title, type, permalink, siteId, collectionId } = input
      if (type === ResourceType.CollectionPage) {
        newPage = createCollectionPageJson({ type })
      } else {
        newPage = createCollectionLinkJson({ type })
      }

      const resource = await db.transaction().execute(async (tx) => {
        const parentCollection = await tx
          .selectFrom("Resource")
          .where("Resource.id", "=", String(collectionId))
          .where("Resource.siteId", "=", siteId)
          .where("Resource.type", "=", ResourceType.Collection)
          .select(["Resource.type", "Resource.id"])
          .executeTakeFirst()

        if (!hasNonEmptyString(parentCollection)) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Parent collection does not exist",
          })
        }

        const blob = await tx
          .insertInto("Blob")
          .values({
            content: jsonb(newPage),
          })
          .returningAll()
          .executeTakeFirstOrThrow()

        const addedResource = await tx
          .insertInto("Resource")
          .values({
            draftBlobId: blob.id,
            parentId: String(collectionId),
            permalink,
            siteId,
            title,
            type,
          })
          .returningAll()
          .executeTakeFirstOrThrow()
          .catch((error: unknown) => {
            if (get(error, "code") === PG_ERROR_CODES.uniqueViolation) {
              throw new TRPCError({
                code: "CONFLICT",
                message: "A resource with the same permalink already exists",
              })
            }
            throw error
          })

        await logResourceEvent(tx, {
          by: user,
          delta: {
            after: { blob, resource: addedResource },
            before: null,
          },
          eventType: AuditLogEvent.ResourceCreate,
          siteId,
        })

        return addedResource
      })
      return { pageId: resource.id }
    }),
  getCollectionTags: protectedProcedure
    .input(getCollectionTagsSchema)
    .query(async ({ ctx, input: { resourceId, collectionId, siteId } }) => {
      const resourceIdToValidate = collectionId ?? resourceId
      await bulkValidateUserPermissionsForResources({
        action: "read",
        resourceIds: resourceIdToValidate ? [String(resourceIdToValidate)] : [],
        siteId,
        userId: ctx.user.id,
      })

      if (collectionId !== undefined) {
        return await getCollectionTagsForResource({
          collectionId,
          isPublishedOnly: true,
          siteId,
        })
      }
      if (resourceId !== undefined) {
        return await getCollectionTagsForResource({
          isPublishedOnly: true,
          resourceId,
          siteId,
        })
      }
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Either collectionId or resourceId must be provided",
      })
    }),
  getCollections: protectedProcedure
    .input(getCollectionsSchema)
    .query(async ({ ctx, input: { siteId, hasChildren } }) => {
      // will need permissions to fetch all collections for a site
      await validateUserPermissionsForSite({
        action: "read",
        siteId,
        userId: ctx.user.id,
      })

      let query = db.selectFrom("Resource")

      if (hasChildren) {
        query = query.innerJoin(
          "Resource as children",
          "Resource.id",
          "children.parentId",
        )
      }

      return await query
        .where("Resource.siteId", "=", siteId)
        .where("Resource.type", "=", ResourceType.Collection)
        .orderBy("Resource.title", "asc")
        .distinct()
        .selectAll("Resource")
        .execute()
    }),
  getMetadata: protectedProcedure
    .input(readFolderSchema)
    .query(async ({ ctx, input: { siteId, resourceId } }) => {
      await bulkValidateUserPermissionsForResources({
        action: "read",
        siteId,
        userId: ctx.user.id,
      })

      const resource = await getSiteResourceById({
        resourceId: String(resourceId),
        siteId,
        type: ResourceType.Collection,
      })
      if (resource === undefined) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Collection not found",
        })
      }
      return resource
    }),
  list: protectedProcedure
    .input(readCollectionSchema)
    .query(
      async ({
        ctx,
        input: { resourceId, siteId, orderBy, limit, offset },
      }) => {
        await bulkValidateUserPermissionsForResources({
          action: "read",
          siteId,
          userId: ctx.user.id,
        })
        // Things that aren't working yet:
        // 1. Last Edited user and time
        // 2. Page status(draft, published)

        let query = db
          .selectFrom("Resource")
          .where("parentId", "=", String(resourceId))
          .where("Resource.siteId", "=", siteId)
          .where("Resource.type", "in", [
            ResourceType.CollectionPage,
            ResourceType.CollectionLink,
          ])

        query = applyResourceOrderBy(query, orderBy)

        return await query
          .limit(limit)
          .offset(offset)
          .select(defaultResourceSelect)
          .execute()
      },
    ),
  readCollectionLink: protectedProcedure
    .input(readLinkSchema)
    .query(async ({ ctx, input: { linkId, siteId } }) => {
      await bulkValidateUserPermissionsForResources({
        action: "read",
        siteId,
        userId: ctx.user.id,
      })

      const baseQuery = db
        .selectFrom("Resource")
        .where("Resource.id", "=", String(linkId))
        .where("Resource.type", "=", ResourceType.CollectionLink)
        .where("Resource.siteId", "=", siteId)

      const draft = await baseQuery
        .innerJoin("Blob", "Resource.draftBlobId", "Blob.id")
        .select(["Blob.content", "Resource.title"])
        .executeTakeFirst()

      if (draft) {
        return draft
      }

      return await baseQuery
        .innerJoin("Version", "Resource.publishedVersionId", "Version.id")
        .innerJoin("Blob", "Blob.id", "Version.blobId")
        .select(["Blob.content", "Resource.title"])
        .executeTakeFirstOrThrow(
          () =>
            new TRPCError({
              code: "NOT_FOUND",
              message: "Unable to find the requested collection link",
            }),
        )
    }),
  updateCollectionLink: protectedProcedure
    .input(editLinkSchema)
    .mutation(
      async ({
        input: {
          date,
          category,
          linkId,
          siteId,
          description,
          ref,
          image,
          tags,
          tagged,
        },
        ctx,
      }) => {
        // Things that aren't working yet:
        // 1. Last Edited user and time
        // 2. Page status(draft, published)
        await bulkValidateUserPermissionsForResources({
          action: "update",
          siteId,
          userId: ctx.user.id,
        })

        const content = createCollectionLinkJson({
          type: ResourceType.CollectionLink,
        })

        const user = await db
          .selectFrom("User")
          .where("id", "=", ctx.user.id)
          .selectAll()
          .executeTakeFirstOrThrow(() => new TRPCError({ code: "BAD_REQUEST" }))

        return await db.transaction().execute(async (tx) => {
          const resource = await tx
            .selectFrom("Resource")
            .where("Resource.id", "=", String(linkId))
            .where("Resource.siteId", "=", siteId)
            .where("Resource.type", "=", ResourceType.CollectionLink)
            .selectAll()
            .executeTakeFirstOrThrow(
              () =>
                new TRPCError({
                  code: "NOT_FOUND",
                  message: "Unable to find the requested collection link",
                }),
            )

          const [oldBlob, blob] = await Promise.all([
            getBlobOfResource({
              db: tx,
              resourceId: resource.id,
            }),
            updateBlobById(tx, {
              content: {
                ...content,
                page: {
                  category,
                  date,
                  description,
                  image,
                  ref,
                  tagged,
                  tags,
                },
              },
              pageId: linkId,
              siteId,
            }),
          ])

          await logResourceEvent(tx, {
            by: user,
            delta: {
              after: { blob, resource },
              before: { blob: oldBlob, resource },
            },
            eventType: AuditLogEvent.ResourceUpdate,
            siteId,
          })

          return blob
        })
      },
    ),
})
