import { beforeEach, describe, expect, it, vi } from "vitest"
import { getCurrentSingaporeMonth } from "~/schemas/audit"

// This file deliberately mocks the DB (unlike the sibling integration tests) so
// it can drive the ONE code path that a real-Postgres test cannot deterministic-
// ally reach: the race-loser. The in-flight fast-path SELECT and the partial
// unique index share the same predicate, so any row that would trip the index
// would also be seen by the SELECT — meaning the race-loser branch only runs
// when a concurrent ask slips in between our SELECT and INSERT. Duplicate asks
// are accepted IDEMPOTENTLY (ADR docs/adr/0005): losing that race must resolve
// to the winner's in-flight row, never to an error. The INSERT targets the
// partial unique index with ON CONFLICT DO NOTHING — a raised unique-violation
// would abort the whole Postgres transaction, so the losing insert instead
// returns NO ROW and the service selects the winner's row. Vitest isolates
// module mocks per test file, so mocking `../database` here does not affect
// the real-DB integration tests in audit.router.test.ts.
//
// It also pins the audit trail contract: every ask records one
// AuditLogExportCreate event in the same transaction, even when the ask was
// idempotent-accepted and nothing was inserted.

const { mockDb, mockValidatePermissions } = vi.hoisted(() => ({
  mockDb: { transaction: vi.fn() },
  mockValidatePermissions: vi.fn(),
}))

