import {
  ComponentWithAs as _,
  Box,
  Button,
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
} from "@chakra-ui/react"
import { BiSearch } from "react-icons/bi"

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}
const SearchModal = ({ isOpen, onClose }: SearchModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay bg="none" backdropFilter="brightness(80%)" />
      <ModalContent rounded="md" w="fit-content" maxW="fit-content" p={0}>
        <ModalHeader
          p={0}
          rounded="md"
          border="1px solid"
          borderColor="base.divider.medium"
          borderBottomRadius={0}
        >
          <SearchButton onClick={console.log} border={0} borderRadius={0} />
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
          <Text>Hello</Text>
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

export const Searchbar = () => {
  const { isOpen, onOpen, onClose } = useDisclosure()

  return (
    <>
      <SearchModal isOpen={isOpen} onClose={onClose} />
      <SearchButton onClick={onOpen} />
    </>
  )
}
