import {
  HStack,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Skeleton,
  Text,
  VStack,
} from "@chakra-ui/react"
import {
  Button,
  Checkbox,
  Infobox,
  ModalCloseButton,
} from "@opengovsg/design-system-react"
import { Suspense, useState } from "react"
import { ErrorBoundary } from "react-error-boundary"
import { MAX_TAG_OPTION_IDS_FOR_USAGE_COUNT } from "~/schemas/collection"
import { trpc } from "~/utils/trpc"

interface DeleteFilterModalProps {
  isOpen: boolean
  siteId: number
  pageId: number
  tagOptionIds: string[]
  onClose: () => void
  onConfirm: () => void
}

const DELETE_FILTER_UNDO_TEXT =
  "To undo this change, you will need to recreate this filter and assign options to each item individually."

function FilterUsageInfobox({
  siteId,
  pageId,
  tagOptionIds,
}: {
  siteId: number
  pageId: number
  tagOptionIds: string[]
}) {
  const [{ count }] = trpc.collection.countTagOptionsUsage.useSuspenseQuery({
    siteId,
    pageId,
    tagOptionIds,
  })

  return (
    <Text textStyle="body-1" color="base.content.strong">
      {count > 0
        ? `It’s being used on ${count === 1 ? "1 item" : `${count} items`}.`
        : ""}
      {DELETE_FILTER_UNDO_TEXT}
    </Text>
  )
}

export function DeleteFilterModal({
  isOpen,
  siteId,
  pageId,
  tagOptionIds,
  onClose,
  onConfirm,
}: DeleteFilterModalProps) {
  const [isChecked, setIsChecked] = useState(false)

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader mr="3.5rem">
          You are deleting an entire filter.
        </ModalHeader>
        <ModalCloseButton size="lg" />

        <ModalBody>
          <VStack align="stretch" spacing="1.5rem">
            <Infobox width="100%" size="md" variant="warning">
              <ErrorBoundary
                fallbackRender={() => (
                  <Text textStyle="body-1" color="base.content.strong">
                    {DELETE_FILTER_UNDO_TEXT}
                  </Text>
                )}
              >
                {/* Querying usage counts for very large filters is disallowed server-side
                (see MAX_TAG_OPTION_IDS_FOR_USAGE_COUNT) since the count is not worth the
                request/SQL cost at that scale. Skip the query entirely and say so, rather
                than sending a request we know will fail or truncating to a misleading
                capped number like "999+". */}
                {tagOptionIds.length > MAX_TAG_OPTION_IDS_FOR_USAGE_COUNT ? (
                  <Text textStyle="body-1" color="base.content.strong">
                    It’s being used on a large number of results.{" "}
                    {DELETE_FILTER_UNDO_TEXT}
                  </Text>
                ) : (
                  <Suspense fallback={<Skeleton height="2.5em" width="100%" />}>
                    <FilterUsageInfobox
                      siteId={siteId}
                      pageId={pageId}
                      tagOptionIds={tagOptionIds}
                    />
                  </Suspense>
                )}
              </ErrorBoundary>
            </Infobox>
            <HStack align="start">
              <Checkbox
                isChecked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
              >
                <Text textStyle="body-2">
                  Yes, delete the entire filter permanently
                </Text>
              </Checkbox>
            </HStack>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing="1rem">
            <Button variant="clear" colorScheme="neutral" onClick={onClose}>
              No, keep filter
            </Button>
            <Button
              isDisabled={!isChecked}
              variant="solid"
              colorScheme="critical"
              onClick={onConfirm}
            >
              Delete filter
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
