import { Grid, GridItem } from '@chakra-ui/react'
import { NextPageWithLayout } from '~/lib/types'
import { PageEditingLayout } from '~/templates/layouts/PageEditingLayout'

const EditPage: NextPageWithLayout = () => {
  return (
    <Grid w="100vw" templateColumns="repeat(3, 1fr)" gap={4}>
      {/* TODO: Implement sidebar editor */}
      <GridItem w="100%" colSpan={1} bg="tomato">
        <h1>Editor sidebar appears here</h1>
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
