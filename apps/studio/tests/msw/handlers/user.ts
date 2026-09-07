/* oxlint-disable promise/avoid-new -- studio lint cleanup */
import { RoleType } from "~prisma/generated/generatedEnums"

import { trpcMsw } from "../mockTrpc"

export const userHandlers = {
  count: {
    default: () => trpcMsw.user.count.query(() => 5),
    noUsers: () => trpcMsw.user.count.query(() => 0),
  },
  create: {
    loading: () =>
      trpcMsw.user.create.mutation(
        async () =>
          await new Promise(() => {
            // Never resolve to simulate infinite loading
          }),
      ),
    success: ({ email }: { email: string }) =>
      trpcMsw.user.create.mutation(() => [
        {
          id: "1",
          email,
          role: RoleType.Admin,
        },
      ]),
  },
  delete: {
    loading: () =>
      trpcMsw.user.delete.mutation(
        async () =>
          await new Promise(() => {
            // Never resolve to simulate infinite loading
          }),
      ),
    success: () =>
      trpcMsw.user.delete.mutation(() => ({
        id: "1",
        email: "test@example.com",
      })),
  },
  getUser: {
    default: () =>
      trpcMsw.user.getUser.query(() => ({
        id: "1",
        name: "Test User",
        email: "test@example.com",
        role: RoleType.Admin,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      })),
  },
  isIsomerAdmin: {
    admin: () => trpcMsw.user.isIsomerAdmin.query(() => true),
    default: () => trpcMsw.user.isIsomerAdmin.query(() => false),
  },
  list: {
    isomerAdmins: () =>
      trpcMsw.user.list.query(() => [
        {
          id: "1",
          name: "Should not show action menu",
          email: "admin@open.gov.sg",
          role: RoleType.Admin,
          createdAt: new Date(),
          lastLoginAt: new Date(),
        },
      ]),
    noUsers: () => trpcMsw.user.list.query(() => []),
    removeUserModal: () =>
      trpcMsw.user.list.query(() => [
        {
          id: "2",
          name: "Admin User",
          email: "admin@example.com",
          role: RoleType.Admin,
          createdAt: new Date(),
          lastLoginAt: new Date(),
        },
      ]),
    users: () =>
      trpcMsw.user.list.query(() => [
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
          lastLoginAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          // 3 days ago
        },
        {
          id: "4",
          name: "Publisher User",
          email: "publisher@example.com",
          role: RoleType.Publisher,
          createdAt: new Date(),
          lastLoginAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          // 10 days ago
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
      ]),
  },
  update: {
    loading: () =>
      trpcMsw.user.update.mutation(
        async () =>
          await new Promise(() => {
            // Never resolve to simulate infinite loading
          }),
      ),
    success: () =>
      trpcMsw.user.update.mutation(() => ({
        id: "1",
        userId: "1",
        siteId: 1,
        role: RoleType.Admin,
      })),
  },
  updateDetails: {
    loading: () =>
      trpcMsw.user.updateDetails.mutation(
        async () =>
          await new Promise(() => {
            // Never resolve to simulate infinite loading
          }),
      ),
    success: () =>
      trpcMsw.user.updateDetails.mutation(() => ({
        name: "Test User",
        phone: "91234567",
      })),
  },
}
