import type { RequestOptions, ResponseOptions } from "node-mocks-http"
import type { Context } from "~/server/context"
import type { User } from "~server/db"
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

type IronStoreValue = string | number | boolean | null | undefined

interface IronStoreData {
  [key: string]: IronStoreValue
}

class MockIronStore {
  private static instance?: MockIronStore

  private saved: IronStoreData

  private unsaved: IronStoreData

  private constructor() {
    this.saved = {}
    this.unsaved = {}
  }

  static getOrCreateStore(): MockIronStore {
    MockIronStore.instance ??= new MockIronStore()
    return MockIronStore.instance
  }

  get(key: string) {
    return this.unsaved[key] || undefined
  }

  set(key: string, val: IronStoreValue) {
    this.unsaved[key] = val
  }

  unset(key: string) {
    delete this.unsaved[key]
  }

  seal() {
    this.saved = { ...this.unsaved }
  }

  clear() {
    this.unsaved = {}
  }
}

export const createMockRequest = (
  session: Session,
  reqOptions: RequestOptions = { method: "GET" },
  resOptions?: ResponseOptions,
): Context => {
  const innerContext = createContextInner({ session })

  const mocks = createMocks(
    {
      ...reqOptions,
      headers: {
        "content-type": "application/json", // will always be application/json
        ...reqOptions.headers,
      },
    },
    resOptions,
  )
  // SAFETY: node-mocks-http createMocks returns compatible Next.js API types for tests.
  const { req, res } = mocks as { req: NextApiRequest; res: NextApiResponse }

  return {
    ...innerContext,
    req,
    res,
    gb: mockGrowthBook,
  }
}

export const applySession = () => {
  const store = MockIronStore.getOrCreateStore()

  const session = {
    set: store.set.bind(store),
    get: store.get.bind(store),
    unset: store.unset,
    // oxlint-disable-next-line @typescript-eslint/require-await
    async save() {
      store.seal()
    },
    destroy() {
      store.clear()
    },
    updateConfig() {
      // No-op in tests since we don't need to actually update config for tests
    },
  }
  // SAFETY: MockIronStore implements the subset of IronSession used in integration tests.
  return session as Session
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
  // SAFETY: auth() returns a user id compatible with the session userId branded type.
  session.userId = authedUser.id as typeof session.userId
  await session.save()
  return session
}
