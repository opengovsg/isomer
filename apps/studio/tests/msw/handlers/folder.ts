import type { RouterOutput } from "~/utils/trpc"
import { trpcMsw } from "../mockTrpc"

export const folderHandlers = {
  getIndexpage: {
    default: () =>
      trpcMsw.folder.getIndexpage.query(() => ({
        title: "a folder",
        id: "1",
        draftBlobId: null,
      })),
  },
  getMetadata: {
    default: () =>
      trpcMsw.folder.getMetadata.query(
        () =>
          ({
            title: "a folder",
            permalink: "folder",
            parentId: "1",
          }) as RouterOutput["folder"]["getMetadata"],
      ),
  },
  listChildPages: {
    default: () =>
      trpcMsw.folder.listChildPages.query(() => ({
        childPages: [
          { id: "5", title: "sibling1", type: "Page", permalink: "tsx" },
          { id: "4", title: "sibling2", type: "Page", permalink: "tsc" },
        ],
      })),
  },
}
