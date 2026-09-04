import { beforeEach, describe, expect, it, vi } from "vitest"
import { getCurrentSingaporeMonth } from "~/schemas/audit"

// This file deliberately mocks the DB (unlike the sibling integration tests) so
// it can drive the ONE code path that a real-Postgres test cannot deterministic-
// ally reach: the race-loser. The in-flight fast-path SELECT and the partial
// unique index share the same predicate, so any row that would trip the index
// would also be seen by the SELECT — meaning the race-loser branch only runs
// when a concurrent ask slips in between our SELECT and INSERT. Duplicate asks
// are accepted IDEMPOTENTLY (ADR docs/adr/0005): losing that race must resolve
// to the winner's in-flight row, never to an error. The batch INSERT targets
// the partial unique index with ON CONFLICT DO NOTHING for every site in one
// statement — Postgres evaluates the conflict per row, so a losing site's row
// just comes back missing from the INSERT's RETURNING set (not a raised
// unique-violation aborting the whole statement), and the service selects the
// winner's row for exactly those sites. Vitest isolates module mocks per test
// file, so mocking `../database` here does not affect the real-DB integration
// tests in audit.router.test.ts.
//
// It also pins the audit trail contract: every ask records one
// AuditLogExportCreate event per site in the same transaction, even when the
// ask was idempotent-accepted and nothing was inserted for that site.

const { mockDb, mockValidatePermissions } = vi.hoisted(() => ({
  mockDb: { transaction: vi.fn<(...args: unknown[]) => unknown>(()) },
  mockValidatePermissions: vi.fn<(...args: unknown[]) => unknown>(()),
}))

vi.mock(import('~/env.mjs'), () => ({
  env: {
    // oxlint-disable-next-line node/no-process-env
    NODE_ENV: process.env.NODE_ENV ?? "test",
    // oxlint-disable-next-line node/no-process-env
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV ?? "test",
    S3_STUDIO_ASSETS_BUCKET_NAME: "test-audit-bucket",
  },
}))

// Keep the real database module (its `AuditLogEvent`, `sql`, types and utils
// are used across the audit module) and override only `db` with our fake.
vi.mock(import('../../database'), async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../database")>()),
  db: mockDb,
}))

vi.mock(import('../../permissions/permissions.service'), () => ({
  validatePermissionsForManagingUsers: mockValidatePermissions,
}))

// Import after mocks are registered so the service binds to the mocked modules.
const { createAuditLogExportRequestsForSites } =
  await import("../auditLogExport.service")

const VALID_MONTH = getCurrentSingaporeMonth()

// The requesting user, as the service's in-transaction `User` lookup returns
// it (the actor of the AuditLogExportCreate event).
const FAKE_USER = { id: "user-1", email: "admin@vendor.com.sg" }

// What the batch INSERT does with one row of its multi-row `values(...)`:
// - "inserted": the row comes back in the INSERT's RETURNING set.
// - "conflict": ON CONFLICT DO NOTHING swallowed this row (a concurrent ask's
//   in-flight row already occupies the partial unique index for this site) —
//   it simply does not appear in the returned rows.
// - "error": the whole INSERT statement rejects (a genuine, non-conflict DB
//   failure), matching Postgres aborting the statement.
type InsertOutcome =
  | { site: number; outcome: "inserted" | "conflict" }
  | { site: number; outcome: "error"; error: Error }

interface TxScript {
  // What each `AuditLogExportRequest` SELECT (`.execute()`) resolves with, in
  // call order: [0] is the fast-path existing-rows SELECT, [1] (if present)
  // is the race-loser SELECT.
  selects?: Record<string, unknown>[][]
  // One outcome per site in the batch INSERT's `values(...)` array, matched
  // by the `siteId` on each scripted outcome.
  inserts?: InsertOutcome[]
}

