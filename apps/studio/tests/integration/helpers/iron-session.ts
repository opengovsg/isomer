import type { RequestOptions, ResponseOptions } from "node-mocks-http"
import { type NextApiRequest, type NextApiResponse } from "next"
import { GrowthBook } from "@growthbook/growthbook"
import { type User } from "@prisma/client"
import { createMocks } from "node-mocks-http"

import type { Context } from "~/server/context"
import { env } from "~/env.mjs"
import { type Session } from "~/lib/types/session"
import { createContextInner } from "~/server/context"
import { auth } from "./auth"
import { mockGrowthBook } from "./growthbook/mockInstance"

class MockIronStore {
  private static instance: MockIronStore

  private saved: Record<string, string | object | number>

  private unsaved: Record<string, string | object | number>

  private constructor() {
    this.saved = {}
    this.unsaved = {}
  }

  static getOrCreateStore(): MockIronStore {
    if (!MockIronStore.instance) {
      MockIronStore.instance = new MockIronStore()
    }
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

// NOTE: The argument to this function was changed from
// `Partial<User>` to `User`
export const applyAuthedSession = async (user: User) => {
  const authedUser = await auth(user)
  const session = applySession()
  session.userId = authedUser.id
  await session.save()
  return session
}
