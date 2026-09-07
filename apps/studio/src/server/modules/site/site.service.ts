/* oxlint-disable typescript/no-unnecessary-type-conversion, typescript/strict-boolean-expressions, eslint/no-shadow, unicorn/consistent-function-scoping, import/no-duplicates, eslint/no-inline-comments -- server lint cleanup */
import type { IsomerSiteConfigProps } from "@opengovsg/isomer-components"
import type { Notification } from "~/schemas/site"
import { getAskgovIdFromString } from "@opengovsg/isomer-components"
import { TRPCError } from "@trpc/server"
import { SEARCH_PAGE_PERMALINK } from "~/constants/sitemap"
import { hasNonEmptyString, isNullableBooleanTrue } from "~/utils/truthiness"

import type {
  DB,
  Resource,
  SafeKysely,
  Transaction,
  Version,
} from "../database/types"
import type { UserPermissionsProps } from "../permissions/permissions.type"
import { logConfigEvent } from "../audit/audit.service"
import { db } from "../database/database"
import {
  AuditLogEvent,
  ResourceState,
  ResourceType,
  RoleType,
} from "../database/types"
import { jsonb } from "../database/utils"
import {
  definePermissionsForSite,
  isActiveIsomerAdmin,
} from "../permissions/permissions.service"
import {
  FOOTER,
  NAVBAR_CONTENT,
  PAGE_BLOB,
  SEARCH_PAGE_BLOB,
} from "./constants"

export const validateUserPermissionsForSite = async ({
  siteId,
  userId,
  action,
}: Omit<UserPermissionsProps, "resourceId">) => {
  const perms = await definePermissionsForSite({
    siteId,
    userId,
  })

  // Deferred: create should check against the current resource id
  if (perms.cannot(action, "Site")) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have sufficient permissions to perform this action",
    })
  }
}

// Every site the given user may Admin: every site if they're an active
// Isomer Admin (implicit Admin on all sites, mirroring `siteRouter.list`),
// otherwise only sites where they hold an explicit Admin `ResourcePermission`.
// Resolved server-side (never trusted from client input) so cross-site
// actions — e.g. the "all sites I have Admin access to" audit-log export
// scope — can't be pointed at a site the caller doesn't actually administer.
export const getAdminSiteIds = async (userId: string): Promise<number[]> => {
  const isIsomerAdmin = await isActiveIsomerAdmin(userId)
  if (isNullableBooleanTrue(isIsomerAdmin)) {
    const sites = await db
      .selectFrom("Site")
      .select("id")
      .orderBy("id", "asc")
      .execute()
    return sites.map((site) => site.id)
  }

  const sites = await db
    .selectFrom("Site")
    .innerJoin("ResourcePermission", "Site.id", "ResourcePermission.siteId")
    .where("ResourcePermission.deletedAt", "is", null)
    .where("ResourcePermission.resourceId", "is", null)
    .where("ResourcePermission.userId", "=", userId)
    .where("ResourcePermission.role", "=", RoleType.Admin)
    .select("Site.id")
    .orderBy("Site.id", "asc")
    .execute()
  return sites.map((site) => site.id)
}

type SiteSearchConfig = IsomerSiteConfigProps["search"]

const EGAZETTE_ALGOLIA_SEARCH_TYPE = "egazette-algolia"
const SEARCHSG_SEARCH_TYPE = "searchSG"

export const normalizeAskgovConfig = (
  config: IsomerSiteConfigProps,
): IsomerSiteConfigProps => {
  if (!hasNonEmptyString(config.askgov)) {
    return config
  }

  const agencyId = getAskgovIdFromString(config.askgov["data-agency"])

  if (agencyId === null) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid AskGov ID or URL",
    })
  }

  return {
    ...config,
    askgov: {
      ...config.askgov,
      "data-agency": agencyId,
    },
  }
}

