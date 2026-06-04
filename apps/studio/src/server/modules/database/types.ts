import type { Transaction as NativeTransaction } from "kysely"
import { Kysely as NativeKysely } from "kysely"

import type { DB } from "@isomer/db"

/**
 * Generated DB schema types are owned by @isomer/db (emitted by prisma-kysely).
 * Do not edit packages/db/src/generated/* directly.
 */

export * from "@isomer/db"

export class Kysely<DB> extends NativeKysely<DB> {
  static readonly #identifier: unique symbol = Symbol()

  #identity(): symbol {
    return Kysely.#identifier
  }
}

/**
 * This type is used to represent a transaction-only object
 */
export type Transaction<DB> = Omit<NativeTransaction<DB>, "transaction">

/**
 * SafeKysely is a type that can be either a Kysely or a Transaction type
 */
export type SafeKysely = Transaction<DB> | Kysely<DB>
