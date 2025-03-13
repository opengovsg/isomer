import cuid2 from "@paralleldrive/cuid2"
import { TRPCError } from "@trpc/server"
import { PAST_AND_FORMER_ISOMER_MEMBERS_EMAILS } from "~prisma/constants"
import isEmail from "validator/lib/isEmail"

import type { DB, Transaction } from "../database"
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
  tx?: Transaction<DB> // allows for transaction to be passed in from parent transaction
}

export const createUserWithPermission = async ({
  email,
  name = "",
  phone = "",
  role = RoleType.Editor,
  siteId,
  tx,
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

  const executeInTransaction = async (tx: Transaction<DB>) => {
    const user = await tx
      .insertInto("User")
      .values({
        id: cuid2.createId(),
        email,
        name: name || email.split("@")[0] || "",
        phone,
      })
      .onConflict((oc) =>
        oc
          .columns(["email", "deletedAt"])
          .doUpdateSet((eb) => ({ email: eb.ref("excluded.email") })),
      )
      .returning(["id", "email", "name", "phone", "deletedAt"])
      .executeTakeFirstOrThrow()

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

  if (tx) {
    return await executeInTransaction(tx)
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
          PAST_AND_FORMER_ISOMER_MEMBERS_EMAILS,
        ),
    )
    .selectFrom("ActiveUser")
    .innerJoin(
      "ActiveResourcePermission",
      "ActiveUser.id",
      "ActiveResourcePermission.userId",
    )
}