// Build a fake Kysely transaction driving `createAuditLogExportRequestsForSites`.
// `AuditLogExportRequest` SELECTs consume `script.selects` in order; the
// `AuditLogExportRequest` batch INSERT resolves per `script.inserts`
// (recording every attempted row in `insertedValues`, keyed by the ones that
// actually "inserted"); the `User` SELECT always resolves with FAKE_USER; the
// one `AuditLog` INSERT (a single multi-row statement covering every site,
// via `logAuditLogExportEvents`) always succeeds — its rows are flattened
// into `auditLogValues`, one entry per site, so assertions don't need to care
// whether it was one row or many.
const makeTx = (script: TxScript) => {
  const insertedValues: Record<string, unknown>[] = []
  const auditLogValues: Record<string, unknown>[] = []
  let selectCall = 0

  const tx = {
    insertedValues,
    auditLogValues,
    selectFrom: (table: string) => ({
      where: function () {
        return this
      },
      selectAll: function () {
        return this
      },
      execute: () => {
        if (table !== "AuditLogExportRequest") {
          return Promise.reject(
            new Error(`Unexpected execute() SELECT on ${table}`),
          )
        }
        const result = script.selects?.[selectCall] ?? []
        selectCall += 1
        return Promise.resolve(result)
      },
      executeTakeFirstOrThrow: () => {
        if (table === "User") {
          return Promise.resolve(FAKE_USER)
        }
        return Promise.reject(
          new Error(`Unexpected executeTakeFirstOrThrow SELECT on ${table}`),
        )
      },
    }),
    insertInto: (table: string) => {
      let payload: unknown
      return {
        values: function (v: unknown) {
          payload = v
          return this
        },
        onConflict: function (cb: (oc: Record<string, unknown>) => unknown) {
          // Exercise the conflict-target builder so a broken callback fails
          // loudly, without modelling the SQL it produces.
          const oc = {
            columns: function () {
              return this
            },
            where: function () {
              return this
            },
            doNothing: function () {
              return this
            },
          }
          cb(oc)
          return this
        },
        returningAll: function () {
          return this
        },
        execute: () => {
          if (table === "AuditLog") {
            const events = payload as
              | Record<string, unknown>
              | Record<string, unknown>[]
            auditLogValues.push(...(Array.isArray(events) ? events : [events]))
            return Promise.resolve([])
          }

          if (table !== "AuditLogExportRequest") {
            return Promise.reject(
              new Error(`Unexpected execute() INSERT into ${table}`),
            )
          }

          const rows = payload as { siteId: number }[]
          const outcomeBySite = new Map(
            (script.inserts ?? []).map((o) => [o.site, o]),
          )
          const errorOutcome = rows
            .map((row) => outcomeBySite.get(row.siteId))
            .find((o) => o?.outcome === "error")
          if (errorOutcome?.outcome === "error") {
            return Promise.reject(errorOutcome.error)
          }

          const returned = rows
            .filter(
              (row) => outcomeBySite.get(row.siteId)?.outcome !== "conflict",
            )
            .map((row, i) => {
              insertedValues.push(row)
              return { id: `row-${i}`, ...row }
            })
          return Promise.resolve(returned)
        },
      }
    },
  }
  return tx
}

// Wire `db.transaction().execute(cb)` to run the callback against `tx`. A
// throwing callback simply rejects — mirroring kysely, which rolls the
// transaction back (nothing committed) and re-surfaces the error.
const useTx = (tx: ReturnType<typeof makeTx>) => {
  mockDb.transaction.mockReturnValue({
    execute: (cb: (tx: unknown) => unknown) =>
      Promise.resolve().then(() => cb(tx)),
  })
}

// The AuditLogExportCreate event every ask must record. Shaped per the
// audit.service.ts pattern: actor = requesting user, delta.after carries the
// report type.
const expectExportCreateEvent = (
  value: Record<string, unknown> | undefined,
  expectedSiteId: number,
  expectedReportType: string,
  ipAddress?: string,
) => {
  expect(value).toMatchObject({
    eventType: "AuditLogExportCreate",
    userId: FAKE_USER.id,
    siteId: expectedSiteId,
    // The requester IP threaded from the router is recorded on the event,
    // matching sibling resource/permission/login events.
    ipAddress,
    delta: {
      before: null,
      after: { reportType: expectedReportType },
    },
  })
  const delta = value?.delta as { after: { auditLogDateRange: string } }
  expect(delta.after.auditLogDateRange).toMatch(
    /^\[\d{4}-\d{2}-\d{2},\d{4}-\d{2}-\d{2}\)$/,
  )
}