/**
 * The `egazette-algolia` search variant carries Algolia connection details
 * (`appId`, `searchApiKey`, `indexName`) and a category taxonomy that may only
 * be provisioned by an Isomer admin via `setSiteConfigByAdmin`. A site admin
 * must not be able to add, remove, or tamper with this variant through
 * `updateSiteConfig` / `updateSiteIntegrations` (cf. the SearchSG `clientId`
 * protections in #2242).
 *
 * Returns the search config that should be persisted: when the site is already
 * on `egazette-algolia`, the DB value is preserved verbatim and the incoming
 * value is ignored; otherwise the incoming value is returned unchanged. Throws
 * a `BAD_REQUEST` when the caller attempts to switch the search type to or from
 * `egazette-algolia`.
 */
const resolveEgazetteAlgoliaSearchConfig = (
  existing: SiteSearchConfig,
  incoming: SiteSearchConfig,
): SiteSearchConfig => {
  const wasEgazetteAlgolia = existing?.type === EGAZETTE_ALGOLIA_SEARCH_TYPE
  const willBeEgazetteAlgolia = incoming?.type === EGAZETTE_ALGOLIA_SEARCH_TYPE

  if (wasEgazetteAlgolia !== willBeEgazetteAlgolia) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "Cannot change the eGazette Algolia search integration. Contact Isomer Support to update it.",
    })
  }

  // egazette-algolia is admin-managed; never trust site-admin input for it.
  return wasEgazetteAlgolia ? existing : incoming
}

/**
 * The SearchSG `clientId` identifies the site's SearchSG project and is
 * provisioned out of band, so it may only be set by an Isomer admin via
 * `setSiteConfigByAdmin` — the field is `readOnly` in the schema and the editor
 * renders the whole SearchSG control disabled. It must therefore always come
 * from the DB and never from the request: any valid UUID is accepted downstream
 * by `updateSearchSGConfig`, so honouring an incoming `clientId` would let a
 * site admin point this site at another agency's project and rename or restyle
 * it.
 *
 * Returns the search config to persist, with the `clientId` taken from the DB.
 * Throws a `BAD_REQUEST` when the caller tries to turn SearchSG on, since there
 * is no provisioned `clientId` to fall back on in that case.
 */
const resolveSearchSGSearchConfig = (
  existing: SiteSearchConfig,
  incoming: SiteSearchConfig,
): SiteSearchConfig => {
  if (incoming?.type !== SEARCHSG_SEARCH_TYPE) {
    return incoming
  }

  if (existing?.type !== SEARCHSG_SEARCH_TYPE) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "Cannot enable the SearchSG search integration. Contact Isomer Support to set it up.",
    })
  }

  return { ...incoming, clientId: existing.clientId }
}

/**
 * Single entry point for reconciling a site admin's search config against the
 * DB, covering both admin-managed variants. Every caller that persists a search
 * config from user input must go through this.
 */
export const resolveSearchConfig = (
  existing: SiteSearchConfig,
  incoming: SiteSearchConfig,
): SiteSearchConfig =>
  resolveSearchSGSearchConfig(
    existing,
    resolveEgazetteAlgoliaSearchConfig(existing, incoming),
  )

export const getSiteConfig = async (db: SafeKysely, siteId: number) => {
  const { config } = await db
    .selectFrom("Site")
    .where("id", "=", siteId)
    .select("Site.config")
    .executeTakeFirstOrThrow()

  return config
}

export const getSiteTheme = async (siteId: number) => {
  const { theme } = await db
    .selectFrom("Site")
    .where("id", "=", siteId)
    .select("Site.theme")
    .executeTakeFirstOrThrow()

  return theme
}
export const getSiteNameAndCodeBuildId = async (siteId: number) => {
  const site = await db
    .selectFrom("Site")
    .where("id", "=", siteId)
    .select(["Site.codeBuildId", "Site.name", "Site.config"])
    .executeTakeFirstOrThrow()

  // SAFETY: Site.config stores an optional siteName override in JSON
  const siteConfig = site.config as { siteName?: string } | null

  return {
    codeBuildId: site.codeBuildId,
    name: hasNonEmptyString(siteConfig?.siteName)
      ? siteConfig.siteName
      : site.name,
  }
}

