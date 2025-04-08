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
            name: "Government Editor",
            email: "example_editor@isomer.gov.sg",
            role: RoleType.Editor,
            createdAt: new Date(),
            lastLoginAt: new Date(),
          },
          {
            id: "2",
            name: "Admin User",
            email: "admin@example.com",
            role: RoleType.Admin,
            createdAt: new Date(),
            lastLoginAt: new Date(),
          },
          {
            id: "3",
            name: "Editor User",
            email: "editor@example.com",
            role: RoleType.Editor,
            createdAt: new Date(),
            lastLoginAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          },
          {
            id: "4",
            name: "Publisher User",
            email: "publisher@example.com",
            role: RoleType.Publisher,
            createdAt: new Date(),
            lastLoginAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
          },
          {
            id: "5",
            name: "User who last logged in 1 month ago",
            email: "last-login-1-month-ago@example.com",
            role: RoleType.Editor,
            createdAt: new Date(),
            lastLoginAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
          {
            id: "6",
            name: "User who last logged in 6 months ago",
            email: "last-login-6-months-ago@example.com",
            role: RoleType.Editor,
            createdAt: new Date(),
            lastLoginAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
          },
          {
            id: "7",
            name: "User who has never logged in",
            email: "never-logged-in@example.com",
            role: RoleType.Editor,
            createdAt: new Date(),
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
            createdAt: new Date(),
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
    removeUserModal: () => {
      return trpcMsw.user.list.query(() => {
        return [
          {
            id: "2",
            name: "Admin User",
            email: "admin@example.com",
            role: RoleType.Admin,
            createdAt: new Date(),
            lastLoginAt: new Date(),
          },
        ]
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
  create: {
    success: ({ email }: { email: string }) => {
      return trpcMsw.user.create.mutation(() => {
        return [
          {
            id: "1",
            email,
            role: RoleType.Admin,
          },
        ]
      })
    },
    loading: () => {
      return trpcMsw.user.create.mutation(() => {
        return new Promise(() => {
          // Never resolve to simulate infinite loading
        })
      })
    },
  },
  update: {
    success: () => {
      return trpcMsw.user.update.mutation(() => {
        return {
          id: "1",
          userId: "1",
          siteId: 1,
          role: RoleType.Admin,
        }
      })
    },
    loading: () => {
      return trpcMsw.user.update.mutation(() => {
        return new Promise(() => {
          // Never resolve to simulate infinite loading
        })
      })
    },
  },
  getUser: {
    default: () => {
      return trpcMsw.user.getUser.query(() => {
        return {
          id: "1",
          name: "Test User",
          email: "test@example.com",
          role: RoleType.Admin,
          createdAt: new Date(),
          lastLoginAt: new Date(),
        }
      })
    },
  },
  delete: {
    success: () => {
      return trpcMsw.user.delete.mutation(() => {
        return {
          id: "1",
          email: "test@example.com",
        }
      })
    },
    loading: () => {
      return trpcMsw.user.delete.mutation(() => {
        return new Promise(() => {
          // Never resolve to simulate infinite loading
        })
      })
    },
  },
}
