import type { Expression, ExpressionBuilder, SqlBool } from "kysely"
import { TRPCError } from "@trpc/server"
import { isValidEmail } from "~/utils/email"

import type { DB, Transaction } from "../database"
import { db } from "../database"

type WhitelistExpiryFilter = (
  eb: ExpressionBuilder<DB, "Whitelist">,
) => Expression<SqlBool>

const normalise = (email: string) => {
  return email.toLowerCase().trim()
}

const getBaseQuery = (
  emails: string[],
  tx: Transaction<DB>,
  expiry: Date | null = null,
) => {
  const dedupedEmails = Array.from(new Set(emails))
  if (dedupedEmails.length === 0) return

  return tx.insertInto("Whitelist").values(
    dedupedEmails.map((email) => ({
      email: normalise(email),
      expiry,
    })),
  )
}

const insertAdminEmails = async (emails: string[], tx: Transaction<DB>) => {
  const query = getBaseQuery(emails, tx)
  if (!query) return

  return await query
    .onConflict((oc) =>
      // Always upgrade to admin (no expiry)
      oc.column("email").doUpdateSet({ expiry: null, updatedAt: new Date() }),
    )
    .execute()
}

const insertVendorEmails = async (
  emails: string[],
  expiry: Date,
  tx: Transaction<DB>,
) => {
  const query = getBaseQuery(emails, tx, expiry)
  if (!query) return

  return await query
    .onConflict((oc) =>
      // Only update expiry if existing record is a vendor (has expiry).
      // If existing record is admin (expiry is null), do nothing.
      oc
        .column("email")
        .doUpdateSet({ expiry, updatedAt: new Date() })
        .where("Whitelist.expiry", "is not", null),
    )
    .execute()
}

export const whitelistEmails = async ({
  adminEmails,
  vendorEmails,
}: {
  adminEmails: string[]
  vendorEmails: string[]
}) => {
  // Calculate vendor expiry (90 days from now)
  const vendorExpiry = new Date()
  vendorExpiry.setDate(vendorExpiry.getDate() + 90)
  vendorExpiry.setHours(0, 0, 0, 0)

  // Use transaction for bulk insert
  return db.transaction().execute(async (tx) => {
    // Batch insert admin emails (no expiry) and vendor emails (90 day expiry)
    const insertedAdmins = await insertAdminEmails(adminEmails, tx)
    const insertedVendors = await insertVendorEmails(
      vendorEmails,
      vendorExpiry,
      tx,
    )

    return {
      adminCount: Number(insertedAdmins?.[0]?.numInsertedOrUpdatedRows ?? 0),
      vendorCount: Number(insertedVendors?.[0]?.numInsertedOrUpdatedRows ?? 0),
    }
  })
}

// Walks the exact email -> domain -> domain suffix chain and returns the
// first Whitelist row matching `matchExpiry` at each step. The expiry
// condition must be applied per-step (not just on the final result): a
// closer match (e.g. an expired/temporary exact email) can shadow a further,
// still-valid match (e.g. a permanent domain grant) further down the chain,
// so we can't just fetch "the" match once and inspect its expiry after.
const findWhitelistMatch = async (
  email: string,
  matchExpiry: WhitelistExpiryFilter,
) => {
  const lowercaseEmail = email.toLowerCase()

  // Extra guard even if Zod validation has already checked
  if (!isValidEmail(lowercaseEmail)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Please sign in with a valid email address.",
    })
  }

  // Step 1: Check if the exact email address is whitelisted
  const exactMatch = await db
    .selectFrom("Whitelist")
    .where("email", "=", lowercaseEmail)
    .where(matchExpiry)
    .select(["id", "expiry"])
    .executeTakeFirst()

  if (exactMatch) {
    return exactMatch
  }

  // Step 2: Check if the exact email domain is whitelisted
  const emailParts = lowercaseEmail.split("@")
  if (emailParts.length !== 2) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Please sign in with a valid email address.",
    })
  }

  const emailDomain = `@${emailParts.pop()}`
  const domainMatch = await db
    .selectFrom("Whitelist")
    .where("email", "=", emailDomain)
    .where(matchExpiry)
    .select(["id", "expiry"])
    .executeTakeFirst()

  if (domainMatch) {
    return domainMatch
  }

  // Step 3: Check if the suffix of the email domain is whitelisted
  const domainParts = emailDomain.split(".")
  for (let i = 1; i < domainParts.length; i++) {
    // Suffices should start with a dot (e.g. ".gov.sg")
    const suffix = `.${domainParts.slice(i).join(".")}`

    const suffixMatch = await db
      .selectFrom("Whitelist")
      .where("email", "=", suffix)
      .where(matchExpiry)
      .select(["id", "expiry"])
      .executeTakeFirst()

    if (suffixMatch) {
      return suffixMatch
    }
  }

  return undefined
}

export const isEmailWhitelisted = async (email: string) => {
  const match = await findWhitelistMatch(email, ({ eb }) =>
    eb.or([eb("expiry", "is", null), eb("expiry", ">", new Date())]),
  )

  return !!match
}

// Whitelist entries with a NULL expiry are permanent grants (added via the
// "admin" textarea in godmode/whitelist), as opposed to temporary vendor
// grants which carry a 90-day expiry. Only permanent entries should count
// towards site Admin-role eligibility.
export const isEmailWhitelistedAdmin = async (email: string) => {
  const match = await findWhitelistMatch(email, ({ eb }) =>
    eb("expiry", "is", null),
  )

  return !!match
}
