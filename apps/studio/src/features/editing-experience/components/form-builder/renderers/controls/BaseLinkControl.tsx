import type { ControlProps } from "@jsonforms/core"
import { Suspense } from "react"
import {
  Box,
  Flex,
  FormControl,
  IconButton,
  Skeleton,
  Text,
  useDisclosure,
} from "@chakra-ui/react"
import { Button, FormLabel } from "@opengovsg/design-system-react"
import { BiTrash } from "react-icons/bi"

import type { LinkTypesWithHrefFormat } from "../../../LinkEditor/constants"
import type { LinkEditorModalProps } from "~/components/PageEditor/LinkEditorModal"
import { LinkEditorModal } from "~/components/PageEditor/LinkEditorModal"
import { getResourceIdFromReferenceLink } from "~/utils/link"
import { trpc } from "~/utils/trpc"
import { LINK_TYPES } from "../../../LinkEditor/constants"
import { getLinkHrefType } from "../../../LinkEditor/utils"

const parseHref = (href: string, pageType: LinkTypesWithHrefFormat) => {
  switch (pageType) {
    case LINK_TYPES.File:
      return href.split("/").pop()
    default:
      return href
  }
}

const SuspendableLabel = ({ resourceId }: { resourceId: string }) => {
  const [{ fullPermalink }] =
    trpc.resource.getWithFullPermalink.useSuspenseQuery({
      resourceId,
    })

  return (
    <Text
      textOverflow="ellipsis"
      whiteSpace="nowrap"
      overflow="auto"
    >{`/${fullPermalink}`}</Text>
  )
}

// TODO: refactor this
// Context: This component exists for us to have both
// JsonFormsLinkControl and JsonFormsRefControl share the same logic
// for rendering the link editor modal without having to duplicate it
// Also, this is a quick hack without doing deep refactoring
export function BaseLinkControl({
  data,
  label,
  required,
  handleChange,
  path,
  linkTypes,
  description,
}: Pick<ControlProps, "data" | "label" | "handleChange" | "path" | "required"> &
  Pick<LinkEditorModalProps, "linkTypes"> & { description: string }) {
  const dataString = data && typeof data === "string" ? data : ""
  const { isOpen, onOpen, onClose } = useDisclosure()
  const pageType = getLinkHrefType(dataString)
  const displayedHref = parseHref(
    dataString,
    pageType as LinkTypesWithHrefFormat,
  )

  return (
    <>
      <Box as={FormControl} isRequired={required}>
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
              {pageType !== LINK_TYPES.Page && <Text>{displayedHref}</Text>}
              {pageType === LINK_TYPES.Page && dataString.length > 0 && (
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
              <Text>{description}</Text>
              <Button
                onClick={onOpen}
                variant="link"
                aria-labelledby="button-label"
              >
                <Text id="button-label" textStyle="subhead-2">
                  Link something...
                </Text>
              </Button>
            </>
          )}
        </Flex>
      </Box>
      <LinkEditorModal
        linkTypes={linkTypes}
        // TODO: fix this
        // Context: we are reusing LinkEditorModal at the moment which is quite janky
        // not passing in any linkText will cause the schema validation to fail
        // (even though we don't need it here)
        linkText="Link"
        doNotShowLinkText={true}
        isOpen={isOpen}
        onClose={onClose}
        onSave={(_, linkHref) => handleChange(path, linkHref)}
      />
    </>
  )
}
