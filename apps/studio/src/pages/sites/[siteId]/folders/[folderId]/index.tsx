import { Suspense, useEffect } from "react"
import {
  Box,
  BreadcrumbItem,
  BreadcrumbLink,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  HStack,
  Icon,
  Input,
  MenuButton,
  MenuList,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Portal,
  Skeleton,
  Spacer,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react"
import {
  Breadcrumb,
  Button,
  Menu,
  useToast,
} from "@opengovsg/design-system-react"
import { BiData, BiFileBlank, BiFolder, BiLink } from "react-icons/bi"
import { z } from "zod"

import { MenuItem } from "~/components/Menu"
import { ResourceTable } from "~/features/dashboard/components/ResourceTable"
import { CreateFolderModal } from "~/features/editing-experience/components/CreateFolderModal"
import { CreatePageModal } from "~/features/editing-experience/components/CreatePageModal"
import { generateResourceUrl } from "~/features/editing-experience/components/utils"
import { useQueryParse } from "~/hooks/useQueryParse"
import { useZodForm } from "~/lib/form"
import { type NextPageWithLayout } from "~/lib/types"
import {
  editFolderSchema,
  MAX_FOLDER_PERMALINK_LENGTH,
  MAX_FOLDER_TITLE_LENGTH,
} from "~/schemas/folder"
import { AdminCmsSidebarLayout } from "~/templates/layouts/AdminCmsSidebarLayout"
import { trpc } from "~/utils/trpc"

const folderPageSchema = z.object({
  siteId: z.string(),
  folderId: z.string(),
})

const FolderPage: NextPageWithLayout = () => {
  const {
    isOpen: isPageCreateModalOpen,
    onOpen: onPageCreateModalOpen,
    onClose: onPageCreateModalClose,
  } = useDisclosure()
  const {
    isOpen: isFolderCreateModalOpen,
    onOpen: onFolderCreateModalOpen,
    onClose: onFolderCreateModalClose,
  } = useDisclosure()
  const {
    isOpen: isFolderSettingsModalOpen,
    onOpen: onFolderSettingsModalOpen,
    onClose: onFolderSettingsModalClose,
  } = useDisclosure()

  const { folderId, siteId } = useQueryParse(folderPageSchema)

  const [{ title, permalink }] = trpc.folder.readFolder.useSuspenseQuery({
    siteId: parseInt(siteId),
    resourceId: parseInt(folderId),
  })

  return (
    <>
      <VStack w="100%" p="1.75rem" gap="1rem">
        <VStack w="100%" align="start">
          <Breadcrumb size="sm">
            <BreadcrumbItem>
              <BreadcrumbLink isCurrentPage href={permalink}>
                <Text color="base.content.default">{title}</Text>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </Breadcrumb>
          <Flex w="full" flexDir="row">
            <HStack gap="0.75rem" flex={1}>
              <Box
                aria-hidden
                bg="brand.secondary.100"
                p="0.5rem"
                borderRadius="6px"
              >
                <BiData />
              </Box>
              <Text textStyle="h3">{title}</Text>
            </HStack>

            <Spacer />

            <HStack>
              <Button
                variant="outline"
                size="md"
                onClick={onFolderSettingsModalOpen}
              >
                Folder settings
              </Button>
              <Menu isLazy size="sm">
                <MenuButton as={Button} size="md" justifySelf="flex-end">
                  Create new...
                </MenuButton>
                <Portal>
                  <MenuList>
                    <MenuItem
                      onClick={onFolderCreateModalOpen}
                      icon={<BiFolder fontSize="1rem" />}
                    >
                      Folder
                    </MenuItem>
                    <MenuItem
                      onClick={onPageCreateModalOpen}
                      icon={<BiFileBlank fontSize="1rem" />}
                    >
                      Page
                    </MenuItem>
                  </MenuList>
                </Portal>
              </Menu>
            </HStack>
          </Flex>
          <HStack w="100%" justify="space-between" align="center" gap={0}>
            <Box />
          </HStack>
        </VStack>
        <Box width="100%">
          <ResourceTable
            siteId={parseInt(siteId)}
            resourceId={parseInt(folderId)}
          />
        </Box>
      </VStack>
      <CreatePageModal
        isOpen={isPageCreateModalOpen}
        onClose={onPageCreateModalClose}
        siteId={parseInt(siteId)}
      />
      <CreateFolderModal
        isOpen={isFolderCreateModalOpen}
        onClose={onFolderCreateModalClose}
        siteId={parseInt(siteId)}
      />
      <FolderSettingsModal
        isOpen={isFolderSettingsModalOpen}
        onClose={onFolderSettingsModalClose}
        siteId={siteId}
        resourceId={parseInt(folderId)}
      />
    </>
  )
}

FolderPage.getLayout = AdminCmsSidebarLayout
export default FolderPage

interface FolderSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  siteId: string
  resourceId: number
}
const FolderSettingsModal = ({
  isOpen,
  onClose,
  siteId,
  resourceId,
}: FolderSettingsModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <SuspendableModalContent
        isOpen={isOpen}
        siteId={siteId}
        resourceId={resourceId}
        onClose={onClose}
      />
    </Modal>
  )
}

