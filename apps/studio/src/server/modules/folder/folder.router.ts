import { protectedProcedure, router } from '~/server/trpc'
import { createFolderSchema } from '~/schemas/folder'

export const folderRouter = router({
  create: protectedProcedure
    .input(createFolderSchema)
    .mutation(async ({ ctx, input }) => {
      return { folderId: '' }
    }),
})
