/* eslint-disable import/prefer-default-export */
import { protectedProcedure, router } from '~/server/trpc'
import {
  createFolderSchema,
  readFolderOrTopLevelFolderSchema,
} from '~/schemas/folder'

export const folderRouter = router({
  create: protectedProcedure
    .input(createFolderSchema)
    .mutation(async ({ ctx, input }) => {
      return { folderId: '' }
    }),
  readFolderOrTopLevelFolder: protectedProcedure
    .input(readFolderOrTopLevelFolderSchema)
    .query(async ({ ctx, input }) => {
      // Things that aren't working yet:
      // 0. Perm checking
      // 1. Last Edited user and time
      // 2. Page status(draft, published)

      let query = ctx.db
        .selectFrom('Resource')
        .select(['name', 'id', 'siteId', 'parentId'])
        .selectAll()
      if (input.resourceId) {
        query = query.where('id', '=', input.resourceId)
      } else {
        query = query
          .where('siteId', '=', input.siteId)
          .where('parentId', 'is', null)
      }

      const folderResult = await query
        .select(['name', 'parentId'])
        .executeTakeFirstOrThrow()

      const childrenResult = await ctx.db
        .selectFrom('Resource')
        .select(['id', 'name', 'blobId'])
        .where('parentId', '=', input.resourceId)
        .execute()

      const children = childrenQuery.map((c) => {
        if (c.blobId) {
          return {
            id: c.id,
            name: c.name,
            type: 'page',
            lastEditDate: new Date(0),
            lastEditUser: 'Coming Soon',
            permalink: '/placeholder',
          }
        }
        return {
          id: c.id,
          name: c.name,
          type: 'folder',
          lastEditDate: 'folder',
          lastEditUser: 'Coming Soon',
          permalink: '/placeholder',
        }
      })

      const { parentId } = folderResult
      const folderName: string = folderResult.name

      return {
        folderName,
        children,
        parentId,
      }
    }),
})
