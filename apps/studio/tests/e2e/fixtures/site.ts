import {
  setupAdminPermissions,
  setupEditorPermissions,
  setupPageResource,
  setupPublisherPermissions,
  setupSite,
} from "tests/integration/helpers/seed"
import { db, sql } from "~/server/modules/database"
import {
  ResourceState,
  ResourceType,
  RoleType,
} from "~prisma/generated/generatedEnums"

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

type Role = (typeof RoleType)[keyof typeof RoleType]

const TEST_EMAIL_BY_ROLE: Record<Role, string> = {
  [RoleType.Admin]: TEST_EMAILS.admin,
  [RoleType.Editor]: TEST_EMAILS.editor,
  [RoleType.Publisher]: TEST_EMAILS.publisher,
}

const SETUP_PERMISSIONS_BY_ROLE: Record<
  Role,
  (props: { siteId: number; userId: string }) => Promise<unknown>
> = {
  [RoleType.Admin]: setupAdminPermissions,
  [RoleType.Editor]: setupEditorPermissions,
  [RoleType.Publisher]: setupPublisherPermissions,
}

// Root page owner, in order of preference, when multiple roles are requested.
const ROOT_PAGE_ROLE_PRIORITY: Role[] = [
  RoleType.Admin,
  RoleType.Editor,
  RoleType.Publisher,
]

// Each requested role grants its own fixed TEST_EMAILS user (admin/editor/
// publisher are separate accounts) that role on this site — never multiple
// roles to one user. This lets a single test file switch `storageState`
// between those canonical users to exercise several permission levels
// against the same freshly-provisioned site.
export const provisionE2ESite = async (opts: {
  roles: [Role, ...Role[]]
}): Promise<ProvisionedSite> => {
  const { site } = await setupSite()

  await Promise.all(
    opts.roles.map(async (role) => {
      const userId = await getUserIdByEmail(TEST_EMAIL_BY_ROLE[role])
      return SETUP_PERMISSIONS_BY_ROLE[role]({ siteId: site.id, userId })
    }),
  )

  const rootPageRole =
    ROOT_PAGE_ROLE_PRIORITY.find((role) => opts.roles.includes(role)) ??
    opts.roles[0]
  const rootPageUserId = await getUserIdByEmail(
    TEST_EMAIL_BY_ROLE[rootPageRole],
  )

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

const deleteE2ESiteData = async (siteId: number): Promise<void> => {
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

// No-op: per-test teardown was removed in favour of sweepStaleE2ESites, since
// deleting a single site's AuditLog rows mid-run could race another
// connection still inserting AuditLog rows for that same site, occasionally
// tripping the AuditLog_siteId_fkey constraint. Kept exported so existing
// `afterAll` call sites across test files don't need to change.
// oxlint-disable-next-line @typescript-eslint/no-empty-function
export const teardownE2ESite = async (_siteId: number): Promise<void> => {}

// Sweeps sites left behind by previous E2E runs. Scoped to both the test
// site name prefix and a 10-minute age cutoff so it never touches a site
// that could still be mid-flight in the current run.
export const sweepStaleE2ESites = async (): Promise<void> => {
  const staleSites = await db
    .selectFrom("Site")
    .where("name", "like", "Ministry of Testing and Development %")
    .where("createdAt", "<", sql<Date>`now() - interval '10 minutes'`)
    .select("id")
    .execute()

  for (const { id } of staleSites) {
    try {
      await deleteE2ESiteData(id)
    } catch (error) {
      console.warn(`sweepStaleE2ESites: failed to delete site ${id}`, error)
    }
  }
}
