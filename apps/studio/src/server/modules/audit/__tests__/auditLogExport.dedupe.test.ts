import { TRPCError } from "@trpc/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getCurrentSingaporeMonth } from "~/schemas/audit"

// This file deliberately mocks the DB (unlike the sibling integration tests) so
// it can drive the ONE code path that a real-Postgres test cannot deterministic-
// ally reach: the race-loser. The in-flight dedupe SELECT and the partial unique
// index share the same predicate, so any row that would trip the index would
// also be seen by the SELECT — meaning the INSERT's unique-violation catch is
// only exercised when a concurrent request slips in between our SELECT and
// INSERT. We simulate exactly that: SELECT returns "no in-flight row", then an
// INSERT throws a Postgres unique-violation (23505), as the DB would under a
// true race. Vitest isolates module mocks per test file, so mocking `../database`
// here does not affect the real-DB integration tests in audit.router.test.ts.
//
// It also pins the `Both` fan-out contract: TWO inserts (Access + Activity)
// issued through the SAME transaction, and a rethrow out of the transaction
// callback when any of them loses the race (kysely rolls the transaction back
// on a rejected callback, so nothing is committed — all-or-nothing).

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

// A Postgres unique_violation, shaped like the `pg` driver's error (Error with a
// string `code`), which is what the partial unique index raises on the losing
// INSERT of a race.
const makeUniqueViolation = () => {
  const error = new Error(
    'duplicate key value violates unique constraint "AuditLogExportRequest_siteId_userId_dateRange_reportType_idx"',
  )
  ;(error as Error & { code: string }).code = "23505"
  return error
}

const VALID_MONTH = getCurrentSingaporeMonth()

const EXPECTED_CONFLICT = {
  code: "CONFLICT",
  message:
    "An export for this period and report type is already being generated",
}

// One scripted outcome per INSERT the service issues, in order.
type InsertStep = { ok: true } | { ok: false; error: Error }

interface TxScript {
  // What the in-flight fast-path SELECT resolves with (default: no row).
  existing?: { id: string }
  inserts?: InsertStep[]
}

