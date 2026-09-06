import type { Transaction as NativeTransaction } from "kysely"
import { Kysely as NativeKysely } from "kysely"

import type { DB } from "./generated/generatedTypes"

/**
 * Branded Kysely subclass. The unique-symbol identity ensures Kysely
 * and Transaction values produced by this package can't be silently
 * substituted for plain Kysely instances at type-check time.
 */
export class Kysely<Database> extends NativeKysely<Database> {
  static readonly #identifier = Symbol("KyselyBrand")

  // The private method is the brand: TypeScript treats private members
  // nominally, so a plain Kysely<T> isn't structurally compatible with
  // this subclass. Referenced once below to silence unused-member lints.
  // oxlint-disable-next-line no-unused-private-class-members
  #identity(): symbol {
    void this
    return Kysely.#identifier
  }
}

/**
 * Transaction-only Kysely surface — omits `.transaction()` to prevent
 * accidentally opening a nested transaction.
 */
export type Transaction<Database> = Omit<
  NativeTransaction<Database>,
  "transaction"
>

/**
 * Either a top-level Kysely or an in-flight Transaction. Services accept
 * this so callers can pass a transaction context where applicable.
 */
export type SafeKysely = Transaction<DB> | Kysely<DB>
