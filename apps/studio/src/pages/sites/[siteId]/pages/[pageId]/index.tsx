import type { CSSProperties } from "react"
import { useEffect, useMemo } from "react"
import { Flex, Grid, GridItem } from "@chakra-ui/react"
import { flatten } from "flat"

import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import EditPageDrawer from "~/features/editing-experience/components/EditPageDrawer"
import Preview from "~/features/editing-experience/components/Preview"
import { PreviewIframe } from "~/features/editing-experience/components/PreviewIframe"
import { editPageSchema } from "~/features/editing-experience/schema"
import { useQueryParse } from "~/hooks/useQueryParse"
import { PageEditingLayout } from "~/templates/layouts/PageEditingLayout"
import { trpc } from "~/utils/trpc"

function EditPage(): JSX.Element {
  const {
    setDrawerState,
    previewPageState,
    setSavedPageState,
    setPreviewPageState,
  } = useEditorDrawerContext()
  const { pageId, siteId } = useQueryParse(editPageSchema)

  const [{ content: page, permalink }] =
    trpc.page.readPageAndBlob.useSuspenseQuery({
      pageId,
      siteId,
    })

  // TODO: Export into custom hook
  const [theme] = trpc.site.getTheme.useSuspenseQuery({ id: siteId })
  const themeCssVars = useMemo(() => {
    if (!theme) return
    // convert theme to css vars
    const flattenedVars: Record<string, string> = flatten(
      { color: { brand: { ...theme.colors } } },
      { delimiter: "-" },
    )
    return Object.entries(flattenedVars).reduce(
      (acc, [key, value]) => {
        acc[`--${key}`] = value
        return acc
      },
      {} as Record<string, string>,
    ) as CSSProperties
  }, [theme])

  useEffect(() => {
    setDrawerState({
      state: "root",
    })
    setSavedPageState(page)
    setPreviewPageState(page)
  }, [page, setDrawerState, setPreviewPageState, setSavedPageState])

  return (
    <Grid
      w="100vw"
      templateColumns="repeat(3, 1fr)"
      gap={0}
      maxH="calc(100vh - 57px)"
    >
      {/* TODO: Implement sidebar editor */}
      <GridItem colSpan={1} bg="slate.50">
        <EditPageDrawer />
      </GridItem>
      {/* TODO: Implement preview */}
      <GridItem colSpan={2}>
        <Flex
          shrink={0}
          justify="flex-start"
          p="2rem"
          bg="gray.100"
          h="100%"
          overflowX="auto"
        >
          <PreviewIframe style={themeCssVars}>
            <Preview
              {...page}
              {...previewPageState}
              siteId={siteId}
              permalink={permalink}
              version="0.1.0"
            />
          </PreviewIframe>
        </Flex>
      </GridItem>
    </Grid>
  )
}

EditPage.getLayout = PageEditingLayout

export default EditPage
