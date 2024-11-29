import { db, RoleType } from "~/server/modules/database"

export const updateUserPermissions = async (siteId: number, role: RoleType) => {
  await db.transaction().execute(async (tx) => {
    const perms = await tx
      .selectFrom("ResourcePermission")
      .where("siteId", "=", siteId)
      .selectAll()
      .execute()

    perms.map(async (perm) => {
      return tx
        .updateTable("ResourcePermission")
        .set({
          role,
        })
        .where("id", "=", perm.id)
        .execute()
    })
  })
}

updateUserPermissions(0, RoleType.Editor)
