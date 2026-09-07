import type { Notification } from "~/schemas/site"
import { TRPCError } from "@trpc/server"
import { pick } from "lodash-es"
import { auth } from "tests/integration/helpers/auth"
import { resetTables } from "tests/integration/helpers/db"
import {
  applyAuthedSession,
  applySession,
  createMockRequest,
} from "tests/integration/helpers/iron-session"
import {
  setupAdminPermissions,
  setupEditorPermissions,
  setupIsomerAdmin,
  setupPageResource,
  setupPublisherPermissions,
  setupSite,
  setupUser,
} from "tests/integration/helpers/seed"
import { beforeAll, vi } from "vitest"
import { env } from "~/env.mjs"
import * as searchSgService from "~/server/modules/searchsg/searchsg.service"
import { createCallerFactory } from "~/server/trpc"
import { IsomerAdminRole, RoleType } from "~prisma/generated/generatedEnums"

import type { User } from "../../database/types"
import { db } from "../../database/database"
import { AuditLogEvent, ResourceType } from "../../database/types"
import { jsonb } from "../../database/utils"
import { siteRouter } from "../site.router"

beforeAll(() => {
  env.NEXT_PUBLIC_APP_ENV = "production"
})

const createCaller = createCallerFactory(siteRouter)

const MOCK_SITE_NAME = "isobad"
const MOCK_LOGO_URL = "https://isobad.com/logo.png"
const MOCK_SEARCHSG_CLIENT_ID = "550e8400-e29b-41d4-a716-446655440000"
// A UUID belonging to a different site's SearchSG project. It has to satisfy
// `isValidSearchSGClientId` (RFC 4122, so version 4 and variant 8 here), because
// clearing that check is what lets a tampered clientId reach the SearchSG API.
const MOCK_OTHER_SITE_SEARCHSG_CLIENT_ID =
  "11111111-2222-4333-8444-555555555555"
const MOCK_EGAZETTE_ALGOLIA_SEARCH = {
  appId: "MOCK_APP_ID",
  categories: [
    { value: "notices", displayLabel: "Notices" },
    { value: "acts", displayLabel: "Acts" },
  ],
  indexName: "egazette",
  searchApiKey: "mock-search-only-key",
  type: "egazette-algolia",
} as const
const MOCK_ISOMER_THEME = {
  colors: {
    brand: {
      canvas: {
        alt: "#456789",
        backdrop: "#abcdef",
        default: "#123c5d",
        inverse: "#fedcba",
      },
      interaction: {
        default: "#123456",
        hover: "#654321",
        pressed: "#abcdef",
      },
    },
  },
}
const MOCK_BLACK_THEME = {
  colors: {
    brand: {
      canvas: {
        alt: "#000000",
        backdrop: "#000000",
        default: "#000000",
        inverse: "#000000",
      },
      interaction: {
        default: "#000000",
        hover: "#000000",
        pressed: "#000000",
      },
    },
  },
}

const generateNotification = ({
  title,
  content,
}: {
  title: string
  content?: string
}) => {
  const baseNotification = {
    notification: {
      title,
    },
  }

  if (!content) {
    return baseNotification satisfies Notification
  }

  return {
    notification: {
      ...baseNotification.notification,
      content: {
        content: [
          {
            content: [
              {
                type: "text",
                text: content,
              },
            ],
            type: "paragraph",
            attrs: {
              dir: "ltr",
            },
          },
        ],
        type: "prose",
      },
    },
  } satisfies Notification
}

