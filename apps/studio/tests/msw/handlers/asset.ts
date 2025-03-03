import { trpcMsw } from "../mockTrpc"

export const assetHandler = {
  getPresignedPutUrl: {
    default: () => {
      return trpcMsw.asset.getPresignedPutUrl.mutation(() => {
        return {
          fileKey: "MOCK_STORYBOOK_ASSET",
          presignedPutUrl: "/storybook/upload",
        }
      })
    },
  },
}
