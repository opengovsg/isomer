import cuid2 from "@paralleldrive/cuid2"
import { TRPCError } from "@trpc/server"
import { ISOMER_ADMINS_AND_MIGRATORS_EMAILS } from "~prisma/constants"
import isEmail from "validator/lib/isEmail"

import type { SafeKysely } from "../database"
import type { AdminType } from "~/schemas/user"
import type { ResourcePermission, User } from "~prisma/generated/generatedTypes"
import { isGovEmail } from "~/utils/email"
import { db, RoleType } from "../database"
import { isEmailWhitelisted } from "../whitelist/whitelist.service"

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

export const validateEmailRoleCombination = ({
  email,
  role,
}: {
  email: string
  role: ResourcePermission["role"]
}) => {
  if (!isGovEmail(email) && role === RoleType.Admin) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        "Non-gov.sg emails cannot be added as admin. Select another role.",
    })
  }
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

  validateEmailRoleCombination({ email, role })

  const isWhitelisted = await isEmailWhitelisted(email)
  if (!isWhitelisted) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "There are non-gov.sg domains that need to be whitelisted.",
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
          .columns(["email", "deletedAt"])
          .doUpdateSet((eb) => ({ email: eb.ref("excluded.email") })),
      )
      .returning(["id", "email", "name", "phone", "deletedAt"])
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

interface GetUsersQueryProps {
  siteId: number
  adminType: AdminType
}

export const getUsersQuery = ({ siteId, adminType }: GetUsersQueryProps) => {
  return db
    .with("ActiveResourcePermission", (qb) =>
      qb
        .selectFrom("ResourcePermission")
        .where("deletedAt", "is", null)
        .where("siteId", "=", siteId)
        .selectAll(),
    )
    .with("ActiveUser", (qb) =>
      qb
        .selectFrom("User")
        .selectAll()
        .where("deletedAt", "is", null)
        .where(
          "email",
          adminType === "isomer" ? "in" : "not in",
          ISOMER_ADMINS_AND_MIGRATORS_EMAILS,
        ),
    )
    .selectFrom("ActiveUser")
    .innerJoin(
      "ActiveResourcePermission",
      "ActiveUser.id",
      "ActiveResourcePermission.userId",
    )
}
