import { protectedProcedure, router } from '~/server/trpc'
import { createFolderSchema } from '~/schemas/folder'

export const folderRouter = router({
  create: protectedProcedure
    .input(createFolderSchema)
    .mutation(async ({ ctx, input }) => {
      return { folderId: '' }
    }),
})
import { readFolderOrTopLevelFolderSchema } from "~/schemas/folder";
import { protectedProcedure, router } from '~/server/trpc'


export const folderRouter = router({
    create: protectedProcedure
        .input(createFolderSchema)
        .mutation(async ({ ctx, input }) => {
          return { folderId: '' }
        }),
    readFolderOrTopLevelFolder: protectedProcedure.input(readFolderOrTopLevelFolderSchema).query(async ({ input, ctx }) => {     
        // TODO: Fill these in later
        const folderName: string = ""
        const children: {id: string, name: string, type: 'page' | 'folder'}[] = []
        // Not sure if a backpointer is needed here
        const parentId: string = ""
        return {
            folderName, children, parentId
        }
    })

})