export const getNotification = async (
  siteId: number,
): Promise<Notification> => {
  const result = await db
    .selectFrom("Site")
    .select(({ ref }) =>
      ref("Site.config", "->").key("notification").as("notification"),
    )
    .where("id", "=", siteId)
    .executeTakeFirst()
  if (result === undefined) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Site not found",
    })
  }

  // NOTE: Handle no notification case
  // We need to return an object because the json result
  // will default to `null` if the key doesn't exist
  if (!hasNonEmptyString(result.notification)) {
    return {}
  }

  // NOTE: Handle old array format
  // Add in the `prose` wrapper
  if (Array.isArray(result.notification.content)) {
    return {
      notification: {
        ...result.notification,
        content: {
          content: [
            {
              attrs: {
                dir: "ltr",
              },
              content: result.notification.content,
              type: "paragraph",
            },
          ],
          type: "prose",
        },
      },
    }
  }

  return result
}

type SetSiteNotificationParams = Notification & {
  siteId: number
  userId: string
}

export const setSiteNotification = async ({
  siteId,
  userId,
  notification,
}: SetSiteNotificationParams) =>
  await db.transaction().execute(async (tx) => {
    const user = await tx
      .selectFrom("User")
      .where("id", "=", userId)
      .selectAll()
      .executeTakeFirst()

    if (user === undefined) {
      // NOTE: This shouldn't happen as the user is already logged in
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "The user could not be found",
      })
    }

    const oldSite = await tx
      .selectFrom("Site")
      .where("id", "=", siteId)
      .selectAll()
      .executeTakeFirst()

    if (!hasNonEmptyString(oldSite)) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "The site could not be found",
      })
    }

    const newSite = await tx
      .updateTable("Site")
      .set((eb) => ({
        config: notification
          ? // @ts-expect-error JSON concat operator replaces the entire notification object if it exists, but Kysely does not have types for this.
            eb("Site.config", "||", jsonb({ notification }))
          : // @ts-expect-error JSON remove operator replaces the entire notification object if it exists, but Kysely does not have types for this.
            eb("Site.config", "-", "notification"),
      }))
      .where("id", "=", siteId)
      .returningAll()
      .executeTakeFirst()

    if (!hasNonEmptyString(newSite)) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update site configuration",
      })
    }

    await logConfigEvent(tx, {
      by: user,
      delta: {
        after: newSite,
        before: oldSite,
      },
      eventType: AuditLogEvent.SiteConfigUpdate,
      siteId,
    })

    return newSite
  })

interface CreateSiteProps {
  siteName: string
  userId: Version["publishedBy"]
}
interface CreateResourceProps {
  tx: Transaction<DB>
  siteId: Resource["siteId"]
  userId: Version["publishedBy"]
}

