import type { FooterSchemaType } from "@opengovsg/isomer-components"
import {
  Box,
  Flex,
  HStack,
  Icon,
  MenuButton,
  MenuItem,
  MenuList,
  Spacer,
  Text,
} from "@chakra-ui/react"
import { useJsonForms } from "@jsonforms/react"
import { IconButton, Menu } from "@opengovsg/design-system-react"
import get from "lodash/get"
import {
  BiDotsHorizontalRounded,
  BiPencil,
  BiSolidErrorCircle,
  BiTrash,
} from "react-icons/bi"

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

        <Menu>
          <MenuButton
            as={IconButton}
            aria-label="See more options"
            variant="clear"
            colorScheme="sub"
            minH="1.75rem"
            minW="1.75rem"
            h="1.75rem"
            icon={<BiDotsHorizontalRounded fontSize="1.5rem" />}
          />
          <MenuList>
            <MenuItem onClick={onEdit}>
              <Flex
                alignItems="center"
                gap="0.5rem"
                color="base.content.strong"
              >
                <Icon as={BiPencil} />
                <Text textStyle="body-2">Edit link</Text>
              </Flex>
            </MenuItem>
            <MenuItem onClick={onDelete}>
              <Flex
                alignItems="center"
                gap="0.5rem"
                color="interaction.critical.default"
              >
                <Icon as={BiTrash} />
                <Text textStyle="body-2">Delete link</Text>
              </Flex>
            </MenuItem>
          </MenuList>
        </Menu>
      </HStack>
    </Box>
  )
}
