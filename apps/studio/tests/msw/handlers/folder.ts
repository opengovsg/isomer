import { trpcMsw } from "../mockTrpc"

export const folderHandlers = {
  getMetadata: {
    default: () => {
      return trpcMsw.folder.getMetadata.query(() => {
        return {
          title: "a folder",
          permalink: "folder",
          parentId: "1",
        }
      })
    },
  },
  getIndexpage: {
    default: () => {
      return trpcMsw.folder.getIndexpage.query(() => {
        return {
          title: "a folder",
          id: "1",
          draftBlobId: null,
        }
      })
    },
  },
}
