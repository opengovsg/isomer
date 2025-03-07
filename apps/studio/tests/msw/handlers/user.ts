import { RoleType } from "~prisma/generated/generatedEnums"

import { trpcMsw } from "../mockTrpc"

export const userHandlers = {
  count: {
    default: () =>
      trpcMsw.user.count.query(() => {
        return 5
      }),
    noUsers: () =>
      trpcMsw.user.count.query(() => {
        return 0
      }),
  },
  list: {
    users: () => {
      return trpcMsw.user.list.query(() => {
        return [
          {
            id: "1",
            name: "Admin User",
            email: "admin@example.com",
            role: RoleType.Admin,
            lastLoginAt: new Date(),
          },
          {
            id: "2",
            name: "Editor User",
            email: "editor@example.com",
            role: RoleType.Editor,
            lastLoginAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          },
          {
            id: "3",
            name: "Publisher User",
            email: "publisher@example.com",
            role: RoleType.Publisher,
            lastLoginAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
          },
          {
            id: "4",
            name: "User who last logged in 1 month ago",
            email: "last-login-1-month-ago@example.com",
            role: RoleType.Editor,
            lastLoginAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
          {
            id: "5",
            name: "User who last logged in 6 months ago",
            email: "last-login-6-months-ago@example.com",
            role: RoleType.Editor,
            lastLoginAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
          },
          {
            id: "6",
            name: "User who has never logged in",
            email: "never-logged-in@example.com",
            role: RoleType.Editor,
            lastLoginAt: null,
          },
        ]
      })
    },
    isomerAdmins: () => {
      return trpcMsw.user.list.query(() => {
        return [
          {
            id: "1",
            name: "Should not show action menu",
            email: "admin@open.gov.sg",
            role: RoleType.Admin,
            lastLoginAt: new Date(),
          },
        ]
      })
    },
    noUsers: () => {
      return trpcMsw.user.list.query(() => {
        return []
      })
    },
  },
  hasInactiveUsers: {
    true: () => {
      return trpcMsw.user.hasInactiveUsers.query(() => {
        return true
      })
    },
    false: () => {
      return trpcMsw.user.hasInactiveUsers.query(() => {
        return false
      })
    },
  },
  updateDetails: {
    success: () => {
      return trpcMsw.user.updateDetails.mutation(() => {
        return {
          name: "Test User",
          phone: "91234567",
        }
      })
    },
    loading: () => {
      return trpcMsw.user.updateDetails.mutation(() => {
        return new Promise(() => {
          // Never resolve to simulate infinite loading
        })
      })
    },
  },
  getPermissions: {
    admin: () => {
      return trpcMsw.user.getPermissions.query(() => {
        return [{ role: RoleType.Admin }]
      })
    },
    publisher: () => {
      return trpcMsw.user.getPermissions.query(() => {
        return [{ role: RoleType.Publisher }]
      })
    },
    editor: () => {
      return trpcMsw.user.getPermissions.query(() => {
        return [{ role: RoleType.Editor }]
      })
    },
  },
}
