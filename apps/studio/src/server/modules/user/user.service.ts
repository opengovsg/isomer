import cuid2 from "@paralleldrive/cuid2"
import { TRPCError } from "@trpc/server"
import isEmail from "validator/lib/isEmail"

import type { SafeKysely } from "../database"
import type { ResourcePermission, User } from "~prisma/generated/generatedTypes"
import { db, RoleType } from "../database"

export const isUserDeleted = async (email: string) => {
  const lowercaseEmail = email.toLowerCase()
  const user = await db
    .selectFrom("User")
    .where("email", "=", lowercaseEmail)
    .select(["deletedAt"])
    // Email is a unique field in User table
    .executeTakeFirst()

  return user?.deletedAt ? true : false
}

interface CreateUserProps {
  email: User["email"]
  name?: User["name"]
  phone?: User["phone"]
  role: ResourcePermission["role"]
  siteId: ResourcePermission["siteId"]
  trx?: SafeKysely // allows for transaction to be passed in from parent transaction
}

export const createUser = async ({
  email,
  name = "",
  phone = "",
  role = RoleType.Editor,
  siteId,
  trx,
}: CreateUserProps) => {
  if (!isEmail(email)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid email",
    })
  }

  const executeInTransaction = async (tx: SafeKysely) => {
    const user = await tx
      .insertInto("User")
      .values({
        id: cuid2.createId(),
        email,
        name,
        phone,
      })
      .onConflict((oc) =>
        oc
          .column("email")
          .doUpdateSet((eb) => ({ email: eb.ref("excluded.email") })),
      )
      .returning(["id", "email", "name", "phone"])
      .executeTakeFirstOrThrow()

    // unique constraint (@@unique([userId, siteId, resourceId, role]))
    // does not work if one column is NULL e.g. resourceId
    // Thus we have to check on the application layer
    const existingResourcePermission = await tx
      .selectFrom("ResourcePermission")
      .where("userId", "=", user.id)
      .where("siteId", "=", siteId)
      .where("resourceId", "is", null) // because we are granting site-wide permissions
      .selectAll()
      .executeTakeFirst()

    if (existingResourcePermission) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "User and permissions already exists",
      })
    }

    const resourcePermission = await tx
      .insertInto("ResourcePermission")
      .values({
        userId: user.id,
        siteId,
        role,
      })
      .returning(["userId", "siteId", "role"])
      .executeTakeFirstOrThrow()

    return {
      user,
      resourcePermission,
    }
  }

  if (trx) {
    return await executeInTransaction(trx)
  }

  return await db.transaction().execute(executeInTransaction)
}
