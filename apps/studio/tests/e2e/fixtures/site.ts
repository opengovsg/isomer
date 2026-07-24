import {
  setupAdminPermissions,
  setupEditorPermissions,
  setupPageResource,
  setupPublisherPermissions,
  setupSite,
} from "tests/integration/helpers/seed"
import { db, sql } from "~/server/modules/database"
import { ResourceState, ResourceType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS } from "./auth"

export interface ProvisionedSite {
  siteId: number
  siteName: string
}

const getUserIdByEmail = async (email: string) => {
  const user = await db
    .selectFrom("User")
    .where("email", "=", email)
    .select("id")
    .executeTakeFirstOrThrow()
  return user.id
}

type ProvisionE2ESiteOpts =
  | { admin: true; editor?: boolean; publisher?: boolean }
  | { admin?: boolean; editor: true; publisher?: boolean }
  | { admin?: boolean; editor?: boolean; publisher: true }

export const provisionE2ESite = async (
  opts: ProvisionE2ESiteOpts,
): Promise<ProvisionedSite> => {
  const { site } = await setupSite()

  const permissionSetup: Promise<unknown>[] = []

  if (opts.admin) {
    permissionSetup.push(
      setupAdminPermissions({
        siteId: site.id,
        userId: await getUserIdByEmail(TEST_EMAILS.admin),
      }),
    )
  }
  if (opts.editor) {
    permissionSetup.push(
      setupEditorPermissions({
        siteId: site.id,
        userId: await getUserIdByEmail(TEST_EMAILS.editor),
      }),
    )
  }
  if (opts.publisher) {
    permissionSetup.push(
      setupPublisherPermissions({
        siteId: site.id,
        userId: await getUserIdByEmail(TEST_EMAILS.publisher),
      }),
    )
  }

  await Promise.all(permissionSetup)

  const rootPageUserId = opts.admin
    ? await getUserIdByEmail(TEST_EMAILS.admin)
    : opts.editor
      ? await getUserIdByEmail(TEST_EMAILS.editor)
      : await getUserIdByEmail(TEST_EMAILS.publisher)

  await setupPageResource({
    siteId: site.id,
    resourceType: ResourceType.RootPage,
    state: ResourceState.Published,
    userId: rootPageUserId,
  })

  await setupPageResource({
    siteId: site.id,
    resourceType: ResourceType.Page,
    permalink: "search",
    title: "Search",
    state: ResourceState.Published,
    userId: rootPageUserId,
  })

  return { siteId: site.id, siteName: site.name }
}

export const teardownE2ESite = async (siteId: number): Promise<void> => {
  await db.transaction().execute(async (tx) => {
    const resources = await tx
      .selectFrom("Resource")
      .where("siteId", "=", siteId)
      .select(["id", "draftBlobId", "publishedVersionId"])
      .execute()

    const resourceIds = resources.map((r) => r.id)

    if (resourceIds.length > 0) {
      // PushDocumentJob has no siteId column and its resourceId FK is
      // onDelete: Restrict, so this must be scoped by resourceId — the
      // siteId-scoped deletes below can't reach it.
      await tx
        .deleteFrom("PushDocumentJob")
        .where("resourceId", "in", resourceIds)
        .execute()
    }

    await tx.deleteFrom("CodeBuildJobs").where("siteId", "=", siteId).execute()
    await tx
      .deleteFrom("ResourcePermission")
      .where("siteId", "=", siteId)
      .execute()
    // AuditLog has an immutability trigger; bypass it for test teardown only.
    await sql`SET LOCAL session_replication_role = 'replica'`.execute(tx)
    await tx.deleteFrom("AuditLog").where("siteId", "=", siteId).execute()
    await sql`SET LOCAL session_replication_role = 'origin'`.execute(tx)
    await tx.deleteFrom("Redirect").where("siteId", "=", siteId).execute()

    const draftBlobIds = resources
      .map((r) => r.draftBlobId)
      .filter((id): id is NonNullable<typeof id> => id != null)

    await tx
      .updateTable("Resource")
      .set({ parentId: null, publishedVersionId: null, draftBlobId: null })
      .where("siteId", "=", siteId)
      .execute()

    const blobIds = new Set(draftBlobIds)

    if (resourceIds.length > 0) {
      // Scoped by resourceId, not just each resource's current
      // publishedVersionId — publishing repeatedly creates a new Version
      // row each time without deleting the superseded one, so old versions
      // would otherwise leak past teardown.
      const versions = await tx
        .selectFrom("Version")
        .where("resourceId", "in", resourceIds)
        .select("blobId")
        .execute()

      await tx
        .deleteFrom("Version")
        .where("resourceId", "in", resourceIds)
        .execute()

      for (const version of versions) {
        blobIds.add(version.blobId)
      }
    }

    if (blobIds.size > 0) {
      await tx
        .deleteFrom("Blob")
        .where("id", "in", [...blobIds])
        .execute()
    }

    await tx.deleteFrom("Resource").where("siteId", "=", siteId).execute()
    await tx.deleteFrom("Navbar").where("siteId", "=", siteId).execute()
    await tx.deleteFrom("Footer").where("siteId", "=", siteId).execute()
    await tx.deleteFrom("Site").where("id", "=", siteId).execute()
  })
}
