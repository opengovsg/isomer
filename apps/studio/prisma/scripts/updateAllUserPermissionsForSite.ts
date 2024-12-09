import { db, RoleType } from "~/server/modules/database"

interface UpdateUserPermissionsProps {
  siteId: number
  role: RoleType
}
export const updateAllUserPermissionsForSite = async ({
  siteId,
  role,
}: UpdateUserPermissionsProps) => {
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

await updateAllUserPermissionsForSite({ siteId: -1, role: RoleType.Editor })
