import { TRPCError } from "@trpc/server"
import { isValidEmail } from "~/utils/email"
import { DB, db, Transaction } from "../database"

const normalise = (email: string) => {
  return email.toLowerCase().trim()
}

const getBaseQuery = (emails: string[], tx: Transaction<DB>) => {
  const dedupedEmails = Array.from(new Set(emails))
  if (dedupedEmails.length === 0) return

  return tx.insertInto("Whitelist").values(
    dedupedEmails.map((email) => ({
      email: normalise(email),
      expiry: null,
    })),
  )
}

const insertAdminEmails = async (emails: string[], tx: Transaction<DB>) => {
  let query = getBaseQuery(emails, tx)
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
  let query = getBaseQuery(emails, tx)
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
    await insertAdminEmails(adminEmails, tx)
    await insertVendorEmails(vendorEmails, vendorExpiry, tx)

    return {
      adminCount: adminEmails.length,
      vendorCount: vendorEmails.length,
    }
  })
}

export const isEmailWhitelisted = async (email: string) => {
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
    .where(({ eb }) =>
      eb.or([eb("expiry", "is", null), eb("expiry", ">", new Date())]),
    )
    .select(["id"])
    .executeTakeFirst()

  if (exactMatch) {
    return true
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
    .where(({ eb }) =>
      eb.or([eb("expiry", "is", null), eb("expiry", ">", new Date())]),
    )
    .select(["id"])
    .executeTakeFirst()

  if (domainMatch) {
    return true
  }

  // Step 3: Check if the suffix of the email domain is whitelisted
  const domainParts = emailDomain.split(".")
  for (let i = 1; i < domainParts.length; i++) {
    // Suffices should start with a dot (e.g. ".gov.sg")
    const suffix = `.${domainParts.slice(i).join(".")}`

    const suffixMatch = await db
      .selectFrom("Whitelist")
      .where("email", "=", suffix)
      .where(({ eb }) =>
        eb.or([eb("expiry", "is", null), eb("expiry", ">", new Date())]),
      )
      .select(["id"])
      .executeTakeFirst()

    if (suffixMatch) {
      return true
    }
  }

  return false
}
