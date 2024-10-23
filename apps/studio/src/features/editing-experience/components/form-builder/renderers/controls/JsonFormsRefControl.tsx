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
import {
  Button,
  FormErrorMessage,
  IconButton,
} from "@opengovsg/design-system-react"
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
  pageType: Omit<LinkTypes, "email" | "page">,
) => {
  if (pageType === "file") {
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
      <Box
        as={FormControl}
        isInvalid={!!errors}
        mt="1.25rem"
        _first={{ mt: 0 }}
      >
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
              {pageType !== "page" && <Text>{displayedHref}</Text>}
              {pageType === "page" && dataString.length > 0 && (
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
        linkTypes={omit(LINK_TYPES, "email")}
        linkText="Link"
        isOpen={isOpen}
        onClose={onClose}
        onSave={(_, linkHref) => handleChange(path, linkHref)}
      />
    </>
  )
}

export default withJsonFormsControlProps(JsonFormsRefControl)
