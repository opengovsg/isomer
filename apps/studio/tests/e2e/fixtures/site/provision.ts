import {
  setupAdminPermissions,
  setupEditorPermissions,
  setupPageResource,
  setupPublisherPermissions,
  setupSite,
} from "tests/integration/helpers/seed"
import { db } from "~/server/modules/database"
import { TEST_EMAILS } from "~e2e/fixtures/auth"
import {
  ResourceState,
  ResourceType,
  RoleType,
} from "~prisma/generated/generatedEnums"

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

// One TEST_EMAILS user per role on this site. Tests swap storageState on the same site.
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

/** Fake CodeBuild id so godmode publishing shows a Publish button. */
export const setSiteCodeBuildId = async (
  siteId: number,
  codeBuildId: string,
): Promise<void> => {
  await db
    .updateTable("Site")
    .set({ codeBuildId })
    .where("id", "=", siteId)
    .execute()
}

/** Null codeBuildId so publishSite skips AWS. Call after the Publish button renders. */
export const clearSiteCodeBuildId = async (siteId: number): Promise<void> => {
  await db
    .updateTable("Site")
    .set({ codeBuildId: null })
    .where("id", "=", siteId)
    .execute()
}
