import { addMilliseconds, endOfMonth, parse, startOfMonth } from "date-fns"
import { AuditLogEvent, db, jsonb } from "~/server/modules/database"

import { resetTables } from "../../../tests/integration/helpers/db"
import {
  setupAdminPermissions,
  setupEditorPermissions,
  setupSite,
  setupUser,
} from "../../../tests/integration/helpers/seed"
import { getAuditLogQuery, getStringifiedValue } from "../getAuditLogs"

const TEST_MONTH = "2026-01"
const TEST_DATE = parse(TEST_MONTH, "yyyy-MM", new Date())
const MONTH_START = startOfMonth(TEST_DATE)
const MONTH_END = endOfMonth(TEST_DATE)
const MID_MONTH = new Date("2026-01-15T12:00:00.000Z")

interface UsersQueryRow {
  Email: string
  '"Last login"': Date | null
  Role: string
  '"Date added"': Date
}

interface EventsQueryRow {
  '"Date and time"': Date
  '"Event type"': AuditLogEvent
  '"Account creation date"': Date | null
  '"Last login date"': Date | null
  Description: unknown
  Delta: unknown
  Email: string | null
  Metadata: unknown
  Name: string | null
}

const getUsersRows = async (params: { siteId: number; monthYear: string }) => {
  const result = await getAuditLogQuery({
    ...params,
    type: "users",
  }).execute()
  return result as unknown as UsersQueryRow[]
}

const getEventsRows = async (params: { siteId: number; monthYear: string }) => {
  const result = await getAuditLogQuery({
    ...params,
    type: "events",
  }).execute()
  return result as unknown as EventsQueryRow[]
}

const insertAuditLog = async ({
  eventType,
  userId,
  siteId = null,
  delta,
  metadata = {},
  ipAddress = null,
  createdAt,
}: {
  eventType: AuditLogEvent
  userId: string
  siteId?: number | null
  delta: object
  metadata?: object
  ipAddress?: string | null
  createdAt?: Date
}) => {
  const baseValues = {
    eventType,
    userId,
    siteId,
    delta: jsonb(delta),
    metadata: jsonb(metadata),
    ipAddress,
  }
  const values =
    createdAt !== undefined ? { ...baseValues, createdAt } : baseValues
  return (
    db
      .insertInto("AuditLog")
      // oxlint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      .values(values as any)
      .returningAll()
      .executeTakeFirstOrThrow()
  )
}

// Group A: pure unit tests — no DB required
describe("getStringifiedValue", () => {
  it("returns empty string for null", () => {
    // Act
    const result = getStringifiedValue(null)

    // Assert
    expect(result).toBe("")
  })

  it("returns empty string for undefined", () => {
    // Act
    const result = getStringifiedValue(undefined)

    // Assert
    expect(result).toBe("")
  })

  it("returns ISO string for Date", () => {
    // Arrange
    const date = new Date("2025-01-15T10:00:00.000Z")

    // Act
    const result = getStringifiedValue(date)

    // Assert
    expect(result).toBe("2025-01-15T10:00:00.000Z")
  })

  it("returns the string as-is", () => {
    // Act
    const result = getStringifiedValue("hello")

    // Assert
    expect(result).toBe("hello")
  })

  it("returns empty string for empty string (not confused with null)", () => {
    // Act
    const result = getStringifiedValue("")

    // Assert
    expect(result).toBe("")
  })

  it("returns '0' for zero (falsy number is not dropped)", () => {
    // Act
    const result = getStringifiedValue(0)

    // Assert
    expect(result).toBe("0")
  })

  it("returns 'false' for boolean false", () => {
    // Act
    const result = getStringifiedValue(false)

    // Assert
    expect(result).toBe("false")
  })

  it("returns JSON-stringified object", () => {
    // Act
    const result = getStringifiedValue({ a: 1 })

    // Assert
    expect(result).toBe('{"a":1}')
  })

  it("returns JSON-stringified array", () => {
    // Act
    const result = getStringifiedValue([1, 2])

    // Assert
    expect(result).toBe("[1,2]")
  })

  it("returns JSON-stringified nested delta shape", () => {
    // Arrange
    const delta = { before: { email: "a@b.com" }, after: null }

    // Act
    const result = getStringifiedValue(delta)

    // Assert
    expect(result).toBe('{"before":{"email":"a@b.com"},"after":null}')
  })
})

