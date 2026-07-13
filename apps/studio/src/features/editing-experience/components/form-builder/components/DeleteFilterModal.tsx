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

function FilterUsageCount({
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
    <>
      You are deleting an entire filter. It&apos;s being used on{" "}
      {count === 1 ? "1 item" : `${count} items`}.
    </>
  )
}

// Querying usage counts for very large filters is disallowed server-side
// (see MAX_TAG_OPTION_IDS_FOR_USAGE_COUNT) since the count is not worth the
// request/SQL cost at that scale. Skip the query entirely and say so, rather
// than sending a request we know will fail or truncating to a misleading
// capped number like "999+".
function FilterUsageMessage({
  siteId,
  pageId,
  tagOptionIds,
}: {
  siteId: number
  pageId: number
  tagOptionIds: string[]
}) {
  if (tagOptionIds.length > MAX_TAG_OPTION_IDS_FOR_USAGE_COUNT) {
    return (
      <>
        You are deleting an entire filter. It&apos;s being used on a large
        number of results.
      </>
    )
  }

  return (
    <FilterUsageCount
      siteId={siteId}
      pageId={pageId}
      tagOptionIds={tagOptionIds}
    />
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
          <Text textStyle="subhead-1" color="base.content.strong">
            <ErrorBoundary
              fallbackRender={() => <>You are deleting an entire filter.</>}
            >
              <Suspense fallback={<Skeleton height="1.5em" width="100%" />}>
                <FilterUsageMessage
                  siteId={siteId}
                  pageId={pageId}
                  tagOptionIds={tagOptionIds}
                />
              </Suspense>
            </ErrorBoundary>
          </Text>
        </ModalHeader>
        <ModalCloseButton size="lg" />

        <ModalBody>
          <VStack align="stretch" spacing="1.5rem">
            <Infobox width="100%" size="md" variant="warning">
              <Text textStyle="body-1" color="base.content.strong">
                To undo this change, you will need to recreate this filter and
                assign options to each item individually.
              </Text>
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
