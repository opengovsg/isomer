import type { ButtonProps } from "@chakra-ui/react"
import {
  Box,
  chakra,
  HStack,
  Icon,
  Text,
  useDisclosure,
  useMultiStyleConfig,
} from "@chakra-ui/react"
import { BiSearch } from "react-icons/bi"

import { SearchModal } from "./SearchModal"

const SearchButton = (props: ButtonProps) => {
  const styles = useMultiStyleConfig("Searchbar", {
    isExpanded: true,
    size: "md",
  })

  return (
    <chakra.button
      flex="1"
      type="button"
      w="42.5rem"
      whiteSpace="nowrap"
      display={{ base: "none", sm: "flex" }}
      alignItems="center"
      boxSizing="initial"
      // py="3"
      // px="4"
      height="2.75rem"
      rounded="base"
      border="1px solid"
      borderColor="base.divider.strong"
      aria-label="search-button"
      {...props}
    >
      <Box __css={styles.icon} w="44px" flexShrink={0}>
        <Icon as={BiSearch} fill="base.content.medium" />
      </Box>
      <HStack w="full" spacing="4px">
        <Text
          textColor="interaction.support.placeholder"
          textAlign="left"
          flex="1"
          textStyle="body-2"
          ml="1px"
        >
          {`Search pages, collections, or folders by name. e.g. "Speech by Minister"`}
        </Text>
      </HStack>
    </chakra.button>
  )
}

export const Searchbar = ({ siteId }: { siteId: string }) => {
  const { isOpen, onOpen, onClose } = useDisclosure()

  return (
    <>
      <SearchModal
        key={String(isOpen)}
        isOpen={isOpen}
        onClose={onClose}
        siteId={siteId}
      />
      <SearchButton onClick={onOpen} />
    </>
  )
}
