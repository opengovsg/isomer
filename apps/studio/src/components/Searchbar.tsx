import { useMemo } from "react"
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
import { ResourceType } from "~prisma/generated/generatedEnums"
import { IconType } from "react-icons"
import {
  BiData,
  BiFile,
  BiFolder,
  BiHome,
  BiLink,
  BiSearch,
  BiSort,
} from "react-icons/bi"

import { useBanner } from "~/hooks/useBanner"
import { trpc } from "~/utils/trpc"

const MOCK_RECENTLY_EDITED = [
  {
    type: ResourceType.Page,
    title: "MOH New medisave subsidy",
    permalink: "/press-releases/moh-new-medisave-subsidy-release/testing",
  },
  {
    type: ResourceType.Collection,
    title: "[DO NOT PUBLISH] MOH New medisave subsidy",
    permalink: "/press-releases/moh-new-medisave-subsidy-release/testing",
  },
  {
    type: ResourceType.CollectionLink,
    title: "MOH New medisave subsidy",
    permalink:
      "/newsroom/intervention-by-minister-for-health-mr-ong-ye-kung-at-the-g20-joint-finance-and-health-summit/testing",
  },
  {
    type: ResourceType.Folder,
    title: "MOH New medisave subsidy",
    permalink: "testing",
  },
  {
    type: ResourceType.CollectionPage,
    title: "MOH New medisave subsidy",
    permalink: "testing",
  },
]

interface SearchResultProps {
  type: ResourceType
  title: string
  permalink: string
}
const SearchResult = ({ type, title, permalink }: SearchResultProps) => {
  const ResourceTypeIcon: IconType = useMemo(() => {
    switch (type) {
      case ResourceType.RootPage:
        return BiHome
      case ResourceType.IndexPage:
      case ResourceType.Page:
        return BiFile
      case ResourceType.Folder:
        return BiFolder
      case ResourceType.Collection:
        return BiData
      case ResourceType.CollectionPage:
        return BiFile
      case ResourceType.CollectionLink:
        return BiLink
      case ResourceType.FolderMeta:
        return BiSort
    }
  }, [type])
  return (
    <HStack py="0.75rem" px="0.5rem" spacing="1rem" w="full">
      <Icon as={ResourceTypeIcon} fill="base.content.medium" />
      <VStack alignItems="flex-start">
        <Text textStyle="subhead-2" textColor="base.content.default">
          {title}
        </Text>
        <Text textStyle="caption-2" textColor="base.content.medium">
          {permalink}
        </Text>
      </VStack>
    </HStack>
  )
}

const RecentlyEdited = ({
  siteId: _siteId,
}: Pick<SearchModalProps, "siteId">) => {
  // TODO: Replace this with the trpc function to fetch the search results
  const recent = MOCK_RECENTLY_EDITED
  return (
    <VStack>
      {recent.map((item) => {
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
  const { data, isLoading } = trpc.resource.search.useInfiniteQuery({
    siteId,
    query: searchValue,
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
      >
        <ModalHeader
          p={0}
          rounded="md"
          border="1px solid"
          borderColor="base.divider.medium"
          borderBottomRadius={0}
        >
          <OgpSearchBar
            defaultIsExpanded
            onSearch={setSearchValue}
            w="42.5rem"
            placeholder={`What do you need to edit today? E.g., "Press release", "Speech by"`}
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
        >
          <Text textColor="base.content.medium" textStyle="body-2" mb="0.5rem">
            Recently edited on your site
          </Text>
          <RecentlyEdited siteId={siteId} />
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
          {`What do you need to edit today? E.g., "Press release", "Speech by"`}
        </Text>
      </HStack>
    </chakra.button>
  )
}

export const Searchbar = ({ siteId }: { siteId: string }) => {
  const { isOpen, onOpen, onClose } = useDisclosure()

  return (
    <>
      <SearchModal isOpen={isOpen} onClose={onClose} siteId={siteId} />
      <SearchButton onClick={onOpen} />
    </>
  )
}