// Groups B–G: integration tests requiring a real DB
describe("getAuditLogQuery", () => {
  let siteId: number
  let user: Awaited<ReturnType<typeof setupUser>>

  beforeEach(async () => {
    await resetTables(
      "AuditLog",
      "ResourcePermission",
      "User",
      "Site",
      "Navbar",
      "Footer",
    )
    const { site } = await setupSite()
    siteId = site.id
    user = await setupUser({ email: "user@agency.gov.sg" })
    await setupAdminPermissions({ userId: user.id, siteId })
  })

  // Group B: users query
  describe("users query", () => {
    it("returns users with non-deleted permission with expected columns", async () => {
      // Act
      const rows = await getUsersRows({ siteId, monthYear: TEST_MONTH })

      // Assert
      expect(rows).toHaveLength(1)
      const row = rows[0]!
      expect(row.Email).toBe(user.email)
      expect(row.Role).toBe("Admin")
      expect('"Last login"' in row).toBe(true)
      expect('"Date added"' in row).toBe(true)
    })

    it("excludes @open.gov.sg emails", async () => {
      // Arrange
      const ogpUser = await setupUser({ email: "admin@open.gov.sg" })
      await setupAdminPermissions({ userId: ogpUser.id, siteId })

      // Act
      const rows = await getUsersRows({ siteId, monthYear: TEST_MONTH })

      // Assert
      const emails = rows.map((r) => r.Email)
      expect(emails).not.toContain("admin@open.gov.sg")
      expect(emails).toContain(user.email)
    })

    it("excludes soft-deleted permissions", async () => {
      // Arrange
      const deletedUser = await setupUser({ email: "deleted@agency.gov.sg" })
      await setupEditorPermissions({
        userId: deletedUser.id,
        siteId,
        isDeleted: true,
      })

      // Act
      const rows = await getUsersRows({ siteId, monthYear: TEST_MONTH })

      // Assert
      expect(rows.map((r) => r.Email)).not.toContain("deleted@agency.gov.sg")
    })

    it("excludes users permissioned on a different site", async () => {
      // Arrange
      const otherUser = await setupUser({ email: "other@agency.gov.sg" })
      const { site: otherSite } = await setupSite()
      await setupAdminPermissions({
        userId: otherUser.id,
        siteId: otherSite.id,
      })

      // Act
      const rows = await getUsersRows({ siteId, monthYear: TEST_MONTH })

      // Assert
      expect(rows.map((r) => r.Email)).not.toContain("other@agency.gov.sg")
    })

    it("ignores monthYear — users with lastLoginAt outside the month still appear", async () => {
      // Arrange
      const oldUser = await setupUser({
        email: "old@agency.gov.sg",
        lastLoginAt: new Date("2020-01-01"),
      })
      await setupAdminPermissions({ userId: oldUser.id, siteId })

      // Act
      const rows = await getUsersRows({ siteId, monthYear: TEST_MONTH })

      // Assert
      expect(rows.map((r) => r.Email)).toContain("old@agency.gov.sg")
    })
  })

  // Group C: events description rendering
  describe("events query — description rendering", () => {
    it("ResourceCreate: correct description", async () => {
      // Arrange
      await insertAuditLog({
        eventType: AuditLogEvent.ResourceCreate,
        userId: user.id,
        siteId,
        delta: {
          after: { resource: { title: "My Page", type: "Page", id: 5 } },
        },
        createdAt: MID_MONTH,
      })

      // Act
      const rows = await getEventsRows({ siteId, monthYear: TEST_MONTH })

      // Assert
      expect(rows[0]!.Description).toBe('"My Page" (Page 5) created')
    })

    it("ResourceUpdate ordinary: uses resource path from before", async () => {
      // Arrange
      await insertAuditLog({
        eventType: AuditLogEvent.ResourceUpdate,
        userId: user.id,
        siteId,
        delta: {
          before: { resource: { title: "T", type: "Page", id: 5 } },
          after: { resource: { title: "T2", type: "Page", id: 5 } },
        },
        createdAt: MID_MONTH,
      })

      // Act
      const rows = await getEventsRows({ siteId, monthYear: TEST_MONTH })

      // Assert
      expect(rows[0]!.Description).toBe('"T" (Page 5) updated')
    })

    it("ResourceUpdate special path: uses top-level title from before when present", async () => {
      // Arrange
      await insertAuditLog({
        eventType: AuditLogEvent.ResourceUpdate,
        userId: user.id,
        siteId,
        delta: {
          before: { title: "T", type: "Page", id: 5 },
          after: { title: "T2", type: "Page", id: 5 },
        },
        createdAt: MID_MONTH,
      })

      // Act
      const rows = await getEventsRows({ siteId, monthYear: TEST_MONTH })

      // Assert
      expect(rows[0]!.Description).toBe('"T" (Page 5) updated')
    })

    it("ResourceDelete: correct description", async () => {
      // Arrange
      await insertAuditLog({
        eventType: AuditLogEvent.ResourceDelete,
        userId: user.id,
        siteId,
        delta: { before: { title: "T", type: "Page", id: 5 } },
        createdAt: MID_MONTH,
      })

      // Act
      const rows = await getEventsRows({ siteId, monthYear: TEST_MONTH })

      // Assert
      expect(rows[0]!.Description).toBe('"T" (Page 5) deleted')
    })

    it("Publish ordinary: correct description with version number", async () => {
      // Arrange
      await insertAuditLog({
        eventType: AuditLogEvent.Publish,
        userId: user.id,
        siteId,
        delta: { before: { something: true }, after: { versionNum: 3 } },
        metadata: { title: "T", type: "Page", id: 5 },
        createdAt: MID_MONTH,
      })

      // Act
      const rows = await getEventsRows({ siteId, monthYear: TEST_MONTH })

      // Assert
      expect(rows[0]!.Description).toBe(
        '"T" (Page 5) published to Version No. 3',
      )
    })

    it("Publish special path: both before and after null returns 'Publish'", async () => {
      // Arrange
      await insertAuditLog({
        eventType: AuditLogEvent.Publish,
        userId: user.id,
        siteId,
        delta: { before: null, after: null },
        createdAt: MID_MONTH,
      })

      // Act
      const rows = await getEventsRows({ siteId, monthYear: TEST_MONTH })

      // Assert
      expect(rows[0]!.Description).toBe("Publish")
    })

    it("NavbarUpdate: correct description", async () => {
      // Arrange
      await insertAuditLog({
        eventType: AuditLogEvent.NavbarUpdate,
        userId: user.id,
        siteId,
        delta: {},
        createdAt: MID_MONTH,
      })

      // Act
      const rows = await getEventsRows({ siteId, monthYear: TEST_MONTH })

      // Assert
      expect(rows[0]!.Description).toBe("Navbar has been updated")
    })

    it("FooterUpdate: correct description", async () => {
      // Arrange
      await insertAuditLog({
        eventType: AuditLogEvent.FooterUpdate,
        userId: user.id,
        siteId,
        delta: {},
        createdAt: MID_MONTH,
      })

      // Act
      const rows = await getEventsRows({ siteId, monthYear: TEST_MONTH })

      // Assert
      expect(rows[0]!.Description).toBe("Footer has been updated")
    })

    it("SiteConfigUpdate: correct description", async () => {
      // Arrange
      await insertAuditLog({
        eventType: AuditLogEvent.SiteConfigUpdate,
        userId: user.id,
        siteId,
        delta: {},
        createdAt: MID_MONTH,
      })

      // Act
      const rows = await getEventsRows({ siteId, monthYear: TEST_MONTH })

      // Assert
      expect(rows[0]!.Description).toBe("Site configuration has been updated")
    })

    it("PermissionCreate: resolves target user email via left join", async () => {
      // Arrange
      const targetUser = await setupUser({ email: "target@agency.gov.sg" })
      await insertAuditLog({
        eventType: AuditLogEvent.PermissionCreate,
        userId: user.id,
        siteId,
        delta: { after: { userId: targetUser.id, role: "Admin" } },
        createdAt: MID_MONTH,
      })

      // Act
      const rows = await getEventsRows({ siteId, monthYear: TEST_MONTH })

      // Assert
      expect(rows[0]!.Description).toBe(
        "Permission (Admin) granted to target@agency.gov.sg",
      )
    })

    it("PermissionDelete: resolves target user email via left join", async () => {
      // Arrange
      const targetUser = await setupUser({ email: "target@agency.gov.sg" })
      await insertAuditLog({
        eventType: AuditLogEvent.PermissionDelete,
        userId: user.id,
        siteId,
        delta: {
          before: { userId: targetUser.id, role: "Editor" },
          after: { userId: targetUser.id },
        },
        createdAt: MID_MONTH,
      })

      // Act
      const rows = await getEventsRows({ siteId, monthYear: TEST_MONTH })

      // Assert
      expect(rows[0]!.Description).toBe(
        "Permission (Editor) revoked from target@agency.gov.sg",
      )
    })

    it("Login: extracts email and IP from identifier field", async () => {
      // Arrange
      await insertAuditLog({
        eventType: AuditLogEvent.Login,
        userId: user.id,
        siteId: null,
        delta: {
          before: { identifier: "user@agency.gov.sg|203.0.113.1" },
          after: null,
        },
        createdAt: MID_MONTH,
      })

      // Act
      const rows = await getEventsRows({ siteId, monthYear: TEST_MONTH })

      // Assert
      const row = rows.find((r) => r['"Event type"'] === AuditLogEvent.Login)
      expect(row!.Description).toBe(
        "Login attempt by user@agency.gov.sg from IP address 203.0.113.1",
      )
    })

    it("Logout: extracts email from delta.before and IP from ipAddress column", async () => {
      // Arrange
      await insertAuditLog({
        eventType: AuditLogEvent.Logout,
        userId: user.id,
        siteId: null,
        delta: { before: { email: "user@agency.gov.sg" }, after: null },
        ipAddress: "1.2.3.4",
        createdAt: MID_MONTH,
      })

      // Act
      const rows = await getEventsRows({ siteId, monthYear: TEST_MONTH })

      // Assert
      const row = rows.find((r) => r['"Event type"'] === AuditLogEvent.Logout)
      expect(row!.Description).toBe(
        "Logout attempt by user@agency.gov.sg from IP address 1.2.3.4",
      )
    })
  })

  // Group D: events filtering / inclusion logic
  describe("events filtering / inclusion", () => {
    it("displayable event with al.siteId matching is included", async () => {
      // Arrange
      await insertAuditLog({
        eventType: AuditLogEvent.NavbarUpdate,
        userId: user.id,
        siteId,
        delta: {},
        createdAt: MID_MONTH,
      })

      // Act
      const rows = await getEventsRows({ siteId, monthYear: TEST_MONTH })

      // Assert
      expect(rows).toHaveLength(1)
    })

    it("displayable event with delta.after.siteId matching but different al.siteId is included", async () => {
      // Arrange
      const { site: otherSite } = await setupSite()
      await insertAuditLog({
        eventType: AuditLogEvent.NavbarUpdate,
        userId: user.id,
        siteId: otherSite.id,
        delta: { after: { siteId } },
        createdAt: MID_MONTH,
      })

      // Act
      const rows = await getEventsRows({ siteId, monthYear: TEST_MONTH })

      // Assert
      expect(rows).toHaveLength(1)
    })

    it("displayable event matching neither al.siteId nor delta.after.siteId is excluded", async () => {
      // Arrange
      const { site: otherSite } = await setupSite()
      await insertAuditLog({
        eventType: AuditLogEvent.NavbarUpdate,
        userId: user.id,
        siteId: otherSite.id,
        delta: {},
        createdAt: MID_MONTH,
      })

      // Act
      const rows = await getEventsRows({ siteId, monthYear: TEST_MONTH })

      // Assert
      expect(rows).toHaveLength(0)
    })

    it.each([
      AuditLogEvent.UserCreate,
      AuditLogEvent.UserUpdate,
      AuditLogEvent.UserDelete,
      AuditLogEvent.PermissionUpdate,
      AuditLogEvent.SchedulePublish,
      AuditLogEvent.CancelSchedulePublish,
    ])("excluded event type %s is not returned", async (eventType) => {
      // Arrange
      await insertAuditLog({
        eventType,
        userId: user.id,
        siteId,
        delta: {},
        createdAt: MID_MONTH,
      })

      // Act
      const rows = await getEventsRows({ siteId, monthYear: TEST_MONTH })

      // Assert
      expect(rows).toHaveLength(0)
    })

    it("Login by a site user email is included", async () => {
      // Arrange
      await insertAuditLog({
        eventType: AuditLogEvent.Login,
        userId: user.id,
        siteId: null,
        delta: {
          before: { identifier: `${user.email}|1.2.3.4` },
          after: null,
        },
        createdAt: MID_MONTH,
      })

      // Act
      const rows = await getEventsRows({ siteId, monthYear: TEST_MONTH })

      // Assert
      expect(rows).toHaveLength(1)
    })

    it("Login by email with no site association is excluded", async () => {
      // Arrange
      const nonSiteUser = await setupUser({ email: "nonsite@agency.gov.sg" })
      await insertAuditLog({
        eventType: AuditLogEvent.Login,
        userId: nonSiteUser.id,
        siteId: null,
        delta: {
          before: { identifier: "nonsite@agency.gov.sg|1.2.3.4" },
          after: null,
        },
        createdAt: MID_MONTH,
      })

      // Act
      const rows = await getEventsRows({ siteId, monthYear: TEST_MONTH })

      // Assert
      expect(rows).toHaveLength(0)
    })

    it("Login by user with in-month PermissionCreate is included", async () => {
      // Arrange
      await insertAuditLog({
        eventType: AuditLogEvent.PermissionCreate,
        userId: user.id,
        siteId,
        delta: { after: { userId: user.id, role: "Admin" } },
        createdAt: MID_MONTH,
      })
      await insertAuditLog({
        eventType: AuditLogEvent.Login,
        userId: user.id,
        siteId: null,
        delta: {
          before: { identifier: `${user.email}|1.2.3.4` },
          after: null,
        },
        createdAt: MID_MONTH,
      })

      // Act
      const rows = await getEventsRows({ siteId, monthYear: TEST_MONTH })

      // Assert
      const loginRow = rows.find(
        (r) => r['"Event type"'] === AuditLogEvent.Login,
      )
      expect(loginRow).toBeDefined()
    })
  })

  // Group E: Logout regression tests — validates the fix on this branch
  describe("logout regression tests", () => {
    it("regression: Logout by a site user with delta.before.email is included", async () => {
      // Arrange
      await insertAuditLog({
        eventType: AuditLogEvent.Logout,
        userId: user.id,
        siteId: null,
        delta: { before: { email: user.email }, after: null },
        ipAddress: "1.2.3.4",
        createdAt: MID_MONTH,
      })

      // Act
      const rows = await getEventsRows({ siteId, monthYear: TEST_MONTH })

      // Assert
      expect(rows).toHaveLength(1)
      expect(rows[0]!['"Event type"']).toBe(AuditLogEvent.Logout)
    })

    it("Logout by non-site email is excluded", async () => {
      // Arrange
      const nonSiteUser = await setupUser({ email: "nonsite@agency.gov.sg" })
      await insertAuditLog({
        eventType: AuditLogEvent.Logout,
        userId: nonSiteUser.id,
        siteId: null,
        delta: { before: { email: "nonsite@agency.gov.sg" }, after: null },
        ipAddress: "1.2.3.4",
        createdAt: MID_MONTH,
      })

      // Act
      const rows = await getEventsRows({ siteId, monthYear: TEST_MONTH })

      // Assert
      expect(rows).toHaveLength(0)
    })

    it("Logout by @open.gov.sg email is excluded", async () => {
      // Arrange
      const ogpUser = await setupUser({ email: "admin@open.gov.sg" })
      await setupAdminPermissions({ userId: ogpUser.id, siteId })
      await insertAuditLog({
        eventType: AuditLogEvent.Logout,
        userId: ogpUser.id,
        siteId: null,
        delta: { before: { email: "admin@open.gov.sg" }, after: null },
        ipAddress: "1.2.3.4",
        createdAt: MID_MONTH,
      })

      // Act
      const rows = await getEventsRows({ siteId, monthYear: TEST_MONTH })

      // Assert
      const logoutRow = rows.find(
        (r) => r['"Event type"'] === AuditLogEvent.Logout,
      )
      expect(logoutRow).toBeUndefined()
    })

    it("Logout by user with in-month PermissionCreate is included", async () => {
      // Arrange
      await insertAuditLog({
        eventType: AuditLogEvent.PermissionCreate,
        userId: user.id,
        siteId,
        delta: { after: { userId: user.id, role: "Admin" } },
        createdAt: MID_MONTH,
      })
      await insertAuditLog({
        eventType: AuditLogEvent.Logout,
        userId: user.id,
        siteId: null,
        delta: { before: { email: user.email }, after: null },
        ipAddress: "1.2.3.4",
        createdAt: MID_MONTH,
      })

      // Act
      const rows = await getEventsRows({ siteId, monthYear: TEST_MONTH })

      // Assert
      const logoutRow = rows.find(
        (r) => r['"Event type"'] === AuditLogEvent.Logout,
      )
      expect(logoutRow).toBeDefined()
    })

    it("Logout with null delta.before.email is excluded without crashing", async () => {
      // Arrange
      const nonSiteUser = await setupUser({ email: "ghost@agency.gov.sg" })
      await insertAuditLog({
        eventType: AuditLogEvent.Logout,
        userId: nonSiteUser.id,
        siteId: null,
        delta: { before: null, after: null },
        ipAddress: "1.2.3.4",
        createdAt: MID_MONTH,
      })

      // Act
      const rows = await getEventsRows({ siteId, monthYear: TEST_MONTH })

      // Assert
      const logoutRow = rows.find(
        (r) => r['"Event type"'] === AuditLogEvent.Logout,
      )
      expect(logoutRow).toBeUndefined()
    })
  })

  // Group F: date-range scoping
  describe("date-range scoping", () => {
    it("event at exactly startOfMonth is included", async () => {
      // Arrange
      await insertAuditLog({
        eventType: AuditLogEvent.NavbarUpdate,
        userId: user.id,
        siteId,
        delta: {},
        createdAt: MONTH_START,
      })

      // Act
      const rows = await getEventsRows({ siteId, monthYear: TEST_MONTH })

      // Assert
      expect(rows).toHaveLength(1)
    })

    it("event at exactly endOfMonth is included", async () => {
      // Arrange
      await insertAuditLog({
        eventType: AuditLogEvent.NavbarUpdate,
        userId: user.id,
        siteId,
        delta: {},
        createdAt: MONTH_END,
      })

      // Act
      const rows = await getEventsRows({ siteId, monthYear: TEST_MONTH })

      // Assert
      expect(rows).toHaveLength(1)
    })

    it("event one millisecond before startOfMonth is excluded", async () => {
      // Arrange
      await insertAuditLog({
        eventType: AuditLogEvent.NavbarUpdate,
        userId: user.id,
        siteId,
        delta: {},
        createdAt: addMilliseconds(MONTH_START, -1),
      })

      // Act
      const rows = await getEventsRows({ siteId, monthYear: TEST_MONTH })

      // Assert
      expect(rows).toHaveLength(0)
    })

    it("event one millisecond into next month is excluded", async () => {
      // Arrange
      await insertAuditLog({
        eventType: AuditLogEvent.NavbarUpdate,
        userId: user.id,
        siteId,
        delta: {},
        createdAt: addMilliseconds(MONTH_END, 1),
      })

      // Act
      const rows = await getEventsRows({ siteId, monthYear: TEST_MONTH })

      // Assert
      expect(rows).toHaveLength(0)
    })

    it("results are ordered by createdAt asc", async () => {
      // Arrange
      const t1 = new Date("2026-01-10T00:00:00.000Z")
      const t2 = new Date("2026-01-20T00:00:00.000Z")
      const t3 = new Date("2026-01-15T00:00:00.000Z")
      await insertAuditLog({
        eventType: AuditLogEvent.NavbarUpdate,
        userId: user.id,
        siteId,
        delta: {},
        createdAt: t1,
      })
      await insertAuditLog({
        eventType: AuditLogEvent.FooterUpdate,
        userId: user.id,
        siteId,
        delta: {},
        createdAt: t2,
      })
      await insertAuditLog({
        eventType: AuditLogEvent.SiteConfigUpdate,
        userId: user.id,
        siteId,
        delta: {},
        createdAt: t3,
      })

      // Act
      const rows = await getEventsRows({ siteId, monthYear: TEST_MONTH })

      // Assert
      expect(rows).toHaveLength(3)
      expect(rows[0]!['"Date and time"']).toEqual(t1)
      expect(rows[1]!['"Date and time"']).toEqual(t3)
      expect(rows[2]!['"Date and time"']).toEqual(t2)
    })

    it("PermissionCreate from a prior month does not widen Login allow-list for current month", async () => {
      // Arrange
      const priorUser = await setupUser({ email: "prior@agency.gov.sg" })
      const priorMid = new Date("2025-12-15T12:00:00.000Z")
      await insertAuditLog({
        eventType: AuditLogEvent.PermissionCreate,
        userId: user.id,
        siteId,
        delta: { after: { userId: priorUser.id, role: "Editor" } },
        createdAt: priorMid,
      })
      await insertAuditLog({
        eventType: AuditLogEvent.Login,
        userId: priorUser.id,
        siteId: null,
        delta: {
          before: { identifier: "prior@agency.gov.sg|1.2.3.4" },
          after: null,
        },
        createdAt: MID_MONTH,
      })

      // Act
      const rows = await getEventsRows({ siteId, monthYear: TEST_MONTH })

      // Assert
      const loginRow = rows.find(
        (r) => r['"Event type"'] === AuditLogEvent.Login,
      )
      expect(loginRow).toBeUndefined()
    })
  })

  // Group G: invalid / edge-case input
  describe("invalid / edge-case input", () => {
    it("throws for unknown type", () => {
      // Act
      const buildQuery = () =>
        getAuditLogQuery({
          siteId,
          // oxlint-disable-next-line @typescript-eslint/no-explicit-any
          type: "unknown" as any,
          monthYear: TEST_MONTH,
        })

      // Assert
      expect(buildQuery).toThrow("Unknown type: unknown")
    })

    it("malformed monthYear throws a database error (Invalid Date → invalid timestamp)", async () => {
      // Act
      const execute = () => getEventsRows({ siteId, monthYear: "garbage" })

      // Assert
      await expect(execute()).rejects.toThrow()
    })
  })
})
