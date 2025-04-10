import type { RequestOptions, ResponseOptions } from "node-mocks-http"
import { type NextApiRequest, type NextApiResponse } from "next"
import { nanoid } from "nanoid"
import { createMocks } from "node-mocks-http"
import {
  MOCK_STORY_DATE,
  MOCK_TEST_PHONE,
  MOCK_TEST_USER_NAME,
} from "tests/msw/constants"

import type { Context } from "~/server/context"
import type { User } from "~server/db"
import { type Session } from "~/lib/types/session"
import { createContextInner } from "~/server/context"
import { auth } from "./auth"
import { mockGrowthBook } from "./growthbook/mockInstance"

class MockIronStore {
  private static instance?: MockIronStore

  private saved: Record<string, string | object | number>

  private unsaved: Record<string, string | object | number>

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

  set(key: string, val: string | object | number) {
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

  const { req, res } = createMocks(
    {
      ...reqOptions,
      headers: {
        "content-type": "application/json", // will always be application/json
        ...reqOptions.headers,
      },
    },
    resOptions,
  )

  return {
    ...innerContext,
    req: req as unknown as NextApiRequest,
    res: res as unknown as NextApiResponse,
    gb: mockGrowthBook,
  }
}

export const applySession = () => {
  const store = MockIronStore.getOrCreateStore()

  const session = {
    set: store.set.bind(store),
    get: store.get.bind(store),
    unset: store.unset,
    // eslint-disable-next-line @typescript-eslint/require-await
    async save() {
      store.seal()
    },
    destroy() {
      store.clear()
    },
  } as unknown as Session

  return session
}

export const createTestUser = () => ({
  email: `test${nanoid()}@example.com`,
  name: MOCK_TEST_USER_NAME,
  createdAt: MOCK_STORY_DATE,
  updatedAt: MOCK_STORY_DATE,
  phone: MOCK_TEST_PHONE,
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
