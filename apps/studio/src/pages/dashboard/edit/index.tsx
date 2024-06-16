import { Grid, GridItem } from '@chakra-ui/react'
import EditPageDrawer from '~/features/editing-experience/components/EditPageDrawer'
import { NextPageWithLayout } from '~/lib/types'
import { PageEditingLayout } from '~/templates/layouts/PageEditingLayout'

const EditPage: NextPageWithLayout = () => {
  return (
    <Grid w="100vw" templateColumns="repeat(3, 1fr)" gap={4}>
      {/* TODO: Implement sidebar editor */}
      <GridItem w="100%" colSpan={1} bg="slate.50">
        <EditPageDrawer
          open
          state={{
            state: 'root',
            blocks: [
              { text: '1', id: 'hero-123' },
              { text: '2', id: 'content-123' },
              { text: '3', id: 'infopic-123' },
              { text: '4', id: 'content-234' },
            ],
          }}
        />
      </GridItem>
      {/* TODO: Implement preview */}
      <GridItem w="100%" colSpan={2} bg="papayawhip">
        <h1>Preview appears here</h1>
      </GridItem>
    </Grid>
  )
}

EditPage.getLayout = PageEditingLayout

export default EditPage