const SuspendableModalContent = ({
  isOpen,
  onClose,
  siteId,
  resourceId,
}: FolderSettingsModalProps) => {
  const { setValue, register, handleSubmit, watch, formState, getFieldState } =
    useZodForm({
      defaultValues: {
        title: "",
        permalink: "",
      },
      schema: editFolderSchema.omit({ siteId: true, resourceId: true }),
    })
  const [{ title: originalTitle, permalink: originalPermalink, parentId }] =
    trpc.folder.readFolder.useSuspenseQuery({
      siteId: parseInt(siteId),
      resourceId,
    })
  const { errors, isValid } = formState
  const utils = trpc.useUtils()
  const toast = useToast()
  const { mutate, isLoading } = trpc.folder.editFolder.useMutation({
    onSettled: onClose,
    onSuccess: () => {
      void utils.site.list.invalidate()
      void utils.resource.list.invalidate()
      void utils.resource.getChildrenOf.invalidate({
        resourceId: parentId ? String(parentId) : null,
      })
      void utils.folder.readFolder.invalidate()
      toast({ title: "Folder created!", status: "success" })
    },
    onError: (err) => {
      toast({
        title: "Failed to create folder",
        status: "error",
        // TODO: check if this property is correct
        description: err.message,
      })
    },
  })

  const onSubmit = handleSubmit((data) => {
    mutate({ ...data, resourceId: String(resourceId), siteId })
  })

  const [title, permalink] = watch(["title", "permalink"])

  useEffect(() => {
    const permalinkFieldState = getFieldState("permalink")
    // This allows the syncing to happen only when the page title is not dirty
    // Dirty means user has changed the value AND the value is not the same as the default value of "".
    // Once the value has been cleared, dirty state will reset.
    if (!permalinkFieldState.isDirty) {
      setValue("permalink", generateResourceUrl(title || ""), {
        shouldValidate: !!title,
      })
    }
  }, [getFieldState, setValue, title])

  useEffect(() => {
    if (originalPermalink) {
      setValue("title", originalTitle)
    }

    if (originalPermalink) {
      setValue("permalink", originalPermalink)
    }
  }, [originalPermalink, originalTitle])

  return (
    <Suspense fallback={<Skeleton />}>
      <ModalContent key={String(isOpen)}>
        <form onSubmit={onSubmit}>
          <ModalHeader>Edit "{originalTitle}"</ModalHeader>
          <ModalCloseButton size="sm" />
          <ModalBody>
            <VStack alignItems="flex-start" spacing="1.5rem">
              <FormControl isInvalid={!!errors.title}>
                <FormLabel color="base.content.strong">
                  Folder name
                  <FormHelperText color="base.content.default">
                    This will be the title of the index page of your folder.
                  </FormHelperText>
                </FormLabel>

                <Input
                  placeholder="This is a title for your new folder"
                  {...register("title")}
                />
                {errors.title?.message ? (
                  <FormErrorMessage>{errors.title.message}</FormErrorMessage>
                ) : (
                  <FormHelperText mt="0.5rem" color="base.content.medium">
                    {MAX_FOLDER_TITLE_LENGTH - (title || "").length} characters
                    left
                  </FormHelperText>
                )}
              </FormControl>
              <FormControl isInvalid={!!errors.permalink}>
                <FormLabel color="base.content.strong">
                  Folder URL
                  <FormHelperText color="base.content.default">
                    This will be applied to every child under this folder.
                  </FormHelperText>
                </FormLabel>
                <Input
                  placeholder="This is a url for your new page"
                  {...register("permalink")}
                />
                {errors.permalink?.message && (
                  <FormErrorMessage>
                    {errors.permalink.message}
                  </FormErrorMessage>
                )}

                <Box
                  mt="0.5rem"
                  py="0.5rem"
                  px="0.75rem"
                  bg="interaction.support.disabled"
                >
                  <Icon mr="0.5rem" as={BiLink} />
                  {permalink}
                </Box>

                <FormHelperText mt="0.5rem" color="base.content.medium">
                  {MAX_FOLDER_PERMALINK_LENGTH - (permalink || "").length}{" "}
                  characters left
                </FormHelperText>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button mr={3} onClick={onClose} variant="clear">
              Close
            </Button>
            <Button isLoading={isLoading} isDisabled={!isValid} type="submit">
              Save changes
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Suspense>
  )
}
