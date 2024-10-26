import type { ControlProps, RankedTester } from "@jsonforms/core"
import { Suspense } from "react"
import {
  Box,
  Flex,
  FormControl,
  FormLabel,
  Skeleton,
  Text,
  useDisclosure,
} from "@chakra-ui/react"
import { and, rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import { Button, IconButton } from "@opengovsg/design-system-react"
import {
  LINK_TYPE_EMAIL,
  LINK_TYPE_FILE,
  LINK_TYPE_PAGE,
} from "@opengovsg/isomer-components"
import { omit } from "lodash"
import { BiTrash } from "react-icons/bi"

import type { LinkTypes } from "../../../LinkEditor/constants"
import { LinkEditorModal } from "~/components/PageEditor/LinkEditorModal"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { getResourceIdFromReferenceLink } from "~/utils/link"
import { trpc } from "~/utils/trpc"
import { LINK_TYPES } from "../../../LinkEditor/constants"
import { getLinkHrefType } from "../../../LinkEditor/utils"

export const jsonFormsRefControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.RefControl,
  and(schemaMatches((schema) => schema.format === "ref")),
)

const parseHref = (
  href: string,
  pageType: Omit<LinkTypes, typeof LINK_TYPE_EMAIL | typeof LINK_TYPE_PAGE>,
) => {
  if (pageType === LINK_TYPE_FILE) {
    return href.split("/").pop()
  }
  return href
}

const SuspendableLabel = ({ resourceId }: { resourceId: string }) => {
  const [{ fullPermalink }] =
    trpc.resource.getWithFullPermalink.useSuspenseQuery({
      resourceId,
    })

  return <Text>{`/${fullPermalink}`}</Text>
}

export function JsonFormsRefControl({
  data,
  handleChange,
  path,
  label,
  errors,
}: ControlProps) {
  const dataString = data && typeof data === "string" ? data : ""
  const { isOpen, onOpen, onClose } = useDisclosure()
  const pageType = getLinkHrefType(dataString)
  const displayedHref = parseHref(dataString, pageType)

  return (
    <>
      <Box as={FormControl} isInvalid={!!errors}>
        <FormLabel>{label}</FormLabel>
        <Flex
          px="1rem"
          py="0.75rem"
          flexDir="row"
          background="brand.primary.100"
          justifyContent="space-between"
          alignItems="center"
        >
          {!!data ? (
            <>
              {pageType !== LINK_TYPE_PAGE && <Text>{displayedHref}</Text>}
              {pageType === LINK_TYPE_PAGE && dataString.length > 0 && (
                <Suspense fallback={<Skeleton w="100%" h="100%" />}>
                  <SuspendableLabel
                    resourceId={getResourceIdFromReferenceLink(dataString)}
                  />
                </Suspense>
              )}
              <IconButton
                size="xs"
                variant="clear"
                colorScheme="critical"
                aria-label="Remove file"
                icon={<BiTrash />}
                onClick={() => handleChange(path, "")}
              />
            </>
          ) : (
            <>
              <Text>Choose a page or file to link this Collection item to</Text>
              <Button onClick={onOpen} variant="link">
                <Text textStyle="subhead-2">Link something...</Text>
              </Button>{" "}
            </>
          )}
        </Flex>
      </Box>
      <LinkEditorModal
        linkTypes={omit(LINK_TYPES, LINK_TYPE_EMAIL)}
        linkText="Link"
        isOpen={isOpen}
        onClose={onClose}
        onSave={(_, linkHref) => handleChange(path, linkHref)}
      />
    </>
  )
}

export default withJsonFormsControlProps(JsonFormsRefControl)
