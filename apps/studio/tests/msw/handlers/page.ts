import type { DelayMode } from "msw"
import { delay } from "msw"

import { trpcMsw } from "../mockTrpc"

const pageListQuery = (wait?: DelayMode | number) => {
  return trpcMsw.page.list.query(async () => {
    if (wait !== undefined) {
      await delay(wait)
    }
    return [
      {
        id: "0001",
        name: "Test Page 1",
        permalink: "/",
        type: "page",
        status: "draft",
        lastEditUser: "user1@test.com",
        lastEditDate: new Date("2024-07-15T09:16:46.640Z"),
      },
      {
        id: "0002",
        name: "Test Page 2",
        permalink: "/testpage2",
        type: "page",
        status: "published",
        lastEditUser: "user2@test.com",
        lastEditDate: new Date("2024-06-15T09:16:46.640Z"),
      },
      {
        id: "0003",
        name: "Test Folder 1",
        permalink: "/testfolder1",
        type: "folder",
        status: "folder",
        lastEditUser: "folder",
        lastEditDate: "folder",
      },
      {
        id: "0004",
        name: "Test Folder 2",
        permalink: "/testfolder2",
        type: "folder",
        status: "folder",
        lastEditUser: "folder",
        lastEditDate: "folder",
      },
      {
        id: "0005",
        name: "Test Page 5",
        permalink: "/",
        type: "page",
        status: "draft",
        lastEditUser: "user1@test.com",
        lastEditDate: new Date("2024-07-15T09:16:46.640Z"),
      },
      {
        id: "0006",
        name: "Test Folder 6",
        permalink: "/testfolder6",
        type: "folder",
        status: "folder",
        lastEditUser: "folder",
        lastEditDate: "folder",
      },
      {
        id: "0007",
        name: "Test Page 7",
        permalink: "/testpage7",
        type: "page",
        status: "published",
        lastEditUser: "user7@test.com",
        lastEditDate: new Date("2024-06-15T09:16:46.640Z"),
      },
      {
        id: "0008",
        name: "Test Folder 8",
        permalink: "/testfolder8",
        type: "folder",
        status: "folder",
        lastEditUser: "folder",
        lastEditDate: "folder",
      },
      {
        id: "0009",
        name: "Test Folder 9",
        permalink: "/testfolder9",
        type: "folder",
        status: "folder",
        lastEditUser: "folder",
        lastEditDate: "folder",
      },
      {
        id: "0010",
        name: "Test Page 10",
        permalink: "/testpage10",
        type: "page",
        status: "published",
        lastEditUser: "user2@test.com",
        lastEditDate: new Date("2024-06-15T09:16:46.640Z"),
      },
      {
        id: "0011",
        name: "Test Folder 11",
        permalink: "/testfolder11",
        type: "folder",
        status: "folder",
        lastEditUser: "folder",
        lastEditDate: "folder",
      },
      {
        id: "0012",
        name: "Test Page 12",
        permalink: "/testpage12",
        type: "page",
        status: "draft",
        lastEditUser: "user1@test.com",
        lastEditDate: new Date("2024-07-15T09:16:46.640Z"),
      },
      {
        id: "0013",
        name: "Test Folder 13",
        permalink: "/testfolder13",
        type: "folder",
        status: "folder",
        lastEditUser: "folder",
        lastEditDate: "folder",
      },
    ]
  })
}

export const pageHandlers = {
  list: {
    default: pageListQuery,
    loading: () => pageListQuery("infinite"),
  },
}
