import {
  Center,
  Flex,
  Icon,
  Stack,
  Text,
  useDisclosure,
} from "@chakra-ui/react"
import { Button, Link } from "@opengovsg/design-system-react"
import { BiUpload, BiWrench } from "react-icons/bi"
import { useIsAdvancedRedirectsEnabled } from "~/hooks/useIsAdvancedRedirectsEnabled"

import { BulkUploadRedirectsModal } from "./BulkUploadRedirectsModal"
import { REDIRECTS_SUPPORT_LINK } from "../constants"

interface RedirectsHeaderProps {
  siteId: number
}

export const RedirectsHeader = ({
  siteId,
}: RedirectsHeaderProps): JSX.Element => {
  const isAdvancedRedirectsEnabled = useIsAdvancedRedirectsEnabled()
  const {
    isOpen: isBulkUploadOpen,
    onOpen: onBulkUploadOpen,
    onClose: onBulkUploadClose,
  } = useDisclosure()

  return (
    <Flex justifyContent="space-between" align="center" gap="1rem" w="full">
      <Stack spacing="0.5rem">
        <Flex align="center" gap="0.75rem">
          <Center
            w="2rem"
            h="2rem"
            bgColor="brand.secondary.100"
            borderRadius="6px"
          >
            <Icon as={BiWrench} boxSize="1rem" />
          </Center>
          <Text as="h1" textStyle="h3">
            Redirects
          </Text>
        </Flex>
        <Text textStyle="body-2" color="base.content.medium">
          Keep old links working. Redirects send anyone who visits an outdated
          URL to the right place instead. Learn{" "}
          <Link variant="inline" href={REDIRECTS_SUPPORT_LINK} isExternal>
            how to use redirects
          </Link>
          .
        </Text>
      </Stack>

      {/* Placement is intentionally temporary (top-right of the page) — a home
          for the bulk-upload entry point until the final location is decided. */}
      {isAdvancedRedirectsEnabled && (
        <>
          <Button
            variant="outline"
            leftIcon={<BiUpload fontSize="1.25rem" />}
            onClick={onBulkUploadOpen}
          >
            Bulk upload redirects
          </Button>
          <BulkUploadRedirectsModal
            siteId={siteId}
            isOpen={isBulkUploadOpen}
            onClose={onBulkUploadClose}
          />
        </>
      )}
    </Flex>
  )
}