vi.mock("~/env.mjs", () => ({
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
vi.mock("../../database", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../database")>()),
  db: mockDb,
}))

vi.mock("../../permissions/permissions.service", () => ({
  validatePermissionsForManagingUsers: mockValidatePermissions,
}))

// Import after mocks are registered so the service binds to the mocked modules.
const { createAuditLogExportRequest } =
  await import("../auditLogExport.service")

const VALID_MONTH = getCurrentSingaporeMonth()

// The requesting user, as the service's in-transaction `User` lookup returns
// it (the actor of the AuditLogExportCreate event).
const FAKE_USER = { id: "user-1", email: "admin@vendor.com.sg" }

// One scripted outcome per AuditLogExportRequest INSERT the service issues,
// in order:
// - "inserted": the row is inserted and returned.
// - "conflict": the race was lost — ON CONFLICT DO NOTHING swallowed the
//   insert, so no row comes back (what Postgres does when a concurrent ask's
//   in-flight row already occupies the partial unique index).
// - "error": the insert rejects (any non-conflict DB failure).
type InsertStep =
  | { outcome: "inserted" }
  | { outcome: "conflict" }
  | { outcome: "error"; error: Error }

interface TxScript {
  // What each AuditLogExportRequest SELECT resolves with, in call order. The
  // service issues one fast-path SELECT per half, plus one winner SELECT per
  // race-losing insert — they consume this queue in sequence.
  selects?: (Record<string, unknown> | undefined)[]
  inserts?: InsertStep[]
}

// Build a fake Kysely transaction. AuditLogExportRequest SELECTs consume
// `script.selects`; AuditLogExportRequest INSERTs consume `script.inserts`
// (recording the `values` payload of successful inserts in `insertedValues`);
// the `User` SELECT always resolves with FAKE_USER; AuditLog INSERTs always
// succeed and record their payload in `auditLogValues`.
const makeTx = (script: TxScript) => {
  const insertedValues: Record<string, unknown>[] = []
  const auditLogValues: Record<string, unknown>[] = []
  let selectCall = 0
  let insertCall = 0

  const tx = {
    insertedValues,
    auditLogValues,
    selectFrom: (table: string) => ({
      where: function () {
        return this
      },
      select: function () {
        return this
      },
      selectAll: function () {
        return this
      },
      orderBy: function () {
        return this
      },
      executeTakeFirst: () => {
        if (table === "User") {
          return Promise.resolve(FAKE_USER)
        }
        const result = script.selects?.[selectCall]
        selectCall += 1
        return Promise.resolve(result)
      },
      executeTakeFirstOrThrow: async function () {
        const row: unknown = await this.executeTakeFirst()
        if (!row) {
          throw new Error(`No row returned from SELECT on ${table}`)
        }
        return row
      },
    }),
    insertInto: (table: string) => {
      let values: Record<string, unknown> = {}
      return {
        values: function (v: Record<string, unknown>) {
          values = v
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
        // AuditLogExportRequest inserts end with executeTakeFirst (no row on
        // a DO NOTHING conflict).
        executeTakeFirst: () => {
          if (table !== "AuditLogExportRequest") {
            return Promise.reject(
              new Error(`Unexpected executeTakeFirst INSERT into ${table}`),
            )
          }
          const step = script.inserts?.[insertCall]
          insertCall += 1
          if (!step) {
            return Promise.reject(
              new Error(`Unexpected INSERT #${insertCall} (not scripted)`),
            )
          }
          if (step.outcome === "error") {
            return Promise.reject(step.error)
          }
          if (step.outcome === "conflict") {
            return Promise.resolve(undefined)
          }
          insertedValues.push(values)
          return Promise.resolve({ id: `row-${insertCall}`, ...values })
        },
        // AuditLog inserts end with execute().
        execute: () => {
          if (table !== "AuditLog") {
            return Promise.reject(
              new Error(`Unexpected execute() INSERT into ${table}`),
            )
          }
          auditLogValues.push(values)
          return Promise.resolve([])
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
  tx: ReturnType<typeof makeTx>,
  expectedReportType: string,
  ipAddress?: string,
) => {
  expect(tx.auditLogValues).toHaveLength(1)
  const [value] = tx.auditLogValues
  expect(value).toMatchObject({
    eventType: "AuditLogExportCreate",
    userId: FAKE_USER.id,
    siteId: 1,
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

describe("createAuditLogExportRequest — idempotent accept", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockValidatePermissions.mockResolvedValue(undefined)
  })

  it("resolves a race-losing insert to the winner's in-flight row (returned, not thrown)", async () => {
    // Arrange: the fast-path SELECT sees no in-flight row, the INSERT loses
    // the race (ON CONFLICT DO NOTHING → no row), and the follow-up SELECT
    // finds the winner's now-visible in-flight row.
    const winnerRow = { id: "winner-row", reportType: "Access" }
    const tx = makeTx({
      selects: [undefined, winnerRow],
      inserts: [{ outcome: "conflict" }],
    })
    useTx(tx)

    // Act
    const result = await createAuditLogExportRequest({
      siteId: 1,
      userId: "user-1",
      month: VALID_MONTH,
      reportType: "Access",
      ip: "203.0.113.7",
    })

    // Assert: the caller gets the winner's row as a plain success; nothing of
    // ours was inserted, and the ask is still recorded as an event carrying the
    // requester IP.
    expect(result).toEqual([winnerRow])
    expect(tx.insertedValues).toHaveLength(0)
    expectExportCreateEvent(tx, "Access", "203.0.113.7")
  })

  it("re-throws a non-conflict INSERT error unchanged", async () => {
    // Arrange: a genuine DB error must not be masked as an idempotent accept.
    const otherError = new Error("connection reset")
    const tx = makeTx({
      selects: [undefined],
      inserts: [{ outcome: "error", error: otherError }],
    })
    useTx(tx)

    // Act
    const result = createAuditLogExportRequest({
      siteId: 1,
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
    const existingRow = { id: "existing-row", reportType: "Activity" }
    const tx = makeTx({ selects: [existingRow], inserts: [] })
    useTx(tx)

    // Act
    const result = await createAuditLogExportRequest({
      siteId: 1,
      userId: "user-1",
      month: VALID_MONTH,
      reportType: "Activity",
    })

    // Assert: the existing row is returned, no INSERT was ever issued, and —
    // crucially — the pure idempotent-accept still records the ask's event.
    expect(result).toEqual([existingRow])
    expect(tx.insertedValues).toHaveLength(0)
    expectExportCreateEvent(tx, "Activity")
  })
})
