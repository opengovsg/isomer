import type { IconType } from "react-icons"
import {
  Box,
  HStack,
  Icon,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Text,
  VStack,
} from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"

export interface DetailedItem {
  name: string
  description: string
  icon: IconType
  action: () => void
  isHidden?: () => boolean
}

export interface MenubarDetailedListProps {
  type: "detailed-list"
  label: string
  icon: IconType
  items: DetailedItem[]
  isHidden?: () => boolean
}

export const MenubarDetailedList = ({
  isHidden,
  label,
  items,
  icon,
}: MenubarDetailedListProps): JSX.Element | null => {
  if (isHidden?.()) {
    return null
  }
  return (
    <Popover placement="bottom" offset={[0, 16]}>
      <PopoverTrigger>
        <Button
          _hover={{ bg: "gray.100" }}
          _active={{ bg: "gray.200" }}
          bgColor="transparent"
          border="none"
          h="1.75rem"
          w="1.75rem"
          minH="1.75rem"
          minW="1.75rem"
          p={0}
          aria-label={label}
        >
          <Icon as={icon} fontSize="1.25rem" color="base.content.medium" />
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <PopoverBody px={0} py="0.75rem">
          <VStack spacing="0.75rem">
            {items.map(
              (subItem) =>
                !subItem.isHidden?.() && (
                  <Button
                    onClick={subItem.action}
                    variant="clear"
                    colorScheme="neutral"
                    border="none"
                    h="fit-content"
                    w="100%"
                    textAlign="left"
                    px={0}
                    py="0.25rem"
                    aria-label={label}
                    borderRadius={0}
                    _hover={{ bg: "base.canvas.brand-subtle" }}
                  >
                    <HStack
                      w="100%"
                      px="1rem"
                      py="0.75rem"
                      spacing="0.75rem"
                      alignItems="flex-start"
                    >
                      <Icon
                        as={subItem.icon}
                        fontSize="3rem"
                        borderWidth="1px"
                        borderStyle="solid"
                      />
                      <Box>
                        <Text textStyle="subhead-2" mb="0.25rem">
                          {subItem.name}
                        </Text>
                        <Text textStyle="body-2">{subItem.description}</Text>
                      </Box>
                    </HStack>
                  </Button>
                ),
            )}
          </VStack>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  )
}
