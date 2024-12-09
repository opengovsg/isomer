import { db, RoleType } from "~/server/modules/database"

const updateUserPermissions = async (siteId: number, role: RoleType) => {
  await db.transaction().execute(async (tx) => {
    const perms = await tx
      .selectFrom("ResourcePermission")
      .where("siteId", "=", siteId)
      .selectAll()
      .execute()

    await Promise.all(
      perms.map(async (perm) => {
        return tx
          .updateTable("ResourcePermission")
          .set({
            role,
          })
          .where("id", "=", perm.id)
          .execute()
      }),
    )
  })
}

await updateUserPermissions(0, RoleType.Editor)
