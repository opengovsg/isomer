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
): Promise<GetServerSidePropsResult<Record<string, never>>> => {
  const session = await getIronSession<SessionData>(
    req,
    res,
    generateSessionOptions(),
  )

  const isUserGodModeAdmin =
    !!session.userId &&
    (await isActiveIsomerAdmin(session.userId, [...allowedRoles]))

  if (!isUserGodModeAdmin) {
    return {
      redirect: {
        destination: DASHBOARD,
        permanent: false,
      },
    }
  }

  return {
    props: {},
  }
}

export const requireGodModeAdminWithRoleProps = async (
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
    for (const role of allowedRoles) {
      if (await isActiveIsomerAdmin(session.userId, [role])) {
        userGodModeRoles.push(role)
      }
    }
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
