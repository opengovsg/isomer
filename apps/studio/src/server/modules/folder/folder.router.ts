/* eslint-disable import/prefer-default-export */
import { protectedProcedure, router } from '~/server/trpc'
import { createFolderSchema, readFolderSchema } from '~/schemas/folder'

export const folderRouter = router({
  create: protectedProcedure
    .input(createFolderSchema)
    .mutation(async ({ ctx, input }) => {
      return { folderId: '' }
    }),
  readFolder: protectedProcedure
    .input(readFolderSchema)
    .query(async ({ ctx, input }) => {
      // Things that aren't working yet:
      // 0. Perm checking
      // 1. Last Edited user and time
      // 2. Page status(draft, published)

      const folderResult = await ctx.db
        .selectFrom('Resource')
        .select(['name', 'parentId'])
        .where('id', '=', input.resourceId)
        .executeTakeFirstOrThrow()
      const childrenResult = await ctx.db
        .selectFrom('Resource')
        .select(['id', 'name', 'blobId'])
        .where('parentId', '=', input.resourceId)
        .execute()
      const children = childrenResult.map((c) => {
        if (c.blobId) {
          return {
            id: c.id,
            name: c.name,
            type: 'page',
            lastEditDate: new Date(0),
            lastEditUser: 'Coming Soon',
            permalink: '/placeholder',
            status: 'published',
          }
        }
        return {
          id: c.id,
          name: c.name,
          type: 'folder',
          lastEditDate: 'folder',
          lastEditUser: 'Coming Soon',
          permalink: '/placeholder',
          status: 'folder',
        }
      })

      const { parentId } = folderResult
      const folderName = folderResult.name

      return {
        folderName,
        children,
        parentId,
      }
    }),
})
