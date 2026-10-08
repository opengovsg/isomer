import crypto from "crypto"
import { mkdir, writeFile } from "fs/promises"
import { sealData, unsealData } from "iron-session"
import path from "path"
import { LOGGED_IN_KEY } from "~/constants/localStorage"
import { type SessionData } from "~/lib/types/session"
import {
  generateSessionOptions,
  getIronPassword,
} from "~/server/modules/auth/session"
import { db } from "~/server/modules/database"

import { storageStateFor, TEST_EMAILS, type Role } from "./auth"

/** Matches post–Singpass-callback session TTL in `singpass.router.ts`. */
export const E2E_SESSION_TTL_HOURS = 12

export const setSingpassUuidFor = async (email: string, uuid: string) => {
  await db
    .updateTable("User")
    .set({ singpassUuid: uuid, name: "test-e2e", phone: "82345678" })
    .where("email", "=", email)
    .execute()
}

export const sealSessionCookieValue = async (
  userId: string,
  ttlInHours = E2E_SESSION_TTL_HOURS,
): Promise<string> => {
  const options = generateSessionOptions({ ttlInHours })
  return sealData(
    { userId: userId as SessionData["userId"] },
    { password: options.password, ttl: options.ttl },
  )
}

export const unsealSessionCookieValue = async (
  cookieValue: string,
  ttlInHours = E2E_SESSION_TTL_HOURS,
) =>
  unsealData<{ userId?: string }>(cookieValue, {
    password: getIronPassword(),
    ttl: generateSessionOptions({ ttlInHours }).ttl,
  })

export const buildPlaywrightStorageState = (
  baseURL: string,
  sessionCookieValue: string,
  ttlInHours = E2E_SESSION_TTL_HOURS,
) => {
  const url = new URL(baseURL)
  const expires = Math.floor(Date.now() / 1000) + ttlInHours * 60 * 60

  return {
    cookies: [
      {
        name: "auth.session-token",
        value: sessionCookieValue,
        domain: url.hostname,
        path: "/",
        expires,
        httpOnly: true,
        secure: url.protocol === "https:",
        sameSite: "Lax" as const,
      },
    ],
    origins: [
      {
        origin: url.origin,
        localStorage: [{ name: LOGGED_IN_KEY, value: "true" }],
      },
    ],
  }
}

export const mintStorageStateForRole = async ({
  role,
  baseURL,
}: {
  role: Role
  baseURL: string
}) => {
  const email = TEST_EMAILS[role]
  const uuid = crypto.randomUUID()
  await setSingpassUuidFor(email, uuid)

  const user = await db
    .selectFrom("User")
    .select("id")
    .where("email", "=", email)
    .executeTakeFirst()

  if (!user) {
    throw new Error(
      `mintStorageStateForRole: no user for role=${role} email=${email}`,
    )
  }

  const sessionCookieValue = await sealSessionCookieValue(user.id)
  const storageState = buildPlaywrightStorageState(baseURL, sessionCookieValue)
  const filePath = storageStateFor(role)
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, JSON.stringify(storageState, null, 2))
}