// Build a fake Kysely transaction. The fast-path SELECT resolves with
// `script.existing`; each INSERT consumes the next entry of `script.inserts`
// and either resolves with a fake row (recording the `values` payload in
// `insertedValues`) or rejects with the scripted error.
const makeTx = (script: TxScript) => {
  const insertedValues: Record<string, unknown>[] = []
  let insertCall = 0
  const tx = {
    insertedValues,
    selectFrom: () => ({
      where: function () {
        return this
      },
      select: function () {
        return this
      },
      executeTakeFirst: () => Promise.resolve(script.existing),
    }),
    insertInto: () => {
      let values: Record<string, unknown> = {}
      return {
        values: function (v: Record<string, unknown>) {
          values = v
          return this
        },
        returningAll: function () {
          return this
        },
        executeTakeFirstOrThrow: () => {
          const step = script.inserts?.[insertCall]
          insertCall += 1
          if (!step) {
            return Promise.reject(
              new Error(`Unexpected INSERT #${insertCall} (not scripted)`),
            )
          }
          if (!step.ok) {
            return Promise.reject(step.error)
          }
          insertedValues.push(values)
          return Promise.resolve({ id: `row-${insertCall}`, ...values })
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

describe("createAuditLogExportRequest — atomic dedupe + fan-out", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockValidatePermissions.mockResolvedValue(undefined)
  })

  it("re-throws a Postgres unique-violation from the INSERT as CONFLICT (not a 500)", async () => {
    // Arrange: SELECT sees no in-flight row, but the INSERT loses the race and
    // the partial unique index rejects it with 23505.
    useTx(makeTx({ inserts: [{ ok: false, error: makeUniqueViolation() }] }))

    // Act
    const result = createAuditLogExportRequest({
      siteId: 1,
      userId: "user-1",
      month: VALID_MONTH,
      reportType: "Access",
    })

    // Assert: the caller gets the friendly CONFLICT, identical to the fast-path.
    await expect(result).rejects.toMatchObject(EXPECTED_CONFLICT)
    await expect(result).rejects.toBeInstanceOf(TRPCError)
  })

  it("re-throws a non-unique-violation INSERT error unchanged", async () => {
    // Arrange: a different DB error must not be masked as CONFLICT.
    const otherError = new Error("connection reset")
    useTx(makeTx({ inserts: [{ ok: false, error: otherError }] }))

    // Act
    const result = createAuditLogExportRequest({
      siteId: 1,
      userId: "user-1",
      month: VALID_MONTH,
      reportType: "Access",
    })

    // Assert: surfaced as-is, not swallowed by the unique-violation catch.
    await expect(result).rejects.toBe(otherError)
  })

  it("fans a Both request out into exactly two inserts (Access + Activity) in one transaction", async () => {
    // Arrange: both inserts succeed.
    const tx = makeTx({ inserts: [{ ok: true }, { ok: true }] })
    useTx(tx)

    // Act
    const result = await createAuditLogExportRequest({
      siteId: 1,
      userId: "user-1",
      month: VALID_MONTH,
      reportType: "Both",
    })

    // Assert: one transaction, two rows — one per concrete DB report type,
    // sharing the same (siteId, userId, auditLogDateRange).
    expect(mockDb.transaction).toHaveBeenCalledTimes(1)
    expect(tx.insertedValues).toHaveLength(2)
    expect(tx.insertedValues.map((v) => v.reportType)).toEqual([
      "Access",
      "Activity",
    ])
    for (const values of tx.insertedValues) {
      expect(values).toMatchObject({
        siteId: 1,
        userId: "user-1",
        status: "Pending",
        attempts: 0,
      })
      expect(values.auditLogDateRange).toMatch(
        /^\[\d{4}-\d{2}-\d{2},\d{4}-\d{2}-\d{2}\)$/,
      )
    }
    // The service returns every inserted row.
    expect(result).toHaveLength(2)
  })

  it("throws CONFLICT when the SECOND insert of a Both request hits 23505, rethrowing out of the transaction so nothing commits", async () => {
    // Arrange: the Access insert wins but the Activity insert loses a race
    // against a concurrent in-flight Activity request.
    const tx = makeTx({
      inserts: [{ ok: true }, { ok: false, error: makeUniqueViolation() }],
    })
    useTx(tx)

    // Act
    const result = createAuditLogExportRequest({
      siteId: 1,
      userId: "user-1",
      month: VALID_MONTH,
      reportType: "Both",
    })

    // Assert: the CONFLICT propagates out of the transaction callback — that
    // rethrow is what makes kysely roll back the already-issued Access insert
    // (all-or-nothing). Only the first insert ever succeeded in-transaction.
    await expect(result).rejects.toMatchObject(EXPECTED_CONFLICT)
    await expect(result).rejects.toBeInstanceOf(TRPCError)
    expect(tx.insertedValues).toHaveLength(1)
    expect(tx.insertedValues[0]).toMatchObject({ reportType: "Access" })
  })

  it("throws CONFLICT from the fast-path SELECT for a single report type without attempting any insert", async () => {
    // Arrange: the SELECT already sees an in-flight row for the same
    // (siteId, userId, range, reportType).
    const tx = makeTx({ existing: { id: "existing-row" }, inserts: [] })
    useTx(tx)

    // Act
    const result = createAuditLogExportRequest({
      siteId: 1,
      userId: "user-1",
      month: VALID_MONTH,
      reportType: "Activity",
    })

    // Assert: friendly CONFLICT, and no INSERT was ever issued.
    await expect(result).rejects.toMatchObject(EXPECTED_CONFLICT)
    await expect(result).rejects.toBeInstanceOf(TRPCError)
    expect(tx.insertedValues).toHaveLength(0)
  })
})
