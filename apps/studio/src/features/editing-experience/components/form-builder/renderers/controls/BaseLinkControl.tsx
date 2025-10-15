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
import { getResourceIdFromReferenceLink } from "@opengovsg/isomer-components"
import { BiTrash } from "react-icons/bi"

import type { LinkTypesWithHrefFormat } from "../../../LinkEditor/constants"
import type { LinkEditorModalProps } from "~/components/PageEditor/LinkEditorModal"
import { LinkEditorModal } from "~/components/PageEditor/LinkEditorModal"
import { useQueryParse } from "~/hooks/useQueryParse"
import { sitePageSchema } from "~/pages/sites/[siteId]"
import { trpc } from "~/utils/trpc"
import { LINK_TYPES } from "../../../LinkEditor/constants"
import { getLinkHrefType } from "../../../LinkEditor/utils"
import { LinkErrorBoundary } from "../../components/LinkErrorBoundary"
import { parseHref } from "./utils/parseHref"

interface SuspendableLabelProps {
  siteId: number
  resourceId: string
}
const SuspendableLabel = ({ siteId, resourceId }: SuspendableLabelProps) => {
  const [{ fullPermalink }] =
    trpc.resource.getWithFullPermalink.useSuspenseQuery({
      siteId,
      resourceId,
    })

  return (
    <Text
      textStyle="body-2"
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
  const { siteId } = useQueryParse(sitePageSchema)

  return (
    <>
      <Box as={FormControl} isRequired={required}>
        <FormLabel>{label}</FormLabel>
        <LinkErrorBoundary resetLink={() => handleChange(path, undefined)}>
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
                {pageType !== LINK_TYPES.Page && (
                  <Text overflow="auto" textStyle="body-2">
                    {displayedHref}
                  </Text>
                )}
                {pageType === LINK_TYPES.Page && dataString.length > 0 && (
                  <Suspense fallback={<Skeleton w="100%" h="100%" />}>
                    <SuspendableLabel
                      siteId={Number(siteId)}
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
                  onClick={() => handleChange(path, undefined)}
                />
              </>
            ) : (
              <>
                <Text textStyle="body-2">{description}</Text>
                <Button
                  onClick={onOpen}
                  variant="link"
                  aria-labelledby="button-label"
                  py="0.5rem"
                >
                  <Text id="button-label" textStyle="subhead-2">
                    Link something...
                  </Text>
                </Button>
              </>
            )}
          </Flex>
        </LinkErrorBoundary>
      </Box>
      <LinkEditorModal
        linkTypes={linkTypes}
        // TODO: fix this
        // Context: we are reusing LinkEditorModal at the moment which is quite janky
        // not passing in any linkText will cause the schema validation to fail
        // (even though we don't need it here)
        linkText="Link"
        showLinkText={false}
        isOpen={isOpen}
        onClose={onClose}
        onSave={(_, linkHref) => handleChange(path, linkHref)}
      />
    </>
  )
}
