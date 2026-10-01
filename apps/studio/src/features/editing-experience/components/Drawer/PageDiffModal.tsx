import type { UseDisclosureReturn } from "@chakra-ui/react"
import type { IsomerSchema } from "@opengovsg/isomer-components"
import type { PropsWithChildren } from "react"
import type { IframeCallbackFnProps } from "~/types/dom"
import {
  Box,
  Flex,
  IconButton,
  Modal,
  ModalContent,
  ModalOverlay,
  Skeleton,
  Text,
} from "@chakra-ui/react"
import { Switch } from "@opengovsg/design-system-react"
import { format } from "date-fns"
import { useCallback, useEffect, useState } from "react"
import { BiX } from "react-icons/bi"
import Suspense from "~/components/Suspense"
import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { useSiteThemeCssVars } from "~/features/preview/hooks/useSiteThemeCssVars"
import { trpc } from "~/utils/trpc"

import { PreviewIframe } from "../preview/PreviewIframe"
import PreviewWithCustomSitemap from "../preview/PreviewWithCustomSitemap"
import { setHighlightsVisible } from "./applyDiffHighlights"
import { useDomDiff } from "./useDomDiff"
import { useResizableSplit } from "./useResizableSplit"

export interface PageDiffModalRow {
  id: string
  versionNum: number
  publishedAt: Date
  publisher: { email: string }
  beforeContent: IsomerSchema
  afterContent: IsomerSchema
}

interface PageDiffModalProps extends Pick<
  UseDisclosureReturn,
  "isOpen" | "onClose"
> {
  row: PageDiffModalRow | null
}

// A preview pane's iframe document, exposed only once the page has rendered
// into it. `useDomDiff` diffs each document once, so handing it over while
// the preview still shows its loading skeleton would leave the highlights
// stale: the real page later renders into the same Document object.
const useRenderedPreviewDocument = () => {
  const [document, setDocument] = useState<Document | null>(null)
  const [isRendered, setIsRendered] = useState(false)

  const onMount = useCallback(
    ({ document }: IframeCallbackFnProps) => setDocument(document ?? null),
    [],
  )
  const onRendered = useCallback(() => setIsRendered(true), [])

  return { document: isRendered ? document : null, onMount, onRendered }
}

const PaneHeader = ({ children }: PropsWithChildren): JSX.Element => (
  <Flex
    align="baseline"
    flexWrap="wrap"
    columnGap="0.5rem"
    px="1.5rem"
    py="0.75rem"
    borderBottom="1px solid"
    borderColor="base.divider.medium"
  >
    {children}
  </Flex>
)

export const PageDiffModal = ({
  isOpen,
  onClose,
  row,
}: PageDiffModalProps): JSX.Element => {
  if (!row) return <></>

  return (
    <Modal size="full" isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent height="100vh" overflow="hidden">
        <Suspense fallback={<Skeleton h="full" />}>
          {/* Keyed so each version starts with fresh preview documents. */}
          <PageDiffContent key={row.id} row={row} onClose={onClose} />
        </Suspense>
      </ModalContent>
    </Modal>
  )
}

interface PageDiffContentProps extends Pick<PageDiffModalProps, "onClose"> {
  row: PageDiffModalRow
}

const PageDiffContent = ({ row, onClose }: PageDiffContentProps) => {
  const { siteId, pageId, permalink, title } = useEditorDrawerContext()
  const [siteMap] = trpc.site.getLocalisedSitemap.useSuspenseQuery({
    siteId,
    resourceId: pageId,
  })
  const themeCssVars = useSiteThemeCssVars({ siteId })

  const before = useRenderedPreviewDocument()
  const after = useRenderedPreviewDocument()
  const [showHighlights, setShowHighlights] = useState(true)

  const { status } = useDomDiff({
    beforeDocument: before.document,
    afterDocument: after.document,
  })

  const { containerRef, firstPanePercent, isDragging, separatorProps } =
    useResizableSplit()

  useEffect(() => {
    if (before.document) setHighlightsVisible(before.document, showHighlights)
    if (after.document) setHighlightsVisible(after.document, showHighlights)
  }, [showHighlights, before.document, after.document])

  return (
    <Flex direction="column" h="full">
      <Flex
        justify="space-between"
        align="center"
        gap="1rem"
        px="1.5rem"
        borderBottom="1px solid"
        borderColor="base.divider.medium"
      >
        <Text textStyle="h6" noOfLines={1}>
          {title}
        </Text>
        <Flex align="center" gap="0.75rem" flexShrink={0}>
          {status === "error" && (
            <Text textStyle="caption-2" color="utility.feedback.critical">
              Couldn't compute a detailed diff — showing before/after only.
            </Text>
          )}
          <Text textStyle="caption-2" as="label" htmlFor="highlight-toggle">
            Highlight changes
          </Text>
          <Switch
            id="highlight-toggle"
            aria-label="Highlight changes"
            size="md"
            isChecked={showHighlights}
            onChange={(e) => setShowHighlights(e.target.checked)}
          />
          <IconButton
            aria-label="Close"
            icon={<BiX fontSize="1.25rem" />}
            variant="clear"
            onClick={onClose}
          />
        </Flex>
      </Flex>
      <Flex
        ref={containerRef}
        flex={1}
        overflow="hidden"
        cursor={isDragging ? "col-resize" : undefined}
      >
        <Flex
          direction="column"
          flexBasis={`${firstPanePercent}%`}
          flexShrink={0}
          minW={0}
          pointerEvents={isDragging ? "none" : undefined}
        >
          <PaneHeader>
            <Text textStyle="h6">Changes in version {row.versionNum}</Text>
            <Text textStyle="caption-2" color="base.content.medium">
              Published {format(row.publishedAt, "d MMM yyyy, h:mm a")} by{" "}
              {row.publisher.email}
            </Text>
          </PaneHeader>
          <Box flex={1} overflow="auto">
            <PreviewIframe style={themeCssVars} callback={before.onMount}>
              <PreviewWithCustomSitemap
                {...row.beforeContent}
                onRendered={before.onRendered}
                siteId={siteId}
                permalink={permalink}
                siteMap={siteMap}
              />
            </PreviewIframe>
          </Box>
        </Flex>
        <Box
          {...separatorProps}
          flexShrink={0}
          w="0.25rem"
          cursor="col-resize"
          bg={isDragging ? "interaction.main.default" : "base.divider.medium"}
          _hover={{ bg: "interaction.main.default" }}
          _focusVisible={{
            bg: "interaction.main.default",
            outline: "none",
          }}
        />
        <Flex
          direction="column"
          flex={1}
          minW={0}
          pointerEvents={isDragging ? "none" : undefined}
        >
          <PaneHeader>
            <Text textStyle="h6">Current Version</Text>
          </PaneHeader>
          <Box flex={1} overflow="auto">
            <PreviewIframe style={themeCssVars} callback={after.onMount}>
              <PreviewWithCustomSitemap
                {...row.afterContent}
                onRendered={after.onRendered}
                siteId={siteId}
                permalink={permalink}
                siteMap={siteMap}
              />
            </PreviewIframe>
          </Box>
        </Flex>
      </Flex>
    </Flex>
  )
}
