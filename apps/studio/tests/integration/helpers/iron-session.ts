import type { RequestOptions, ResponseOptions } from "node-mocks-http";
import { type NextApiRequest, type NextApiResponse } from "next";
import { type User } from "@prisma/client";
import { createMocks } from "node-mocks-http";

import type { Context } from "~/server/context";
import { type Session } from "~/lib/types/session";
import { createContextInner } from "~/server/context";
import { auth } from "./auth";

class MockIronStore {
  private static instance: MockIronStore;

  private saved: Record<string, string | object | number>;

  private unsaved: Record<string, string | object | number>;

  private constructor() {
    this.saved = {};
    this.unsaved = {};
  }

  static getOrCreateStore(): MockIronStore {
    if (!MockIronStore.instance) {
      MockIronStore.instance = new MockIronStore();
    }
    return MockIronStore.instance;
  }

  get(key: string) {
    return this.unsaved[key] || undefined;
  }

  set(key: string, val: string | object | number) {
    this.unsaved[key] = val;
  }

  unset(key: string) {
    delete this.unsaved[key];
  }

  seal() {
    this.saved = { ...this.unsaved };
  }

  clear() {
    this.unsaved = {};
  }
}

export const createMockRequest = async (
  session: Session,
  reqOptions: RequestOptions = { method: "GET" },
  resOptions?: ResponseOptions,
): Promise<Context> => {
  const innerContext = await createContextInner({ session });

  const { req, res } = createMocks(reqOptions, resOptions);

  return {
    ...innerContext,
    req: req as unknown as NextApiRequest,
    res: res as unknown as NextApiResponse,
  };
};

export const applySession = () => {
  const store = MockIronStore.getOrCreateStore();

  const session = {
    set: store.set.bind(store),
    get: store.get.bind(store),
    unset: store.unset,
    async save() {
      store.seal();
    },
    destroy() {
      store.clear();
    },
  } as unknown as Session;

  return session;
};

// NOTE: The argument to this function was changed from
// `Partial<User>` to `User`
export const applyAuthedSession = async (user: User) => {
  const authedUser = await auth(user);
  const session = applySession();
  session.userId = authedUser.id;
  await session.save();
  return session;
};