export const createSite = async ({ siteName, userId }: CreateSiteProps) => {
  const createSiteRecord = async (tx: Transaction<DB>): Promise<number> => {
    const { id: siteId } = await tx
      .insertInto("Site")
      .values({
        config: jsonb({
          isGovernment: true,
          logoUrl: "https://www.isomer.gov.sg/images/isomer-logo.svg",
          search: undefined,
          siteName,
          theme: "isomer-next",
          url: "https://www.isomer.gov.sg",
        }),
        name: siteName,
        theme: jsonb({
          colors: {
            brand: {
              canvas: {
                alt: "#bfcfd7",
                backdrop: "#80a0af",
                default: "#e6ecef",
                inverse: "#00405f",
              },
              interaction: {
                default: "#00405f",
                hover: "#002e44",
                pressed: "#00283b",
              },
            },
          },
        }),
      })
      .onConflict((oc) =>
        oc
          .column("name")
          .doUpdateSet((eb) => ({ name: eb.ref("excluded.name") })),
      )
      .returning("id")
      .executeTakeFirstOrThrow()

    return siteId
  }

  const createFooter = async (tx: Transaction<DB>, siteId: number) => {
    await tx
      .insertInto("Footer")
      .values({
        content: jsonb(FOOTER),
        siteId,
      })
      .onConflict((oc) =>
        oc
          .column("siteId")
          .doUpdateSet((eb) => ({ siteId: eb.ref("excluded.siteId") })),
      )
      .execute()
  }

  const createNavbar = async (tx: Transaction<DB>, siteId: number) => {
    await tx
      .insertInto("Navbar")
      .values({
        content: jsonb(NAVBAR_CONTENT),
        siteId,
      })
      .onConflict((oc) =>
        oc
          .column("siteId")
          .doUpdateSet((eb) => ({ siteId: eb.ref("excluded.siteId") })),
      )
      .execute()
  }

  const createRootPage = async ({
    tx,
    siteId,
    userId,
  }: CreateResourceProps) => {
    const [{ id: blobId }, { id: resourceId }] = await Promise.all([
      tx
        .insertInto("Blob")
        .values({ content: jsonb(PAGE_BLOB) })
        .returning("id")
        .executeTakeFirstOrThrow(),
      tx
        .insertInto("Resource")
        .values({
          permalink: "",
          siteId,
          state: ResourceState.Published,
          title: "Home",
          type: ResourceType.RootPage,
        })
        .onConflict((oc) =>
          oc.column("draftBlobId").doUpdateSet((eb) => ({
            draftBlobId: eb.ref("excluded.draftBlobId"),
          })),
        )
        .returning("id")
        .executeTakeFirstOrThrow(),
    ])

    const { id: versionId } = await tx
      .insertInto("Version")
      .values({
        blobId,
        publishedBy: userId,
        resourceId,
        versionNum: 1,
      })
      .returning("id")
      .executeTakeFirstOrThrow()

    await tx
      .updateTable("Resource")
      .set({
        draftBlobId: null,
        publishedVersionId: versionId,
        state: ResourceState.Published,
      })
      .where("id", "=", resourceId)
      .executeTakeFirstOrThrow()
  }

  const createSearchPage = async ({
    tx,
    siteId,
    userId,
  }: CreateResourceProps) => {
    const { id: blobId } = await tx
      .insertInto("Blob")
      .values({ content: jsonb(SEARCH_PAGE_BLOB) })
      .returning("id")
      .executeTakeFirstOrThrow()

    const { id: resourceId } = await tx
      .insertInto("Resource")
      .values({
        draftBlobId: blobId,
        permalink: SEARCH_PAGE_PERMALINK,
        siteId,
        title: "Search",
        type: ResourceType.Page,
      })
      .onConflict((oc) =>
        oc.column("draftBlobId").doUpdateSet((eb) => ({
          draftBlobId: eb.ref("excluded.draftBlobId"),
        })),
      )
      .returning("id")
      .executeTakeFirstOrThrow()

    const { id: versionId } = await tx
      .insertInto("Version")
      .values({
        blobId,
        publishedBy: userId,
        resourceId,
        versionNum: 1,
      })
      .returning("id")
      .executeTakeFirstOrThrow()

    await tx
      .updateTable("Resource")
      .set({
        draftBlobId: null,
        publishedVersionId: versionId,
        state: ResourceState.Published,
      })
      .where("id", "=", resourceId)
      .executeTakeFirstOrThrow()
  }

  const siteId = await db.transaction().execute(async (tx) => {
    const siteId = await createSiteRecord(tx)
    await createFooter(tx, siteId)
    await createNavbar(tx, siteId)
    await createRootPage({ siteId, tx, userId })
    await createSearchPage({ siteId, tx, userId })
    return siteId
  })

  return { siteId, siteName }
}
