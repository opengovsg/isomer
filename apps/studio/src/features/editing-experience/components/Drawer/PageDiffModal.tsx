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
  Text,
} from "@chakra-ui/react"
import { Switch } from "@opengovsg/design-system-react"
import { format } from "date-fns"
import { useCallback, useEffect, useRef, useState } from "react"
import { BiX } from "react-icons/bi"
import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { useSiteThemeCssVars } from "~/features/preview/hooks/useSiteThemeCssVars"
import { trpc } from "~/utils/trpc"

import { PreviewIframe } from "../preview/PreviewIframe"
import PreviewWithCustomSitemap from "../preview/PreviewWithCustomSitemap"
import { setHighlightsVisible } from "./applyDiffHighlights"
import { useDomDiff } from "./useDomDiff"
import { useResizableSplit } from "./useResizableSplit"
import { useSyncedScroll } from "./useSyncedScroll"

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
  const { siteId, pageId, permalink, title } = useEditorDrawerContext()
  const [siteMap] = trpc.site.getLocalisedSitemap.useSuspenseQuery({
    siteId,
    resourceId: pageId,
  })
  const themeCssVars = useSiteThemeCssVars({ siteId })

  const [beforeDocument, setBeforeDocument] = useState<Document | null>(null)
  const [afterDocument, setAfterDocument] = useState<Document | null>(null)
  const [showHighlights, setShowHighlights] = useState(true)

  const handleBeforeMount = useCallback(
    ({ document }: IframeCallbackFnProps) =>
      setBeforeDocument(document ?? null),
    [],
  )
  const handleAfterMount = useCallback(
    ({ document }: IframeCallbackFnProps) => setAfterDocument(document ?? null),
    [],
  )

  const { status } = useDomDiff({ beforeDocument, afterDocument })

  const { containerRef, firstPanePercent, isDragging, separatorProps } =
    useResizableSplit()

  const beforePaneRef = useRef<HTMLDivElement>(null)
  const afterPaneRef = useRef<HTMLDivElement>(null)
  useSyncedScroll({
    beforePaneRef,
    afterPaneRef,
    beforeDocument,
    afterDocument,
  })

  useEffect(() => {
    if (beforeDocument) setHighlightsVisible(beforeDocument, showHighlights)
    if (afterDocument) setHighlightsVisible(afterDocument, showHighlights)
  }, [showHighlights, beforeDocument, afterDocument])

  if (!row) return <></>

  return (
    <Modal size="full" isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent height="100vh" overflow="hidden">
        <Flex direction="column" h="full" key={row.id}>
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
              <Box ref={beforePaneRef} flex={1} overflow="auto">
                <PreviewIframe
                  style={themeCssVars}
                  callback={handleBeforeMount}
                >
                  <PreviewWithCustomSitemap
                    {...row.beforeContent}
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
              bg={
                isDragging ? "interaction.main.default" : "base.divider.medium"
              }
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
              <Box ref={afterPaneRef} flex={1} overflow="auto">
                <PreviewIframe style={themeCssVars} callback={handleAfterMount}>
                  <PreviewWithCustomSitemap
                    {...row.afterContent}
                    siteId={siteId}
                    permalink={permalink}
                    siteMap={siteMap}
                  />
                </PreviewIframe>
              </Box>
            </Flex>
          </Flex>
        </Flex>
      </ModalContent>
    </Modal>
  )
}
