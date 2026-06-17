import type { FooterSchemaType } from "@opengovsg/isomer-components"
import { Box, HStack, Icon, Text } from "@chakra-ui/react"
import { useJsonForms } from "@jsonforms/react"
import { Menu, MenuItem, MenuTrigger } from "@opengovsg/oui"
import { get } from "lodash-es"
import {
  BiDotsHorizontalRounded,
  BiPencil,
  BiSolidErrorCircle,
  BiTrash,
} from "react-icons/bi"
import { CRITICAL_MENU_ITEM_CLASSNAMES } from "~/components/Menu"
import { IconButton } from "~/components/oui-bridge/IconButton"

import { useFormBuilderBoundary } from "../../../hooks/useFormBuilderBoundary"
import { SOCIAL_MEDIA_LINKS } from "./constants"

interface SocialMediaLinkProps {
  path: string
  onDelete: () => void
  onEdit: () => void
  isInvalid?: boolean
}

export const SocialMediaLink = ({
  path,
  onDelete,
  onEdit,
  isInvalid,
}: SocialMediaLinkProps) => {
  const menuBoundary = useFormBuilderBoundary()
  const ctx = useJsonForms()
  const data = (get(ctx.core?.data, path) ?? {}) as Partial<
    NonNullable<FooterSchemaType["socialMediaLinks"]>[number]
  >

  const { type, url } = data
  const socialMediaLink = SOCIAL_MEDIA_LINKS.find(
    (link) => link.type === (type ?? "facebook"),
  )

  return (
    <Box
      aria-invalid={isInvalid}
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
      <HStack gap="0.5rem" px="1rem" py="0.5rem" w="full">
        <HStack
          as="button"
          gap="0.5rem"
          w="full"
          maxW="calc(100% - 1.75rem)"
          textAlign="start"
          onClick={onEdit}
        >
          {socialMediaLink && (
            <HStack gap="0.75rem" w="full">
              <HStack gap="0.5rem" minW="6.25rem">
                {socialMediaLink.icon}

                <Text textStyle="subhead-2" textColor="base.content.default">
                  {socialMediaLink.label}
                </Text>
              </HStack>

              {isInvalid ? (
                <Box as="span" display="flex" flexDir="row" gap="0.25rem">
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
                </Box>
              ) : (
                <Text
                  textStyle="caption-2"
                  textColor="base.content.medium"
                  noOfLines={1}
                >
                  {url || socialMediaLink.placeholder}
                </Text>
              )}
            </HStack>
          )}
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
              onAction={onEdit}
              startContent={<BiPencil className="size-4" />}
            >
              Edit link
            </MenuItem>
            <MenuItem
              onAction={onDelete}
              classNames={CRITICAL_MENU_ITEM_CLASSNAMES}
              startContent={<BiTrash className="size-4" />}
            >
              Delete link
            </MenuItem>
          </Menu>
        </MenuTrigger>
      </HStack>
    </Box>
  )
}
