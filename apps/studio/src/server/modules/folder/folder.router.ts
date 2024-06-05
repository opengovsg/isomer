import { getFolderSchema } from "~/schemas/folder";
import { protectedProcedure, router } from '~/server/trpc'


export const folderRouter = router({
    readFolder: protectedProcedure.input(getFolderSchema).query(async ({ input, ctx }) => {     
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