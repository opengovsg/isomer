import type { User } from "@prisma/client"
import { TRPCError } from "@trpc/server"
import pick from "lodash/pick"
import { auth } from "tests/integration/helpers/auth"
import { resetTables } from "tests/integration/helpers/db"
import {
  applyAuthedSession,
  applySession,
  createMockRequest,
} from "tests/integration/helpers/iron-session"
import { setupUser } from "tests/integration/helpers/seed"

import { createCallerFactory } from "~/server/trpc"
import { meRouter } from "../me.router"

const createCaller = createCallerFactory(meRouter)

describe("me.router", async () => {
  let caller: ReturnType<typeof createCaller>
  let unauthedCaller: ReturnType<typeof createCaller>
  const session = await applyAuthedSession()
  let user: User

  beforeEach(async () => {
    await resetTables("User")
    caller = createCaller(createMockRequest(session))
    unauthedCaller = createCaller(createMockRequest(applySession()))
    user = await setupUser({
      userId: session.userId,
      email: "test@mock.com",
    })
    await auth(user)
  })

  describe("get", () => {
    it("should throw 401 if not logged in", async () => {
      // Act
      const result = unauthedCaller.get()

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should return 200", async () => {
      // Act
      const result = await caller.get()

      // Assert
      expect(result).toEqual({
        ...pick(user, ["id", "email", "name", "phone", "createdAt"]),
      })
    })
  })
})
