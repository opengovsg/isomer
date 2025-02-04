import { Suspense, useMemo } from "react"
import {
  chakra,
  FormControl,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Skeleton,
  Text,
  VStack,
} from "@chakra-ui/react"
import {
  Button,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Infobox,
  ModalCloseButton,
  useToast,
} from "@opengovsg/design-system-react"
import { useAtom } from "jotai"
import { Controller } from "react-hook-form"
import { BiLink } from "react-icons/bi"
import { z } from "zod"

import type { PageSettingsState } from "~/features/dashboard/atoms"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { pageSettingsModalAtom } from "~/features/dashboard/atoms"
import { useQueryParse } from "~/hooks/useQueryParse"
import { useZodForm } from "~/lib/form"
import { generateBasePermalinkSchema } from "~/schemas/common"
import {
  basePageSettingsSchema,
  MAX_PAGE_URL_LENGTH,
  MAX_TITLE_LENGTH,
} from "~/schemas/page"
import { trpc } from "~/utils/trpc"
import { generateResourceUrl } from "../../editing-experience/components/utils"

const editSettingsSchema = z.object({
  siteId: z.coerce.number(),
})

const PageSettingsModalContent = ({
  pageId,
  type,
  onClose,
}: PageSettingsState & { onClose: () => void }) => {
  const { siteId } = useQueryParse(editSettingsSchema)
  const [{ title: originalTitle }] = trpc.page.readPage.useSuspenseQuery({
    pageId: Number(pageId),
    siteId,
  })
  const [permalinkTree] = trpc.page.getPermalinkTree.useSuspenseQuery({
    pageId: Number(pageId),
    siteId,
  })
  const {
    register,
    watch,
    control,
    reset,
    handleSubmit,
    formState: { isDirty, errors },
  } = useZodForm({
    schema: basePageSettingsSchema.omit({ pageId: true, siteId: true }).extend({
      meta: z.unknown(),
      permalink: generateBasePermalinkSchema("page")
        .min(1, {
          message: "Enter a URL for this page",
        })
        .max(MAX_PAGE_URL_LENGTH, {
          message: `Page URL should be shorter than ${MAX_PAGE_URL_LENGTH} characters.`,
        }),
    }),
    defaultValues: {
      title: originalTitle,
      permalink: permalinkTree[permalinkTree.length - 1] || "",
    },
  })

  const [title, permalink] = watch(["title", "permalink"])
  const permalinksToRender = useMemo(() => {
    // Case 1: Root page
    if (permalinkTree.length === 0 || permalinkTree[0] === "") {
      return {
        permalink: "/",
        parentPermalinks: "",
      }
    }

    const parentPermalinks = permalinkTree.slice(0, -1).join("/").trim()
    // Case 2: Parent is root page
    if (!parentPermalinks) {
      return {
        permalink,
        parentPermalinks: "/",
      }
    }

    // Default case: Nested page
    return {
      permalink,
      parentPermalinks: `/${parentPermalinks}/`,
    }
  }, [permalink, permalinkTree])

  const utils = trpc.useUtils()
  const toast = useToast(BRIEF_TOAST_SETTINGS)

  const { mutate: updatePageSettings } = trpc.page.updateSettings.useMutation({
    onSuccess: async () => {
      // TODO: we should use a specialised query for this rather than the general one that retrives the page and the blob
      await utils.page.invalidate()
      await utils.resource.invalidate()
      await utils.folder.invalidate()
      await utils.collection.invalidate()

      toast({
        title: "Saved and published page settings",
        description: "Check your site later to see the changes",
        status: "success",
      })
    },
    onError: (error) => {
      toast({
        title: "Failed to save page settings",
        description: error.message,
        status: "error",
      })
      reset()
    },
  })

  const onSubmit = handleSubmit((data) => {
    if (isDirty) {
      updatePageSettings(
        {
          pageId: Number(pageId),
          siteId,
          type,
          ...data,
        },
        {
          onSuccess: () => reset(data),
          onSettled: onClose,
        },
      )
    }
  })

  return (
    <ModalContent key={pageId}>
      <ModalHeader>Page settings</ModalHeader>
      <ModalCloseButton />
      <ModalBody>
        {/* NOTE: doing this because typescript doesn't infer that the property has to exist from the assertion on modal */}
        <VStack w="100%" gap="1rem" alignItems="flex-start">
          <FormControl isRequired isInvalid={!!errors.title}>
            <FormLabel description="Title should be descriptive">
              Page title
            </FormLabel>
            <Input
              w="100%"
              noOfLines={1}
              maxLength={MAX_TITLE_LENGTH}
              {...register("title")}
              mt="0.5rem"
            />
            <FormHelperText pt="0.5rem">
              {MAX_TITLE_LENGTH - title.length} characters left
            </FormHelperText>
            <FormErrorMessage>{errors.title?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isRequired isInvalid={!!errors.permalink}>
            <FormLabel>Page URL</FormLabel>
            <Controller
              control={control}
              name="permalink"
              render={({ field: { onChange, ...field } }) => (
                <Input
                  placeholder={"URL will be autopopulated if left untouched"}
                  noOfLines={1}
                  mt="0.5rem"
                  w="100%"
                  {...field}
                  onChange={(e) => {
                    onChange(
                      generateResourceUrl(e.target.value).slice(
                        0,
                        MAX_PAGE_URL_LENGTH,
                      ),
                    )
                  }}
                />
              )}
            />
            <Infobox
              my="0.5rem"
              icon={<BiLink />}
              variant="info-secondary"
              size="sm"
            >
              <Text textStyle="subhead-2" overflow="hidden">
                <chakra.span color="base.content.medium">
                  {permalinksToRender.parentPermalinks}
                </chakra.span>
                {permalinksToRender.permalink}
              </Text>
            </Infobox>
            <FormHelperText>
              {MAX_PAGE_URL_LENGTH - permalink.length} characters left
            </FormHelperText>
            <FormErrorMessage>{errors.permalink?.message}</FormErrorMessage>
          </FormControl>

          <Infobox variant="warning">
            Changes to your page title and URL will get published immediately.
            If you don't want to publish them, make this change later.
          </Infobox>
        </VStack>
      </ModalBody>

      <ModalFooter>
        <Button mr={3} variant="clear" onClick={onClose}>
          Close
        </Button>
        <Button onClick={onSubmit}>Publish changes immediately</Button>
      </ModalFooter>
    </ModalContent>
  )
}

export const PageSettingsModal = () => {
  const [pageSettingsModalState, setPageSettingsModalState] = useAtom(
    pageSettingsModalAtom,
  )

  const onClose = () => {
    setPageSettingsModalState(null)
  }

  return (
    <Modal isOpen={!!pageSettingsModalState?.pageId} onClose={onClose}>
      <ModalOverlay />
      {pageSettingsModalState?.pageId && (
        <Suspense fallback={<Skeleton />}>
          <PageSettingsModalContent
            onClose={onClose}
            {...pageSettingsModalState}
          />
        </Suspense>
      )}
    </Modal>
  )
}