describe("site.router", async () => {
  let caller: ReturnType<typeof createCaller>
  const session = await applyAuthedSession()
  let user: User

  beforeAll(() => {
    caller = createCaller(createMockRequest(session))
  })

  beforeEach(async () => {
    await resetTables("Site", "ResourcePermission", "IsomerAdmin", "User")
    user = await setupUser({
      email: "test@mock.com",
      userId: session.userId,
    })
    await auth(user)
    // Re-create the caller after resetTables to ensure a clean state
    caller = createCaller(createMockRequest(session))
  })

  describe("list", () => {
    it("should throw 401 if not logged in", async () => {
      // Arrange
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.list()

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should return an empty array if there are no sites in the database", async () => {
      // Act
      const result = await caller.list()

      // Assert
      expect(result).toEqual([])
    })

    it("should include the Site if the user has any role permission for the site", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.list()

      // Assert
      expect(result).toEqual([
        {
          config: site.config,
          id: site.id,
          role: RoleType.Editor,
        },
      ])
    })

    it("should only include sites that the user has any role permission for", async () => {
      // Arrange
      const { site: site1 } = await setupSite()
      const { site: _site2 } = await setupSite()
      await setupEditorPermissions({
        siteId: site1.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.list()

      // Assert
      expect(result).toEqual([
        {
          config: site1.config,
          id: site1.id,
          role: RoleType.Editor,
        },
      ])
    })

    it("should return an empty array if the user does not have any role for the site", async () => {
      // Arrange
      const _ = await setupSite()

      // Act
      const result = await caller.list()

      // Assert
      expect(result).toEqual([])
    })

    it("should only return sites if the permissions are not deleted for the site", async () => {
      const { site: site1 } = await setupSite()
      const { site: site2 } = await setupSite()
      await setupEditorPermissions({
        isDeleted: true,
        siteId: site1.id,
        userId: session.userId,
      })
      await setupEditorPermissions({
        siteId: site2.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.list()

      // Assert
      expect(result).toEqual([
        {
          config: site2.config,
          id: site2.id,
          role: RoleType.Editor,
        },
      ])
    })

    it("should return all sites if the user is an active Isomer admin", async () => {
      // Arrange
      const { site: site1 } = await setupSite()
      const { site: site2 } = await setupSite()
      await setupIsomerAdmin({
        role: IsomerAdminRole.Core,
        userId: session.userId!,
      })

      // Act
      const result = await caller.list()

      // Assert
      expect(result).toEqual(
        [site1, site2]
          .toSorted((a, b) => a.id - b.id)
          .map((site) => ({
            config: site.config,
            id: site.id,
            role: RoleType.Admin,
          })),
      )
    })

    it("should return the Admin role even if the user also has an explicit lower role on the site", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })
      await setupIsomerAdmin({
        role: IsomerAdminRole.Core,
        userId: session.userId!,
      })

      // Act
      const result = await caller.list()

      // Assert
      expect(result).toEqual([
        {
          config: site.config,
          id: site.id,
          role: RoleType.Admin,
        },
      ])
    })
  })

  describe("listAllSites", () => {
    it("should throw 401 if not logged in", async () => {
      // Arrange
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.listAllSites()

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 403 if user is not an Isomer Core Admin", async () => {
      // Arrange
      // user has no IsomerAdmin entry — should be rejected

      // Act
      const result = caller.listAllSites()

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })

    it("should return all sites if user is an Isomer Core Admin", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupIsomerAdmin({
        role: IsomerAdminRole.Core,
        userId: session.userId!,
      })

      // Act
      const result = await caller.listAllSites()

      // Assert
      expect(result).toEqual([pick(site, ["id", "config", "codeBuildId"])])
    })
  })

  describe("getSiteName", () => {
    it("should throw 401 if not logged in", async () => {
      // Arrange
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.getSiteName({ siteId: 1 })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should return the site name", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.getSiteName({ siteId: site.id })

      // Assert
      expect(result).toEqual({ name: site.name })
    })

    it("should throw 403 if user does not have read access to the site", async () => {
      // Arrange
      const { site } = await setupSite()

      // Act
      const result = caller.getSiteName({ siteId: site.id })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })
  })

  describe("getConfig", () => {
    it("should throw 401 if not logged in", async () => {
      // Arrange
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.getConfig({ id: 1 })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 403 if user does not have read access to the site", async () => {
      // Arrange
      const { site } = await setupSite()

      // Act
      const result = caller.getConfig({ id: site.id })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })

    it("should return the site config", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.getConfig({ id: site.id })

      // Assert
      expect(result).toEqual(site.config)
    })
  })

  describe("updateSiteConfig", () => {
    it("should throw 401 if not logged in", async () => {
      // Arrange
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.updateSiteConfig({
        logoUrl: MOCK_LOGO_URL,
        siteId: 1,
        siteName: MOCK_SITE_NAME,
        theme: "isomer-next",
        url: "https://www.isomer.gov.sg",
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })
    it("should throw 403 if the user does not have write access to the site", async () => {
      // Arrange
      const { site } = await setupSite()

      // Act
      const result = caller.updateSiteConfig({
        logoUrl: MOCK_LOGO_URL,
        siteId: site.id,
        siteName: MOCK_SITE_NAME,
        theme: "isomer-next",
        url: "https://www.isomer.gov.sg",
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })
    it("should throw 403 if the user has publisher access to the site", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupPublisherPermissions({
        siteId: site.id,
        userId: session.userId,
      })
      // Act
      const result = caller.updateSiteConfig({
        logoUrl: MOCK_LOGO_URL,
        siteId: site.id,
        siteName: MOCK_SITE_NAME,
        theme: "isomer-next",
        url: "https://www.isomer.gov.sg",
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })

    it.each(["", " ", "\t", "\n", " \t\n "])(
      "should reject empty or whitespace-only siteName",
      async (siteName) => {
        // Arrange
        const { site } = await setupSite()
        await setupAdminPermissions({
          siteId: site.id,
          userId: session.userId,
        })

        // Act
        const result = caller.updateSiteConfig({
          logoUrl: MOCK_LOGO_URL,
          siteId: site.id,
          siteName,
          theme: "isomer-next",
          url: "https://www.isomer.gov.sg",
        })

        // Assert
        await expect(result).rejects.toMatchObject({
          code: "BAD_REQUEST",
          message: expect.stringContaining("Site name is required"),
        })
      },
    )

    it("should update the site config if the user is a site admin", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.updateSiteConfig({
        logoUrl: MOCK_LOGO_URL,
        siteId: site.id,
        siteName: MOCK_SITE_NAME,
        theme: "isomer-next",
        url: "https://www.isomer.gov.sg",
      })

      // Assert
      expect(result).toEqual({
        logoUrl: MOCK_LOGO_URL,
        siteName: MOCK_SITE_NAME,
        theme: "isomer-next",
        url: "https://www.isomer.gov.sg",
      })

      // Verify Site.name column is also updated
      const updatedSite = await db
        .selectFrom("Site")
        .where("id", "=", site.id)
        .select("name")
        .executeTakeFirstOrThrow()
      expect(updatedSite.name).toEqual(MOCK_SITE_NAME)
    })
    it("should normalize an AskGov URL when updating the site config", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.updateSiteConfig({
        askgov: {
          "data-agency":
            "https://www.ask.gov.sg/mha/questions/question-id?from=widget",
        },
        logoUrl: MOCK_LOGO_URL,
        siteId: site.id,
        siteName: MOCK_SITE_NAME,
        theme: "isomer-next",
        url: "https://www.isomer.gov.sg",
      })

      // Assert
      expect(result.askgov).toEqual({ "data-agency": "mha" })
    })
    it("should generate an audit log entry", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      await caller.updateSiteConfig({
        logoUrl: MOCK_LOGO_URL,
        siteId: site.id,
        siteName: MOCK_SITE_NAME,
        theme: "isomer-next",
        url: "https://www.isomer.gov.sg",
      })

      // Assert
      await assertAuditLog(session.userId)
    })
    it("should update searchsg if the update went through", async () => {
      // Arrange
      const mockSearch = {
        search: {
          clientId: MOCK_SEARCHSG_CLIENT_ID,
          type: "searchSG",
        },
      } as const
      const searchSpy = vi.spyOn(searchSgService, "updateSearchSGConfig")
      const { site } = await setupSite()
      await db
        .updateTable("Site")
        .set({
          config: {
            ...site.config,
            ...mockSearch,
          },
        })
        .execute()

      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.updateSiteConfig({
        logoUrl: MOCK_LOGO_URL,
        siteId: site.id,
        siteName: MOCK_SITE_NAME,
        theme: "isomer-next",
        url: "https://www.isomer.gov.sg",
        ...mockSearch,
      })

      // Assert
      expect(searchSpy).toHaveBeenCalledWith(
        {
          _kind: "name",
          name: MOCK_SITE_NAME,
        },
        mockSearch.search.clientId,
        result.url,
      )
      expect(result).toEqual({
        logoUrl: MOCK_LOGO_URL,
        siteName: MOCK_SITE_NAME,
        theme: "isomer-next",
        url: "https://www.isomer.gov.sg",
        ...mockSearch,
      })
    })
    it("should not allow a site admin to change the searchSG clientId", async () => {
      // Arrange
      const existingClientId = MOCK_SEARCHSG_CLIENT_ID
      const { site } = await setupSite()
      await db
        .updateTable("Site")
        .set({
          config: {
            ...site.config,
            search: { clientId: existingClientId, type: "searchSG" },
          },
        })
        .where("id", "=", site.id)
        .execute()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act - submit with a different clientId
      const result = await caller.updateSiteConfig({
        logoUrl: MOCK_LOGO_URL,
        search: { clientId: "../../other-client-id", type: "searchSG" },
        siteId: site.id,
        siteName: MOCK_SITE_NAME,
        theme: "isomer-next",
        url: "https://www.isomer.gov.sg",
      })

      // Assert - the stored clientId should be the original DB value
      expect(result.search).toEqual({
        clientId: existingClientId,
        type: "searchSG",
      })
    })
    it("should call updateSearchSGConfig with the DB clientId, not the user-supplied one", async () => {
      // Arrange
      const existingClientId = MOCK_SEARCHSG_CLIENT_ID
      const searchSpy = vi.spyOn(searchSgService, "updateSearchSGConfig")
      const { site } = await setupSite()
      await db
        .updateTable("Site")
        .set({
          config: {
            ...site.config,
            search: { clientId: existingClientId, type: "searchSG" },
          },
        })
        .where("id", "=", site.id)
        .execute()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act - submit with a different clientId and changed siteName to trigger searchsg update
      const result = await caller.updateSiteConfig({
        logoUrl: MOCK_LOGO_URL,
        search: { clientId: "../../other-client-id", type: "searchSG" },
        siteId: site.id,
        siteName: MOCK_SITE_NAME,
        theme: "isomer-next",
        url: "https://www.isomer.gov.sg",
      })

      // Assert - updateSearchSGConfig is called with the preserved DB clientId
      expect(searchSpy).toHaveBeenCalledWith(
        { _kind: "name", name: MOCK_SITE_NAME },
        existingClientId,
        result.url,
      )
    })
    it("uses clientId fixtures that pass the SearchSG format check", () => {
      // Guards the premise of the tampering tests below: a malformed clientId
      // is rejected downstream anyway, so the fixtures have to be well-formed
      // for those tests to cover the case that actually reaches SearchSG.
      expect(
        searchSgService.isValidSearchSGClientId(MOCK_SEARCHSG_CLIENT_ID),
      ).toBe(true)
      expect(
        searchSgService.isValidSearchSGClientId(
          MOCK_OTHER_SITE_SEARCHSG_CLIENT_ID,
        ),
      ).toBe(true)
    })
    it("should not allow a site admin to enable searchSG with a supplied clientId", async () => {
      // Arrange - no search integration, so there is no clientId in the DB to
      // fall back on. The clientId is a valid UUID belonging to another site.
      const { site } = await setupSite()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = caller.updateSiteConfig({
        logoUrl: MOCK_LOGO_URL,
        search: {
          clientId: MOCK_OTHER_SITE_SEARCHSG_CLIENT_ID,
          type: "searchSG",
        },
        siteId: site.id,
        siteName: MOCK_SITE_NAME,
        theme: "isomer-next",
        url: "https://www.isomer.gov.sg",
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Cannot enable the SearchSG search integration. Contact Isomer Support to set it up.",
        }),
      )
    })
    it("should not allow a site admin to switch search to egazette-algolia", async () => {
      // Arrange - site is not on egazette-algolia
      const { site } = await setupSite()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act - attempt to introduce egazette-algolia (admin-managed) credentials
      const result = caller.updateSiteConfig({
        logoUrl: MOCK_LOGO_URL,
        search: MOCK_EGAZETTE_ALGOLIA_SEARCH,
        siteId: site.id,
        siteName: MOCK_SITE_NAME,
        theme: "isomer-next",
        url: "https://www.isomer.gov.sg",
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Cannot change the eGazette Algolia search integration. Contact Isomer Support to update it.",
        }),
      )
    })
    it("should not allow a site admin to switch search away from egazette-algolia", async () => {
      // Arrange - site is already on egazette-algolia
      const { site } = await setupSite()
      await db
        .updateTable("Site")
        .set({
          config: {
            ...site.config,
            search: MOCK_EGAZETTE_ALGOLIA_SEARCH,
          },
        })
        .where("id", "=", site.id)
        .execute()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act - attempt to downgrade to localSearch
      const result = caller.updateSiteConfig({
        logoUrl: MOCK_LOGO_URL,
        search: { searchUrl: "/search", type: "localSearch" },
        siteId: site.id,
        siteName: MOCK_SITE_NAME,
        theme: "isomer-next",
        url: "https://www.isomer.gov.sg",
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Cannot change the eGazette Algolia search integration. Contact Isomer Support to update it.",
        }),
      )
    })
    it("should preserve the egazette-algolia config from DB and ignore tampered credentials", async () => {
      // Arrange - site is already on egazette-algolia
      const { site } = await setupSite()
      await db
        .updateTable("Site")
        .set({
          config: {
            ...site.config,
            search: MOCK_EGAZETTE_ALGOLIA_SEARCH,
          },
        })
        .where("id", "=", site.id)
        .execute()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act - submit egazette-algolia with tampered credentials
      const result = await caller.updateSiteConfig({
        logoUrl: MOCK_LOGO_URL,
        search: {
          ...MOCK_EGAZETTE_ALGOLIA_SEARCH,
          appId: "attacker-app-id",
          indexName: "attacker-index",
          searchApiKey: "attacker-key",
        },
        siteId: site.id,
        siteName: MOCK_SITE_NAME,
        theme: "isomer-next",
        url: "https://www.isomer.gov.sg",
      })

      // Assert - the stored search config is the original DB value
      expect(result.search).toEqual(MOCK_EGAZETTE_ALGOLIA_SEARCH)
    })
  })

  describe("updateSiteIntegrations", () => {
    const MOCK_INTEGRATION_DATA = {
      logoUrl: MOCK_LOGO_URL,
      siteName: MOCK_SITE_NAME,
      theme: "isomer-next",
      url: "https://www.isomer.gov.sg",
    } as const

    it("should throw 401 if not logged in", async () => {
      // Arrange
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.updateSiteIntegrations({
        data: MOCK_INTEGRATION_DATA,
        siteId: 1,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })
    it("should throw 403 if the user does not have write access to the site", async () => {
      // Arrange
      const { site } = await setupSite()

      // Act
      const result = caller.updateSiteIntegrations({
        data: MOCK_INTEGRATION_DATA,
        siteId: site.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })
    it("should throw 403 if the user has publisher access to the site", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupPublisherPermissions({
        siteId: site.id,
        userId: session.userId,
      })
      // Act
      const result = caller.updateSiteIntegrations({
        data: MOCK_INTEGRATION_DATA,
        siteId: site.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })
    it("should update the site integrations if the user is a site admin", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.updateSiteIntegrations({
        data: MOCK_INTEGRATION_DATA,
        siteId: site.id,
      })

      // Assert
      expect(result.config).toEqual(MOCK_INTEGRATION_DATA)
    })
    it.each([
      {
        description: "URL",
        expected: "mom",
        input: "http://ask.gov.sg/mom/?topic=employment#contact",
      },
      {
        description: "scheme-less URL",
        expected: "help",
        input: "www.ask.gov.sg/help/questions/question-id",
      },
      { description: "ID", expected: "mha", input: "mha" },
    ])(
      "should store an AskGov $description as the agency ID when updating site integrations",
      async ({ input, expected }) => {
        // Arrange
        const { site } = await setupSite()
        await setupAdminPermissions({
          siteId: site.id,
          userId: session.userId,
        })

        // Act
        const result = await caller.updateSiteIntegrations({
          data: {
            ...MOCK_INTEGRATION_DATA,
            askgov: { "data-agency": input },
          },
          siteId: site.id,
        })

        // Assert
        expect(result.config.askgov).toEqual({ "data-agency": expected })
      },
    )
    it("should generate an audit log entry", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      await caller.updateSiteIntegrations({
        data: MOCK_INTEGRATION_DATA,
        siteId: site.id,
      })

      // Assert
      await assertAuditLog(session.userId)
    })

    it("should preserve extra properties that are submitted in `data`", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const invalidIntegrationData = {
        ...MOCK_INTEGRATION_DATA,
        fake: "fake",
      }
      const result = await caller.updateSiteIntegrations({
        data: invalidIntegrationData,
        siteId: site.id,
      })

      // Assert
      expect(result.config).toEqual({ ...MOCK_INTEGRATION_DATA, fake: "fake" })
    })

    it("should reject an invalid siteGtmId", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = caller.updateSiteIntegrations({
        data: {
          ...MOCK_INTEGRATION_DATA,
          siteGtmId: "');alert(document.cookie);//",
        },
        siteId: site.id,
      })

      // Assert
      await expect(result).rejects.toMatchObject({ code: "BAD_REQUEST" })
    })

    it("should not allow a site admin to change the searchSG clientId", async () => {
      // Arrange
      const { site } = await setupSite()
      await db
        .updateTable("Site")
        .set({
          config: {
            ...site.config,
            search: { clientId: MOCK_SEARCHSG_CLIENT_ID, type: "searchSG" },
          },
        })
        .where("id", "=", site.id)
        .execute()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act - submit another site's clientId
      const result = await caller.updateSiteIntegrations({
        data: {
          ...MOCK_INTEGRATION_DATA,
          search: {
            clientId: MOCK_OTHER_SITE_SEARCHSG_CLIENT_ID,
            type: "searchSG",
          },
        },
        siteId: site.id,
      })

      // Assert - the stored clientId should be the original DB value
      expect(result.config.search).toEqual({
        clientId: MOCK_SEARCHSG_CLIENT_ID,
        type: "searchSG",
      })
    })
    it("should not allow a site admin to enable searchSG with a supplied clientId", async () => {
      // Arrange - no search integration, so there is no clientId in the DB
      const { site } = await setupSite()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = caller.updateSiteIntegrations({
        data: {
          ...MOCK_INTEGRATION_DATA,
          search: {
            clientId: MOCK_OTHER_SITE_SEARCHSG_CLIENT_ID,
            type: "searchSG",
          },
        },
        siteId: site.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Cannot enable the SearchSG search integration. Contact Isomer Support to set it up.",
        }),
      )
    })
    it("should throw 400 if downgrading search integration from searchSG to localSearch", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })
      // Set the site config to have searchSG integration
      await db
        .updateTable("Site")
        .set({
          config: jsonb({
            ...MOCK_INTEGRATION_DATA,
            search: { clientId: "mock-client-id", type: "searchSG" },
          }),
        })
        .where("id", "=", site.id)
        .execute()

      // Act
      const result = caller.updateSiteIntegrations({
        data: {
          ...MOCK_INTEGRATION_DATA,
          search: { searchUrl: "/search", type: "localSearch" },
        },
        siteId: site.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Cannot downgrade search integration from SearchSG to local search",
        }),
      )
    })

    it("should throw 400 if localSearch searchUrl is not a relative path", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act — searchUrl must match pattern "^/" (enforced by LocalSearchSchema);
      // an absolute URL would enable open redirect via the form action.
      const result = caller.updateSiteIntegrations({
        data: {
          ...MOCK_INTEGRATION_DATA,
          search: {
            searchUrl: "https://attacker.com",
            type: "localSearch",
          },
        },
        siteId: site.id,
      })

      // Assert — validation is enforced by LocalSearchSchema's pattern "^/" via AJV;
      // tRPC surfaces this as a Zod custom validation failure, not a plain TRPCError.
      await expect(result).rejects.toThrow("Invalid integration settings")
    })

    it("should throw 400 if switching search integration to egazette-algolia", async () => {
      // Arrange - site is not on egazette-algolia
      const { site } = await setupSite()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act - attempt to introduce egazette-algolia (admin-managed) credentials
      const result = caller.updateSiteIntegrations({
        data: {
          ...MOCK_INTEGRATION_DATA,
          search: MOCK_EGAZETTE_ALGOLIA_SEARCH,
        },
        siteId: site.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Cannot change the eGazette Algolia search integration. Contact Isomer Support to update it.",
        }),
      )
    })

    it("should throw 400 if switching search integration away from egazette-algolia", async () => {
      // Arrange - site is already on egazette-algolia
      const { site } = await setupSite()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })
      await db
        .updateTable("Site")
        .set({
          config: jsonb({
            ...MOCK_INTEGRATION_DATA,
            search: MOCK_EGAZETTE_ALGOLIA_SEARCH,
          }),
        })
        .where("id", "=", site.id)
        .execute()

      // Act - attempt to downgrade to localSearch
      const result = caller.updateSiteIntegrations({
        data: {
          ...MOCK_INTEGRATION_DATA,
          search: { searchUrl: "/search", type: "localSearch" },
        },
        siteId: site.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Cannot change the eGazette Algolia search integration. Contact Isomer Support to update it.",
        }),
      )
    })

    it("should preserve the egazette-algolia config from DB and ignore tampered credentials", async () => {
      // Arrange - site is already on egazette-algolia
      const { site } = await setupSite()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })
      await db
        .updateTable("Site")
        .set({
          config: jsonb({
            ...MOCK_INTEGRATION_DATA,
            search: MOCK_EGAZETTE_ALGOLIA_SEARCH,
          }),
        })
        .where("id", "=", site.id)
        .execute()

      // Act - submit egazette-algolia with tampered credentials
      const result = await caller.updateSiteIntegrations({
        data: {
          ...MOCK_INTEGRATION_DATA,
          search: {
            ...MOCK_EGAZETTE_ALGOLIA_SEARCH,
            appId: "attacker-app-id",
            indexName: "attacker-index",
            searchApiKey: "attacker-key",
          },
        },
        siteId: site.id,
      })

      // Assert - the stored search config is the original DB value
      expect(result.config.search).toEqual(MOCK_EGAZETTE_ALGOLIA_SEARCH)
    })
  })

  describe("setTheme", () => {
    it("should throw 401 if not logged in", async () => {
      // Arrange
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.setTheme({
        siteId: 1,
        theme: MOCK_ISOMER_THEME,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })
    it("should throw 403 if the user does not have write access to the site", async () => {
      // Arrange
      const { site } = await setupSite()

      // Act
      const result = caller.setTheme({
        siteId: site.id,
        theme: MOCK_ISOMER_THEME,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })
    it("should throw 403 if the user only has publisher access", async () => {
      // Arrange
      const { site } = await setupSite()
      await db
        .updateTable("Site")
        .set({ theme: jsonb(MOCK_BLACK_THEME) })
        .where("id", "=", site.id)
        .execute()

      await setupPublisherPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = caller.setTheme({
        siteId: site.id,
        theme: MOCK_ISOMER_THEME,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })
    it("should throw 404 if the theme for the site could not be found", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = caller.setTheme({
        siteId: site.id,
        theme: MOCK_ISOMER_THEME,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "NOT_FOUND",
          message: "The theme for the site could not be found.",
        }),
      )
    })
    it("should update the site theme if the user is a site admin", async () => {
      // Arrange
      const { site } = await setupSite()
      await db
        .updateTable("Site")
        .set({ theme: jsonb(MOCK_BLACK_THEME) })
        .where("id", "=", site.id)
        .execute()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.setTheme({
        siteId: site.id,
        theme: MOCK_ISOMER_THEME,
      })

      // Assert
      expect(result).toMatchObject({
        theme: MOCK_ISOMER_THEME,
      })
    })
    it("should update searchsg if the user is a site admin", async () => {
      // Arrange
      const mockSearchSg = {
        search: { clientId: MOCK_SEARCHSG_CLIENT_ID, type: "searchSG" },
      } as const
      const { site } = await setupSite()
      const spy = vi.spyOn(searchSgService, "updateSearchSGConfig")
      await db
        .updateTable("Site")
        .set({
          config: {
            ...site.config,
            ...mockSearchSg,
          },
          theme: jsonb(MOCK_BLACK_THEME),
        })
        .where("id", "=", site.id)
        .execute()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.setTheme({
        siteId: site.id,
        theme: MOCK_ISOMER_THEME,
      })

      // Assert
      expect(result).toMatchObject({
        theme: MOCK_ISOMER_THEME,
      })
      expect(spy).toHaveBeenCalledWith(
        {
          _kind: "colour",
          colour: MOCK_ISOMER_THEME.colors.brand.canvas.inverse,
        },
        mockSearchSg.search.clientId,
        site.config.url,
      )
    })
    it("should generate an audit log entry", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })
      await db
        .updateTable("Site")
        .set({ theme: jsonb(MOCK_BLACK_THEME) })
        .where("id", "=", site.id)
        .execute()

      // Act
      await caller.setTheme({
        siteId: site.id,
        theme: MOCK_ISOMER_THEME,
      })

      // Assert
      await assertAuditLog(session.userId)
    })
  })
  describe("getTheme", () => {
    it("should throw 401 if not logged in", async () => {
      // Arrange
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.getTheme({ id: 1 })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 403 if user does not have read access to the site", async () => {
      // Arrange
      const { site } = await setupSite()

      // Act
      const result = caller.getTheme({ id: site.id })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })

    it("should return the site theme", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.getTheme({ id: site.id })

      // Assert
      expect(result).toEqual(site.theme)
    })
  })

  describe("getFooter", () => {
    it("should throw 401 if not logged in", async () => {
      // Arrange
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.getFooter({ id: 1 })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 403 if user does not have read access to the site", async () => {
      // Arrange
      const { site } = await setupSite()

      // Act
      const result = caller.getFooter({ id: site.id })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })

    it("should return the site footer", async () => {
      // Arrange
      const { site, footer } = await setupSite()
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.getFooter({ id: site.id })

      // Assert
      expect(result).toEqual({
        content: footer.content,
        id: footer.id,
        siteId: site.id,
      })
    })
  })

  describe("setFooter", () => {
    it("should throw 401 if not logged in", async () => {
      // Arrange
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))
      const footerContent = JSON.stringify({ foo: "bar" })

      // Act
      const result = unauthedCaller.setFooter({
        footer: footerContent,
        siteId: 1,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
      await expect(db.selectFrom("AuditLog").execute()).resolves.toHaveLength(0)
    })

    it("should throw 403 if user does not have write access to the site", async () => {
      // Arrange
      const { site } = await setupSite()
      const footerContent = JSON.stringify({ foo: "bar" })

      // Act
      const result = caller.setFooter({
        footer: footerContent,
        siteId: site.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
      await expect(db.selectFrom("AuditLog").execute()).resolves.toHaveLength(0)
    })

    it('should throw 403 if user has only "publisher" access to the site', async () => {
      // Arrange
      const { site } = await setupSite()
      const footerContent = JSON.stringify({ foo: "bar" })
      await setupPublisherPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = caller.setFooter({
        footer: footerContent,
        siteId: site.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
      await expect(db.selectFrom("AuditLog").execute()).resolves.toHaveLength(0)
    })

    it("should set the site footer successfully", async () => {
      // Arrange
      const { site } = await setupSite()
      const footerContent = { foo: "bar" }
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      await caller.setFooter({
        footer: JSON.stringify(footerContent),
        siteId: site.id,
      })

      // Assert
      const newFooter = await db
        .selectFrom("Footer")
        .where("siteId", "=", site.id)
        .selectAll()
        .executeTakeFirstOrThrow()
      expect(newFooter.content).toEqual(footerContent)
      const auditLog = await db.selectFrom("AuditLog").selectAll().execute()
      expect(auditLog).toHaveLength(2)
      expect(
        auditLog.some(
          ({ eventType }) => eventType === AuditLogEvent.FooterUpdate,
        ),
      ).toEqual(true)
      expect(
        auditLog.some(({ eventType }) => eventType === AuditLogEvent.Publish),
      ).toEqual(true)
      expect(auditLog.every(({ userId }) => userId === session.userId)).toEqual(
        true,
      )
    })
  })

  describe("getNavbar", () => {
    it("should throw 401 if not logged in", async () => {
      // Arrange
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.getNavbar({ id: 1 })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 403 if user does not have read access to the site", async () => {
      // Arrange
      const { site } = await setupSite()

      // Act
      const result = caller.getNavbar({ id: site.id })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })

    it("should return the site navbar", async () => {
      // Arrange
      const { site, navbar } = await setupSite()
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.getNavbar({ id: site.id })

      // Assert
      expect(result).toEqual({
        content: navbar.content,
        id: navbar.id,
        siteId: site.id,
      })
    })
  })

  describe("setNavbar", () => {
    it("should throw 401 if not logged in", async () => {
      // Arrange
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))
      const navbarContent = JSON.stringify({ foo: "bar" })

      // Act
      const result = unauthedCaller.setNavbar({
        navbar: navbarContent,
        siteId: 1,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
      await expect(db.selectFrom("AuditLog").execute()).resolves.toHaveLength(0)
    })

    it("should throw 403 if user does not have write access to the site", async () => {
      // Arrange
      const { site } = await setupSite()
      const navbarContent = JSON.stringify({ foo: "bar" })

      // Act
      const result = caller.setNavbar({
        navbar: navbarContent,
        siteId: site.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
      await expect(db.selectFrom("AuditLog").execute()).resolves.toHaveLength(0)
    })

    it('should throw 403 if user has only "publisher" access to the site', async () => {
      // Arrange
      const { site } = await setupSite()
      const navbarContent = JSON.stringify({ foo: "bar" })
      await setupPublisherPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = caller.setNavbar({
        navbar: navbarContent,
        siteId: site.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
      await expect(db.selectFrom("AuditLog").execute()).resolves.toHaveLength(0)
    })

    it("should set the site navbar successfully", async () => {
      // Arrange
      const { site } = await setupSite()
      const navbarContent = { foo: "bar" }
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      await caller.setNavbar({
        navbar: JSON.stringify(navbarContent),
        siteId: site.id,
      })

      // Assert
      const newNavbar = await db
        .selectFrom("Navbar")
        .where("siteId", "=", site.id)
        .selectAll()
        .executeTakeFirstOrThrow()
      expect(newNavbar.content).toEqual(navbarContent)
      const auditLog = await db.selectFrom("AuditLog").selectAll().execute()
      expect(auditLog).toHaveLength(2)
      expect(
        auditLog.some(
          ({ eventType }) => eventType === AuditLogEvent.NavbarUpdate,
        ),
      ).toEqual(true)
      expect(
        auditLog.some(({ eventType }) => eventType === AuditLogEvent.Publish),
      ).toEqual(true)
      expect(auditLog.every(({ userId }) => userId === session.userId)).toEqual(
        true,
      )
    })
  })

  describe("getLocalisedSitemap", () => {
    it("should throw 401 if not logged in", async () => {
      // Arrange
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.getLocalisedSitemap({
        resourceId: 1,
        siteId: 1,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 403 if user does not have read access to the site", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
      })

      // Act
      const result = caller.getLocalisedSitemap({
        resourceId: Number.parseInt(page.id),
        siteId: site.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })

    it("should return the localised sitemap", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
      })
      await setupPageResource({
        resourceType: ResourceType.RootPage,
        // prerequisite
        siteId: site.id,
      })
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.getLocalisedSitemap({
        resourceId: Number.parseInt(page.id),
        siteId: site.id,
      })

      // Assert
      expect(result).toBeDefined()
    })
  })

  describe("getNotification", () => {
    it("should throw 401 if user is not logged in", async () => {
      // Arrange
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.getNotification({ siteId: 1 })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 403 if user does not have read access to the site", async () => {
      // Arrange
      const { site } = await setupSite()

      // Act
      const result = caller.getNotification({ siteId: site.id })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })

    it("should return empty object if site notification is not set", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.getNotification({ siteId: site.id })

      // Assert
      expect(result).toEqual({})
    })

    it("should return the notification with the content in `prose` even if the base content is in `text` format", async () => {
      // Arrange
      const { site } = await setupSite()
      const title = "hello"
      const content = "world"
      await db
        .updateTable("Site")
        .set((eb) => ({
          config: eb(
            "Site.config",
            "||",
            // @ts-expect-error JSON concat operator replaces the entire notification object if it exists, but Kysely does not have types for this.
            jsonb({
              // NOTE: This is in the old format
              notification: {
                content: [{ type: "text", text: content }],
                title,
              },
            }),
          ),
        }))
        .where("id", "=", site.id)
        .execute()
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })
      const expected = generateNotification({ content, title })

      // Act
      const actual = await caller.getNotification({ siteId: site.id })

      // Assert
      expect(actual).toEqual(expected)
    })
  })

  describe("setNotification", () => {
    beforeEach(async () => {
      await resetTables("AuditLog")
    })

    it("should throw 401 if user is not logged in", async () => {
      // Arrange
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.setNotification({
        notification: {
          notification: { title: "foo" },
        },
        siteId: 1,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
      await expect(db.selectFrom("AuditLog").execute()).resolves.toHaveLength(0)
    })

    it("should throw 403 if user does not have write access to the site", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = caller.setNotification({
        notification: {
          notification: { title: "foo" },
        },
        siteId: site.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
      await expect(db.selectFrom("AuditLog").execute()).resolves.toHaveLength(0)
    })

    it("should throw 403 if user has publisher access to the site", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupPublisherPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = caller.setNotification({
        notification: {
          notification: { title: "foo" },
        },
        siteId: site.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
      await expect(db.selectFrom("AuditLog").execute()).resolves.toHaveLength(0)
    })

    it("should save changes to the site notification successfully if one exists", async () => {
      // Arrange
      const { site } = await setupSite()
      await db
        .updateTable("Site")
        .set((eb) => ({
          config: eb(
            "Site.config",
            "||",
            // @ts-expect-error JSON concat operator replaces the entire notification object if it exists, but Kysely does not have types for this.
            jsonb({
              notification: { content: [{ text: "bar", type: "text" }] },
            }),
          ),
        }))
        .where("id", "=", site.id)
        .execute()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })
      const notification = generateNotification({ title: "foo" })

      // Act
      await caller.setNotification({
        notification,
        siteId: site.id,
      })

      // Assert
      const newSite = await db
        .selectFrom("Site")
        .where("id", "=", site.id)
        .select("Site.config")
        .executeTakeFirstOrThrow()
      expect(newSite.config.notification).toEqual(notification.notification)
      const auditLog = await db.selectFrom("AuditLog").selectAll().execute()
      expect(auditLog).toHaveLength(2)
      expect(
        auditLog.some(
          ({ eventType }) => eventType === AuditLogEvent.SiteConfigUpdate,
        ),
      ).toEqual(true)
      expect(
        auditLog.some(({ eventType }) => eventType === AuditLogEvent.Publish),
      ).toEqual(true)
      expect(auditLog.every(({ userId }) => userId === session.userId)).toEqual(
        true,
      )
    })

    it("should add the site notification successfully if one did exist before", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })
      const notification = generateNotification({ title: "foo" })

      // Act
      await caller.setNotification({
        notification,
        siteId: site.id,
      })

      // Assert
      const newSite = await db
        .selectFrom("Site")
        .where("id", "=", site.id)
        .select("Site.config")
        .executeTakeFirstOrThrow()
      expect(newSite.config.notification).toEqual(notification.notification)
      const auditLog = await db
        .selectFrom("AuditLog")
        .selectAll()
        .executeTakeFirst()
      expect(auditLog).toBeDefined()
      expect(auditLog?.eventType).toEqual(AuditLogEvent.SiteConfigUpdate)
      expect(auditLog?.userId).toEqual(session.userId)
    })

    it("should remove the site notification successfully if notification is disabled", async () => {
      // Arrange
      const { site } = await setupSite()
      await db
        .updateTable("Site")
        .set((eb) => ({
          config: eb(
            "Site.config",
            "||",
            // @ts-expect-error JSON concat operator replaces the entire notification object if it exists, but Kysely does not have types for this.
            jsonb({
              notification: { content: [{ text: "bar", type: "text" }] },
            }),
          ),
        }))
        .where("id", "=", site.id)
        .execute()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      await caller.setNotification({
        notification: {},
        siteId: site.id,
      })

      // Assert
      const newSite = await db
        .selectFrom("Site")
        .where("id", "=", site.id)
        .select("Site.config")
        .executeTakeFirstOrThrow()
      expect(newSite.config.notification).toBeUndefined()
      const auditLog = await db
        .selectFrom("AuditLog")
        .selectAll()
        .executeTakeFirst()
      expect(auditLog).toBeDefined()
      expect(auditLog?.eventType).toEqual(AuditLogEvent.SiteConfigUpdate)
      expect(auditLog?.userId).toEqual(session.userId)
    })
  })

  describe("setSiteConfigByAdmin", () => {
    beforeEach(async () => {
      await resetTables("AuditLog", "Navbar", "Footer")
    })

    it("should throw 401 if user is not logged in", async () => {
      // Arrange
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.setSiteConfigByAdmin({
        config: "config",
        footer: "footer",
        navbar: "navbar",
        siteId: 1,
        theme: "theme",
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
      await expect(db.selectFrom("AuditLog").execute()).resolves.toHaveLength(0)
    })

    it("should throw 403 if user is not an Isomer Core Admin", async () => {
      // Arrange
      // user has no IsomerAdmin entry — should be rejected

      // Act
      const result = caller.setSiteConfigByAdmin({
        config: "config",
        footer: "footer",
        navbar: "navbar",
        siteId: 1,
        theme: "theme",
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })

    it("should save changes to the site config, navbar and footer successfully if user is an Isomer Core Admin", async () => {
      // Arrange
      const NEW_CONFIG = `"config"`
      const NEW_THEME = `"theme"`
      const NEW_NAVBAR = `"navbar"`
      const NEW_FOOTER = `"footer"`
      const { site } = await setupSite()
      await setupIsomerAdmin({
        role: IsomerAdminRole.Core,
        userId: session.userId!,
      })

      // Act
      await caller.setSiteConfigByAdmin({
        config: NEW_CONFIG,
        footer: NEW_FOOTER,
        navbar: NEW_NAVBAR,
        siteId: site.id,
        theme: NEW_THEME,
      })

      // Assert
      const newSite = await db
        .selectFrom("Site")
        .where("id", "=", site.id)
        .selectAll()
        .executeTakeFirstOrThrow()
      const newNavbar = await db
        .selectFrom("Navbar")
        .where("siteId", "=", site.id)
        .selectAll()
        .executeTakeFirstOrThrow()
      const newFooter = await db
        .selectFrom("Footer")
        .where("siteId", "=", site.id)
        .selectAll()
        .executeTakeFirstOrThrow()
      const auditLogs = await db.selectFrom("AuditLog").selectAll().execute()

      expect(newSite.config).toEqual(NEW_CONFIG.replaceAll(`"`, ""))
      expect(newSite.theme).toEqual(NEW_THEME.replaceAll(`"`, ""))
      expect(newNavbar.content).toEqual(NEW_NAVBAR.replaceAll(`"`, ""))
      expect(newFooter.content).toEqual(NEW_FOOTER.replaceAll(`"`, ""))
      expect(auditLogs).toHaveLength(4)
      expect(
        auditLogs.some(
          (log) => log.eventType === AuditLogEvent.SiteConfigUpdate,
        ),
      ).toBe(true)
      expect(
        auditLogs.some((log) => log.eventType === AuditLogEvent.NavbarUpdate),
      ).toBe(true)
      expect(
        auditLogs.some((log) => log.eventType === AuditLogEvent.FooterUpdate),
      ).toBe(true)
      expect(
        auditLogs.some((log) => log.eventType === AuditLogEvent.Publish),
      ).toBe(true)
      expect(auditLogs.every((log) => log.userId === session.userId)).toBe(true)
    })

    it("should save changes to the site config, navbar and footer successfully if user is an Isomer Migrator Admin", async () => {
      // Arrange
      const NEW_CONFIG = `"config"`
      const NEW_THEME = `"theme"`
      const NEW_NAVBAR = `"navbar"`
      const NEW_FOOTER = `"footer"`
      const { site } = await setupSite()
      await setupIsomerAdmin({
        role: IsomerAdminRole.Migrator,
        userId: session.userId!,
      })

      // Act
      await caller.setSiteConfigByAdmin({
        config: NEW_CONFIG,
        footer: NEW_FOOTER,
        navbar: NEW_NAVBAR,
        siteId: site.id,
        theme: NEW_THEME,
      })

      // Assert
      const newSite = await db
        .selectFrom("Site")
        .where("id", "=", site.id)
        .selectAll()
        .executeTakeFirstOrThrow()
      const newNavbar = await db
        .selectFrom("Navbar")
        .where("siteId", "=", site.id)
        .selectAll()
        .executeTakeFirstOrThrow()
      const newFooter = await db
        .selectFrom("Footer")
        .where("siteId", "=", site.id)
        .selectAll()
        .executeTakeFirstOrThrow()
      const auditLogs = await db.selectFrom("AuditLog").selectAll().execute()

      expect(newSite.config).toEqual(NEW_CONFIG.replaceAll(`"`, ""))
      expect(newSite.theme).toEqual(NEW_THEME.replaceAll(`"`, ""))
      expect(newNavbar.content).toEqual(NEW_NAVBAR.replaceAll(`"`, ""))
      expect(newFooter.content).toEqual(NEW_FOOTER.replaceAll(`"`, ""))
      expect(auditLogs).toHaveLength(4)
      expect(
        auditLogs.some(
          (log) => log.eventType === AuditLogEvent.SiteConfigUpdate,
        ),
      ).toBe(true)
      expect(
        auditLogs.some((log) => log.eventType === AuditLogEvent.NavbarUpdate),
      ).toBe(true)
      expect(
        auditLogs.some((log) => log.eventType === AuditLogEvent.FooterUpdate),
      ).toBe(true)
      expect(
        auditLogs.some((log) => log.eventType === AuditLogEvent.Publish),
      ).toBe(true)
      expect(auditLogs.every((log) => log.userId === session.userId)).toBe(true)
    })
  })

  describe("create", () => {
    it("should throw 401 if user is not logged in", async () => {
      // Arrange
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.create({
        siteName: "foo",
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 403 if user is not an Isomer Core Admin", async () => {
      // Arrange
      // user has no IsomerAdmin entry — should be rejected

      // Act
      const result = caller.create({
        siteName: "foo",
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })

    it("should create a new site successfully if user is an Isomer Core Admin", async () => {
      // Arrange
      await setupIsomerAdmin({
        role: IsomerAdminRole.Core,
        userId: session.userId!,
      })

      // Act
      const result = await caller.create({
        siteName: "foo",
      })

      // Assert
      expect(result).toEqual({
        siteId: expect.any(Number),
        siteName: "foo",
      })
    })

    it.each(["", " ", "\t", "\n", " \t\n "])(
      "should reject empty or whitespace-only siteName",
      async (siteName) => {
        // Arrange
        await setupIsomerAdmin({
          role: IsomerAdminRole.Core,
          userId: session.userId!,
        })

        // Act
        const result = caller.create({
          siteName,
        })

        // Assert
        await expect(result).rejects.toMatchObject({
          code: "BAD_REQUEST",
          message: expect.stringContaining("Site name is required"),
        })
      },
    )
  })

  describe("publish", () => {
    it("should throw 401 if user is not logged in", async () => {
      // Arrange
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.publish({
        siteId: 1,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 403 if user is not an Isomer Core Admin", async () => {
      // Arrange
      const { site } = await setupSite()
      // user has no IsomerAdmin entry — should be rejected

      // Act
      const result = caller.publish({
        siteId: site.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })

    it("should publish a site successfully if user is an Isomer Core Admin", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupIsomerAdmin({
        role: IsomerAdminRole.Core,
        userId: session.userId!,
      })

      // Act
      const result = await caller.publish({
        siteId: site.id,
      })

      // Assert
      expect(result).toBeUndefined()
      // does not return anything
    })
  })
})

const assertAuditLog = async (sessionUserId?: string) => {
  const auditLog = await db.selectFrom("AuditLog").selectAll().execute()
  expect(auditLog).toHaveLength(2)
  expect(
    auditLog.some(
      ({ eventType }) => eventType === AuditLogEvent.SiteConfigUpdate,
    ),
  ).toEqual(true)
  expect(
    auditLog.some(({ eventType }) => eventType === AuditLogEvent.Publish),
  ).toEqual(true)
  expect(auditLog.every(({ userId }) => userId === sessionUserId)).toEqual(true)
}
