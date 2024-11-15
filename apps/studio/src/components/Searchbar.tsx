import { useState } from "react"
import {
  ComponentWithAs as _,
  Box,
  ButtonProps,
  chakra,
  HStack,
  Icon,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useDisclosure,
  useMultiStyleConfig,
  VStack,
} from "@chakra-ui/react"
import { Searchbar as OgpSearchBar } from "@opengovsg/design-system-react"
import { useDebounce } from "@uidotdev/usehooks"
import { ResourceType } from "~prisma/generated/generatedEnums"
import { BiSearch } from "react-icons/bi"

import { ICON_MAPPINGS } from "~/features/dashboard/components/DirectorySidebar/constants"
import { useBanner } from "~/hooks/useBanner"
import { trpc } from "~/utils/trpc"

const getTotalCount = (pages: { totalCount: number | null }[]) => {
  return pages.reduce((acc, page) => acc + (page.totalCount ?? 0), 0)
}

interface SearchResultProps {
  type: ResourceType
  title: string
  fullPermalink: string
}
const SearchResult = ({ type, title, fullPermalink }: SearchResultProps) => {
  return (
    <HStack py="0.75rem" px="0.5rem" spacing="1rem" w="full" as="button">
      <Icon as={ICON_MAPPINGS[type]} fill="base.content.medium" />
      <VStack alignItems="flex-start" spacing={0}>
        <Text textStyle="subhead-2" textColor="base.content.default">
          {title}
        </Text>
        <Text textStyle="caption-2" textColor="base.content.medium">
          {fullPermalink}
        </Text>
      </VStack>
    </HStack>
  )
}

const RecentlyEdited = ({ items }: { items: SearchResultProps[] }) => {
  // TODO: Replace this with the trpc function to fetch the search results
  return (
    <VStack>
      {items.map((item) => {
        return <SearchResult {...item} />
      })}
    </VStack>
  )
}

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  siteId: string
}
const SearchModal = ({ siteId, isOpen, onClose }: SearchModalProps) => {
  const banner = useBanner()
  const mt = banner ? "3rem" : "0.5rem"
  const [searchValue, setSearchValue] = useState("")
  const debouncedSearchTerm = useDebounce(searchValue, 300)
  const { data, isLoading } = trpc.resource.search.useInfiniteQuery({
    siteId,
    query: debouncedSearchTerm,
    limit: 5,
  })

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay bg="none" backdropFilter="brightness(80%)" />
      <ModalContent
        mx="auto"
        rounded="md"
        w="42.5rem"
        p={0}
        mt={`calc(${mt} - 1px)`}
        boxShadow="md"
      >
        <ModalHeader
          p={0}
          borderTopRadius="md"
          border="1px solid"
          borderColor="base.divider.medium"
        >
          <OgpSearchBar
            defaultIsExpanded
            onChange={({ target }) => setSearchValue(target.value)}
            w="42.5rem"
            border={0}
            placeholder={`Search pages, collections, or folders by name. e.g. "Speech by Minister"`}
          />
        </ModalHeader>
        <ModalBody
          border="1px solid"
          borderColor="base.divider.medium"
          borderTop={0}
          borderBottom={0}
          px="1.25rem"
          pt="1.5rem"
          pb="1rem"
          maxH="25.25rem"
        >
          <Text textColor="base.content.medium" textStyle="body-2" mb="0.5rem">
            {searchValue && isLoading && "Searching your websites high and low"}
            {!searchValue && "Recently edited on your site"}
            {data &&
              searchValue &&
              !isLoading &&
              `${getTotalCount(data.pages)} results found with ${searchValue} in title.`}
          </Text>
          <RecentlyEdited
            items={data?.pages[0]?.suggestions.recentlyEdited ?? []}
          />
        </ModalBody>
        <ModalFooter
          bg="base.canvas.alt"
          border="1px solid"
          borderColor="base.divider.medium"
          px="1.25rem"
          display="flex"
          flexDir="row"
          py="0.75rem"
          justifyContent="flex-start"
          borderBottomRadius="md"
        >
          <Text textStyle="caption-2" textColor="base.content.medium">
            Tip: Type in the full title to get the most accurate search results.
          </Text>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

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
      py="3"
      px="4"
      rounded="md"
      border="1px solid"
      borderColor="base.divider.strong"
      aria-label="search-button"
      {...props}
    >
      <Box __css={styles.icon}>
        <Icon as={BiSearch} fill="base.content.medium" />
      </Box>
      <HStack w="full" ml="3" spacing="4px">
        <Text
          textColor="interaction.support.placeholder"
          textAlign="left"
          flex="1"
          textStyle="body-2"
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
