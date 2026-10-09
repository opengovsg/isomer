import type { RequestOptions, ResponseOptions } from "node-mocks-http"
import type { Context } from "~/server/context"
import type { User } from "~server/db"
import { sealData } from "iron-session"
import { nanoid } from "nanoid"
import { type NextApiRequest, type NextApiResponse } from "next"
import { createMocks } from "node-mocks-http"
import {
  MOCK_STORY_DATE,
  MOCK_TEST_PHONE,
  MOCK_TEST_USER_NAME,
  MOCK_TEST_UUID,
} from "tests/msw/constants"
import { type Session } from "~/lib/types/session"
import { createContextInner } from "~/server/context"

import { auth } from "./auth"
import { mockGrowthBook } from "./growthbook/mockInstance"

export const createMockRequest = (
  session: Session,
  reqOptions: RequestOptions = { method: "GET" },
  resOptions?: ResponseOptions,
): Context => {
  const innerContext = createContextInner({ session })

  const { req, res } = createMocks(
    {
      ...reqOptions,
      headers: {
        "content-type": "application/json", // will always be application/json
        ...reqOptions.headers,
      },
    },
    resOptions,
  ) as unknown as { req: NextApiRequest; res: NextApiResponse }

  return {
    ...innerContext,
    req,
    res,
    gb: mockGrowthBook,
  }
}

// Mirrors iron-session v9: `destroy()` is terminal (saving data afterwards
// throws) and `save()` runs the real seal, so non-JSON values like Date throw.
export const applySession = () => {
  const session = {} as Session
  let destroyed = false
  Object.defineProperties(session, {
    save: {
      value: async () => {
        if (destroyed) {
          if (Object.keys(session).length === 0) return
          throw new Error("Cannot save a destroyed session")
        }
        await sealData({ ...session }, { password: "x".repeat(32) })
      },
    },
    destroy: {
      value: () => {
        destroyed = true
        for (const key of Object.keys(session)) {
          delete (session as Record<string, unknown>)[key]
        }
      },
    },
    updateConfig: {
      // No-op in tests since we don't need to actually update config for tests
      value: () => undefined,
    },
  })
  return session
}

export const createTestUser = (): Omit<User, "id"> => ({
  email: `test${nanoid()}@example.com`,
  name: MOCK_TEST_USER_NAME,
  createdAt: MOCK_STORY_DATE,
  updatedAt: MOCK_STORY_DATE,
  phone: MOCK_TEST_PHONE,
  singpassUuid: MOCK_TEST_UUID,
  deletedAt: null,
  lastLoginAt: null,
})

// NOTE: The argument to this function was changed from
// `Partial<User>` to `User`
export const applyAuthedSession = async (user?: User) => {
  const authedUser = await auth(user ?? createTestUser())
  const session = applySession()
  session.userId = authedUser.id as typeof session.userId
  await session.save()
  return session
}