describe("createAuditLogExportRequestsForSites — idempotent accept", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockValidatePermissions.mockResolvedValue(undefined)
  })

  it("resolves a race-losing insert to the winner's in-flight row (returned, not thrown)", async () => {
    // Arrange: the fast-path SELECT sees no in-flight row, the INSERT loses
    // the race (ON CONFLICT DO NOTHING → no row), and the follow-up SELECT
    // finds the winner's now-visible in-flight row.
    const winnerRow = { id: "winner-row", siteId: 1, reportType: "Access" }
    const tx = makeTx({
      selects: [[], [winnerRow]],
      inserts: [{ site: 1, outcome: "conflict" }],
    })
    useTx(tx)

    // Act
    const result = await createAuditLogExportRequestsForSites({
      siteIds: [1],
      userId: "user-1",
      month: VALID_MONTH,
      reportType: "Access",
      ip: "203.0.113.7",
    })

    // Assert: the caller gets the winner's row as a plain success; nothing of
    // ours was inserted, and the ask is still recorded as an event carrying
    // the requester IP.
    expect(result).toStrictEqual([winnerRow])
    expect(tx.insertedValues).toHaveLength(0)
    expect(tx.auditLogValues).toHaveLength(1)
    expectExportCreateEvent(tx.auditLogValues[0], 1, "Access", "203.0.113.7")
  })

  it("resolves a race-losing insert to the winner's row even if it has already finished processing", async () => {
    // Arrange: the winner's row raced past Pending/Processing to Done between
    // our INSERT losing the conflict and the follow-up SELECT running (e.g. a
    // cron sweep claimed and finished it in that gap) — it must still be
    // picked up, not dropped for no longer being "in-flight". A stale Done row
    // from an earlier, unrelated duplicate ask for the same site/month/type is
    // also visible to that SELECT; the more recent `createdAt` disambiguates
    // the real race winner from it.
    const staleRow = {
      id: "stale-row",
      siteId: 1,
      reportType: "Access",
      createdAt: new Date("2026-01-01T00:00:00Z"),
    }
    const winnerRowNowDone = {
      id: "winner-row",
      siteId: 1,
      reportType: "Access",
      status: "Done",
      createdAt: new Date("2026-06-01T00:00:00Z"),
    }
    const tx = makeTx({
      selects: [[], [staleRow, winnerRowNowDone]],
      inserts: [{ site: 1, outcome: "conflict" }],
    })
    useTx(tx)

    // Act
    const result = await createAuditLogExportRequestsForSites({
      siteIds: [1],
      userId: "user-1",
      month: VALID_MONTH,
      reportType: "Access",
    })

    // Assert: the newer (winner's) row wins over the stale one, and it is
    // still recorded as accepted rather than silently dropped.
    expect(result).toStrictEqual([winnerRowNowDone])
    expect(tx.auditLogValues).toHaveLength(1)
    expectExportCreateEvent(tx.auditLogValues[0], 1, "Access")
  })

  it("re-throws a non-conflict INSERT error unchanged", async () => {
    // Arrange: a genuine DB error must not be masked as an idempotent accept.
    const otherError = new Error("connection reset")
    const tx = makeTx({
      selects: [[]],
      inserts: [{ site: 1, outcome: "error", error: otherError }],
    })
    useTx(tx)

    // Act
    const result = createAuditLogExportRequestsForSites({
      siteIds: [1],
      userId: "user-1",
      month: VALID_MONTH,
      reportType: "Access",
    })

    // Assert: surfaced as-is; the rejected transaction callback rolls the
    // whole transaction back, so no event insert survives either.
    await expect(result).rejects.toBe(otherError)
  })

  it("idempotent-accepts an in-flight duplicate from the fast-path SELECT without attempting any insert", async () => {
    // Arrange: the SELECT already sees an in-flight row for the same
    // (siteId, userId, range, reportType).
    const existingRow = {
      id: "existing-row",
      siteId: 1,
      reportType: "Activity",
    }
    const tx = makeTx({ selects: [[existingRow]] })
    useTx(tx)

    // Act
    const result = await createAuditLogExportRequestsForSites({
      siteIds: [1],
      userId: "user-1",
      month: VALID_MONTH,
      reportType: "Activity",
    })

    // Assert: the existing row is returned, no INSERT was ever issued, and —
    // crucially — the pure idempotent-accept still records the ask's event.
    expect(result).toStrictEqual([existingRow])
    expect(tx.insertedValues).toHaveLength(0)
    expect(tx.auditLogValues).toHaveLength(1)
    expectExportCreateEvent(tx.auditLogValues[0], 1, "Activity")
  })

  it("batches an allSites-style ask across multiple sites in one INSERT, mixing an idempotent-accept with a fresh insert", async () => {
    // Arrange: site 2 already has an in-flight ask (fast-path SELECT), site 1
    // does not and gets freshly inserted — both in the same batch statement.
    const existingRow = {
      id: "existing-row-2",
      siteId: 2,
      reportType: "Activity",
    }
    const tx = makeTx({
      selects: [[existingRow]],
      inserts: [{ site: 1, outcome: "inserted" }],
    })
    useTx(tx)

    // Act
    const result = await createAuditLogExportRequestsForSites({
      siteIds: [1, 2],
      userId: "user-1",
      month: VALID_MONTH,
      reportType: "Activity",
    })

    // Assert: one row per site, one INSERT row (only for site 1), one audit
    // event per site.
    expect(result).toHaveLength(2)
    expect(result).toStrictEqual(
      expect.arrayContaining([
        existingRow,
        expect.objectContaining({ siteId: 1 }),
      ]),
    )
    expect(tx.insertedValues).toHaveLength(1)
    expect(tx.insertedValues[0]).toMatchObject({ siteId: 1 })
    expect(tx.auditLogValues).toHaveLength(2)
    const siteIdsLogged = tx.auditLogValues.map((v) => v.siteId).sort()
    expect(siteIdsLogged).toStrictEqual([1, 2])
  })
})
