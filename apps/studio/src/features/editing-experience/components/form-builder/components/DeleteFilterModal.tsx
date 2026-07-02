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

  return <>{count === 1 ? "1 item" : `${count} items`}</>
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
            You are deleting an entire filter. It&apos;s being used on{" "}
            <ErrorBoundary fallbackRender={() => <>— items</>}>
              <Suspense
                fallback={
                  <Skeleton
                    as="span"
                    display="inline-block"
                    verticalAlign="middle"
                    height="1em"
                    width="2ch"
                  />
                }
              >
                <FilterUsageCount
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
