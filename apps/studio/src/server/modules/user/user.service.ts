import cuid2 from "@paralleldrive/cuid2"
import { TRPCError } from "@trpc/server"
import { PAST_AND_FORMER_ISOMER_MEMBERS_EMAILS } from "~prisma/constants"
import { AuditLogEvent } from "~prisma/generated/generatedEnums"
import isEmail from "validator/lib/isEmail"

import type { DB, Transaction } from "../database"
import type { SessionData } from "~/lib/types/session"
import type { AdminType } from "~/schemas/user"
import type { ResourcePermission, User } from "~prisma/generated/generatedTypes"
import { isGovEmail } from "~/utils/email"
import { logPermissionEvent, logUserEvent } from "../audit/audit.service"
import { db, RoleType } from "../database"
import { isEmailWhitelisted } from "../whitelist/whitelist.service"

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
  byUserId: User["id"]
  tx: Transaction<DB> // allows for transaction to be passed in from parent transaction
}

export const createUserWithPermission = async ({
  email,
  name = "",
  phone = "",
  role = RoleType.Editor,
  siteId,
  byUserId,
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

  const byUser = await db
    .selectFrom("User")
    .where("id", "=", byUserId)
    .selectAll()
    .executeTakeFirstOrThrow()

  const createUserInTransaction = async () => {
    const user = await tx
      .insertInto("User")
      .values({
        id: cuid2.createId(),
        email,
        name: name || email.split("@")[0] || "",
        phone,
      })
      .onConflict((oc) => oc.columns(["email"]).doNothing())
      .returningAll()
      .executeTakeFirst()

    // if user is defined, it means it's newly created and there's no conflict
    if (user) {
      await logUserEvent(tx, {
        eventType: AuditLogEvent.UserCreate,
        by: byUser,
        delta: { before: null, after: user },
      })
      return user
    }

    // if user is undefined, it means there's a conflict
    // Nothing happened but we need to return the existing user
    return await tx
      .selectFrom("User")
      .where("email", "=", email)
      .selectAll()
      .executeTakeFirstOrThrow()
  }

  const createPermissionInTransaction = async (userId: User["id"]) => {
    const resourcePermission = await tx
      .insertInto("ResourcePermission")
      .values({
        userId,
        siteId,
        role,
      })
      .onConflict((oc) =>
        oc.columns(["userId", "siteId", "resourceId"]).doNothing(),
      )
      .returningAll()
      .executeTakeFirst()

    if (!resourcePermission) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "User already has permission for this site",
      })
    }

    await logPermissionEvent(tx, {
      eventType: AuditLogEvent.PermissionCreate,
      by: byUser,
      delta: { before: null, after: resourcePermission },
    })

    return resourcePermission
  }

  const user = await createUserInTransaction()
  const permission = await createPermissionInTransaction(user.id)
  return { user, resourcePermission: permission }
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
        .where("siteId", "=", siteId)
        .selectAll(),
    )
    .with("ActiveUser", (qb) =>
      qb
        .selectFrom("User")
        .selectAll()
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

interface DeleteUserPermissionProps {
  byUserId: NonNullable<SessionData["userId"]>
  userId: string
  siteId: number
}

// FYI this might be a performance bottleneck once we start having resource-level
// permissions. However, this is not a problem for the current use case because
// we only have site-level permissions.
export const deleteUserPermission = async ({
  byUserId,
  userId,
  siteId,
}: DeleteUserPermissionProps) => {
  // Putting outside the tx to reduce unnecessary extended DB locks
  const byUser = await db
    .selectFrom("User")
    .where("id", "=", byUserId)
    .selectAll()
    .executeTakeFirstOrThrow()

  await db.transaction().execute(async (tx) => {
    const deletedUserPermissions = await tx
      .deleteFrom("ResourcePermission")
      .where("userId", "=", userId)
      .where("siteId", "=", siteId)
      .returningAll()
      .execute()

    if (deletedUserPermissions.length === 0) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User permissions not found",
      })
    }

    for (const deletedUserPermission of deletedUserPermissions) {
      await logPermissionEvent(tx, {
        eventType: AuditLogEvent.PermissionDelete,
        by: byUser,
        delta: { before: deletedUserPermission, after: null },
      })
    }
  })
}

interface UpdateUserDetailsProps {
  userId: NonNullable<SessionData["userId"]>
  name?: string
  phone?: string
}

export const updateUserDetails = async ({
  userId,
  name,
  phone,
}: UpdateUserDetailsProps) => {
  if (userId !== userId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not allowed to update this user's details",
    })
  }

  return await db.transaction().execute(async (tx) => {
    const user = await tx
      .selectFrom("User")
      .where("id", "=", userId)
      .selectAll()
      .executeTakeFirstOrThrow()

    const updatedUser = await tx
      .updateTable("User")
      .where("id", "=", userId)
      .set({ name, phone })
      .returningAll()
      .executeTakeFirstOrThrow()

    await logUserEvent(tx, {
      eventType: AuditLogEvent.UserUpdate,
      by: user,
      delta: { before: user, after: updatedUser },
    })

    return updatedUser
  })
}
