import { TRPCError } from "@trpc/server"

import { db } from "../database"

export const isEmailWhitelisted = async (email: string) => {
  const lowercaseEmail = email.toLowerCase()

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
  if (emailParts.length !== 2 && !emailParts[1]) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "An invalid email was provided",
    })
  }

  const emailDomain = `@${emailParts[1]}`
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
