import type { GetServerSidePropsContext, GetServerSidePropsResult } from "next"
import type { IsomerAdminRole } from "~prisma/generated/generatedEnums"
import { getIronSession } from "iron-session"
import { DASHBOARD } from "~/lib/routes"
import { type SessionData } from "~/lib/types/session"
import { generateSessionOptions } from "~/server/modules/auth/session"
import { isActiveIsomerAdmin } from "~/server/modules/permissions/permissions.service"

export interface GodModeAdminRoleProps {
  userGodModeRoles: IsomerAdminRole[]
}

export const requireGodModeAdmin = async (
  { req, res }: GetServerSidePropsContext,
  allowedRoles: readonly IsomerAdminRole[],
): Promise<GetServerSidePropsResult<GodModeAdminRoleProps>> => {
  const session = await getIronSession<SessionData>(
    req,
    res,
    generateSessionOptions(),
  )

  const userGodModeRoles: IsomerAdminRole[] = []

  if (session.userId) {
    const userId = session.userId
    const roles = await Promise.all(
      allowedRoles.map(async (role) =>
        (await isActiveIsomerAdmin(userId, [role])) ? role : null,
      ),
    )
    userGodModeRoles.push(
      ...roles.filter((role): role is IsomerAdminRole => role !== null),
    )
  }

  if (userGodModeRoles.length === 0) {
    return {
      redirect: {
        destination: DASHBOARD,
        permanent: false,
      },
    }
  }

  return {
    props: {
      userGodModeRoles,
    },
  }
}
