import type { UseDisclosureReturn } from "@chakra-ui/react"
import type { IsomerSchema } from "@opengovsg/isomer-components"
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
import { useCallback, useEffect, useState } from "react"
import { BiX } from "react-icons/bi"
import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { useSiteThemeCssVars } from "~/features/preview/hooks/useSiteThemeCssVars"
import { trpc } from "~/utils/trpc"

import { PreviewIframe } from "../preview/PreviewIframe"
import PreviewWithCustomSitemap from "../preview/PreviewWithCustomSitemap"
import { setHighlightsVisible } from "./applyDiffHighlights"
import { useDomDiff } from "./useDomDiff"

export interface PageDiffModalRow {
  id: string
  createdAt: Date
  actor: { name: string }
  beforeContent: IsomerSchema
  afterContent: IsomerSchema
}

interface PageDiffModalProps
  extends Pick<UseDisclosureReturn, "isOpen" | "onClose"> {
  row: PageDiffModalRow | null
}

export const PageDiffModal = ({
  isOpen,
  onClose,
  row,
}: PageDiffModalProps): JSX.Element => {
  const { siteId, pageId, permalink } = useEditorDrawerContext()
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
    ({ document }: IframeCallbackFnProps) =>
      setAfterDocument(document ?? null),
    [],
  )

  const { status } = useDomDiff({ beforeDocument, afterDocument })

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
            px="1.5rem"
            py="1rem"
            borderBottom="1px solid"
            borderColor="base.divider.medium"
          >
            <Box>
              <Text textStyle="h6">
                Changes from {format(row.createdAt, "d MMM yyyy, h:mm a")}
              </Text>
              <Text textStyle="caption-2" color="base.content.medium">
                {row.actor.name}
              </Text>
            </Box>
            <Flex align="center" gap="0.75rem">
              {status === "error" && (
                <Text textStyle="caption-2" color="utility.feedback.critical">
                  Couldn't compute a detailed diff — showing before/after
                  only.
                </Text>
              )}
              <Text
                textStyle="caption-2"
                as="label"
                htmlFor="highlight-toggle"
              >
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
          <Flex flex={1} overflow="hidden">
            <Box
              flex={1}
              borderRight="1px solid"
              borderColor="base.divider.medium"
              overflow="auto"
            >
              <PreviewIframe style={themeCssVars} callback={handleBeforeMount}>
                <PreviewWithCustomSitemap
                  {...row.beforeContent}
                  siteId={siteId}
                  permalink={permalink}
                  siteMap={siteMap}
                />
              </PreviewIframe>
            </Box>
            <Box flex={1} overflow="auto">
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
      </ModalContent>
    </Modal>
  )
}
