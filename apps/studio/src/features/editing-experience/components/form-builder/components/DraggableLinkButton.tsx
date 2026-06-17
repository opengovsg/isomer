import {
  Box,
  forwardRef,
  HStack,
  Icon,
  Skeleton,
  Text,
  VStack,
} from "@chakra-ui/react"
import { computeChildLabel } from "@jsonforms/core"
import { useJsonForms } from "@jsonforms/react"
import { getResourceIdFromReferenceLink } from "@opengovsg/isomer-components"
import { Menu, MenuItem, MenuTrigger } from "@opengovsg/oui"
import {
  BiDotsHorizontalRounded,
  BiGridVertical,
  BiPencil,
  BiSolidErrorCircle,
  BiTrash,
} from "react-icons/bi"
import { CRITICAL_MENU_ITEM_CLASSNAMES } from "~/components/Menu"
import { IconButton } from "~/components/oui-bridge/IconButton"
import Suspense from "~/components/Suspense"
import { useQueryParse } from "~/hooks/useQueryParse"
import { sitePageSchema } from "~/pages/sites/[siteId]"
import { trpc } from "~/utils/trpc"

import type { LinkTypesWithHrefFormat } from "../../LinkEditor/constants"
import type { DraggableArrayItemRenderProps } from "./types"
import { LINK_TYPES } from "../../LinkEditor/constants"
import { getLinkHrefType, parseHref } from "../../LinkEditor/utils"
import { useFormBuilderBoundary } from "../hooks/useFormBuilderBoundary"
import { LinkErrorBoundary } from "./LinkErrorBoundary"

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
      noOfLines={1}
      textStyle="caption-2"
      textColor="interaction.support.placeholder"
    >{`/${fullPermalink}`}</Text>
  )
}

interface DraggableLinkButtonProps extends Omit<
  DraggableArrayItemRenderProps,
  "selected" | "enabled" | "handleSelect" | "removeItem" | "translations"
> {
  onDeleteItem: () => void
  resetLink: () => void
}

const DraggableLinkButton = forwardRef<DraggableLinkButtonProps, "div">(
  (
    {
      draggableProps,
      dragHandleProps,
      setSelectedIndex,
      onDeleteItem,
      isError,
      index,
      path,
      schema,
      uischema,
      resetLink,
    },
    ref,
  ) => {
    const menuBoundary = useFormBuilderBoundary()
    const ctx = useJsonForms()
    const label = computeChildLabel(
      ctx.core?.data,
      path,
      "",
      schema,
      ctx.core?.schema ?? {},
      ctx.i18n?.translate ?? ((s) => s),
      uischema,
    )
    const url = computeChildLabel(
      ctx.core?.data,
      path,
      "url",
      schema,
      ctx.core?.schema ?? {},
      ctx.i18n?.translate ?? ((s) => s),
      uischema,
    )

    const { siteId } = useQueryParse(sitePageSchema)
    const linkType = getLinkHrefType(url)
    const displayedHref = parseHref(url, linkType as LinkTypesWithHrefFormat)

    return (
      <LinkErrorBoundary resetLink={resetLink}>
        <Box my="0.25rem" ref={ref} {...draggableProps} w="full">
          <Box
            aria-invalid={isError}
            borderWidth="1px"
            borderStyle="solid"
            borderColor="base.divider.medium"
            borderRadius="0.375rem"
            bgColor="utility.ui"
            w="full"
            position="relative"
            transitionProperty="common"
            transitionDuration="normal"
            _hover={{
              bg: "interaction.muted.main.hover",
              borderColor: "interaction.main-subtle.hover",
              _invalid: {
                bg: "interaction.muted.critical.hover",
                borderColor: "utility.feedback.critical",
              },
            }}
            _active={{
              bg: "interaction.main-subtle.default",
              borderColor: "interaction.main-subtle.hover",
              shadow: "0px 1px 6px 0px #1361F026",
              _invalid: {
                bg: "interaction.muted.critical.hover",
                borderColor: "utility.feedback.critical",
                shadow: "0px 1px 6px 0px #C0343426",
              },
            }}
            _invalid={{
              borderWidth: "1.5px",
              borderColor: "utility.feedback.critical",
              bgColor: "utility.feedback.critical-subtle",
            }}
          >
            <HStack gap="0.5rem" p="0.5rem" w="full">
              <HStack gap="0.75rem" w="full">
                <Box cursor="grab" layerStyle="focusRing" {...dragHandleProps}>
                  <Icon
                    as={BiGridVertical}
                    fontSize="1.5rem"
                    color="slate.300"
                  />
                </Box>

                <HStack
                  as="button"
                  gap="0.5rem"
                  w="full"
                  textAlign="start"
                  onClick={() => setSelectedIndex(index)}
                >
                  <VStack gap="0.25rem" alignItems="start">
                    <Text
                      textStyle="subhead-2"
                      textColor="base.content.default"
                    >
                      {label || "No title"}
                    </Text>

                    <HStack gap="0.25rem" justifyContent="center">
                      {isError && (
                        <>
                          <Icon
                            as={BiSolidErrorCircle}
                            fontSize="1rem"
                            color="utility.feedback.critical"
                          />
                          <Text
                            textStyle="caption-2"
                            textColor="utility.feedback.critical"
                            noOfLines={1}
                          >
                            Fix errors before publishing
                          </Text>
                        </>
                      )}

                      {!isError &&
                        linkType === LINK_TYPES.Page &&
                        displayedHref &&
                        displayedHref !== "" && (
                          <Suspense fallback={<Skeleton w="100%" h="100%" />}>
                            <SuspendableLabel
                              siteId={Number(siteId)}
                              resourceId={getResourceIdFromReferenceLink(
                                displayedHref,
                              )}
                            />
                          </Suspense>
                        )}

                      {!isError && linkType !== LINK_TYPES.Page && (
                        <Text
                          textStyle="caption-2"
                          textColor="interaction.support.placeholder"
                          noOfLines={1}
                        >
                          {displayedHref}
                        </Text>
                      )}
                    </HStack>
                  </VStack>
                </HStack>
              </HStack>

              <MenuTrigger>
                <IconButton
                  aria-label="See more options"
                  variant="clear"
                  color="sub"
                  className="size-7 min-h-7 min-w-7"
                  icon={<BiDotsHorizontalRounded className="size-6" />}
                />
                <Menu size="sm" {...menuBoundary}>
                  <MenuItem
                    onAction={() => setSelectedIndex(index)}
                    startContent={<BiPencil className="size-4" />}
                  >
                    Edit link
                  </MenuItem>
                  <MenuItem
                    onAction={onDeleteItem}
                    classNames={CRITICAL_MENU_ITEM_CLASSNAMES}
                    startContent={<BiTrash className="size-4" />}
                  >
                    Delete link
                  </MenuItem>
                </Menu>
              </MenuTrigger>
            </HStack>
          </Box>
        </Box>
      </LinkErrorBoundary>
    )
  },
)

export default DraggableLinkButton
