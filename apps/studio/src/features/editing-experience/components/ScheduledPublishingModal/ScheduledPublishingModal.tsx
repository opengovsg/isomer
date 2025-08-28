import type { UseDisclosureReturn } from "@chakra-ui/react"
import type { IconType } from "react-icons"
import type { z } from "zod"
import { useState } from "react"
import {
  Flex,
  FormControl,
  HStack,
  Icon,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from "@chakra-ui/react"
import {
  Button,
  DatePicker,
  FormErrorMessage,
  FormLabel,
  ModalCloseButton,
  useToast,
} from "@opengovsg/design-system-react"
import { add, isBefore, startOfDay } from "date-fns"
import { Controller, FormProvider, useFormContext } from "react-hook-form"
import { BiCheck, BiRocket, BiTimeFive } from "react-icons/bi"

import { TimeSelect } from "~/components/Select/TimeSelect"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { useZodForm } from "~/lib/form"
import {
  MINIMUM_SCHEDULE_LEAD_TIME_MINUTES,
  schedulePageSchema,
} from "~/schemas/page"
import { trpc } from "~/utils/trpc"

enum PublishMode {
  NOW,
  SCHEDULED,
}

interface ScheduledPublishingModalProps extends UseDisclosureReturn {
  pageId: number
  siteId: number
  // callback invoked to handle the publishing process now
  onPublishNow: () => void
}

export const ScheduledPublishingModal = ({
  pageId,
  siteId,
  onClose,
  onPublishNow,
  ...rest
}: ScheduledPublishingModalProps): JSX.Element => {
  const toast = useToast()
  const utils = trpc.useUtils()
  const [publishMode, setPublishMode] = useState<PublishMode>(PublishMode.NOW)
  const methods = useZodForm({
    schema: schedulePageSchema,
    defaultValues: {
      pageId,
      siteId,
    },
  })

  const { mutate: schedulePageMutation } = trpc.page.schedulePage.useMutation({
    onSettled: () => {
      onClose()
    },
    onSuccess: async () => {
      toast({
        status: "success",
        title: "Page scheduled successfully",
        ...BRIEF_TOAST_SETTINGS,
      })
      await utils.page.readPage.invalidate({ pageId, siteId })
      await utils.page.getCategories.invalidate({ pageId, siteId })
      await utils.site.getLocalisedSitemap.invalidate({
        resourceId: pageId,
        siteId,
      })
    },
    onError: async (error) => {
      console.error(`Error occurred when scheduling page: ${error.message}`)
      toast({
        status: "error",
        title: "Failed to schedule page. Please contact Isomer support.",
        ...BRIEF_TOAST_SETTINGS,
      })
      await utils.page.readPage.invalidate({ pageId, siteId })
    },
  })
  return (
    <Modal onClose={onClose} {...rest}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          // publish immediately if publish mode is now, else schedule publish
          if (publishMode === PublishMode.NOW) {
            onPublishNow()
          } else {
            methods.handleSubmit((res) => {
              schedulePageMutation(res)
            })
          }
        }}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader mr="3.5rem">Publish this page?</ModalHeader>
          <ModalCloseButton size="lg" />
          <ModalBody>
            <FormProvider {...methods}>
              <VStack spacing="1rem" align="stretch">
                <VStack align="stretch" spacing="1.5rem">
                  <Text textStyle="subhead-1">
                    When should we publish this page?
                  </Text>
                  <VStack spacing="0.75rem">
                    <PublishModeCard
                      icon={BiRocket}
                      title="Publish now"
                      description="Changes will be live on your site in approximately 5-10 minutes."
                      isSelected={publishMode === PublishMode.NOW}
                      onSelect={() => setPublishMode(PublishMode.NOW)}
                    />
                    <PublishModeCard
                      icon={BiTimeFive}
                      title="Publish later"
                      description="Let us know when the page should start publishing."
                      isSelected={publishMode === PublishMode.SCHEDULED}
                      onSelect={() => setPublishMode(PublishMode.SCHEDULED)}
                    />
                  </VStack>
                </VStack>
                <SchedulePublishDetails />
              </VStack>
            </FormProvider>
          </ModalBody>
          <ModalFooter>
            <Button mr={3} onClick={onClose} variant="clear">
              No, don't publish
            </Button>
            <Button type="submit">Publish now</Button>
          </ModalFooter>
        </ModalContent>
      </form>
    </Modal>
  )
}

const SchedulePublishDetails = () => {
  const {
    control,
    formState: { errors },
  } = useFormContext<z.input<typeof schedulePageSchema>>()
  return (
    <Flex w="100%">
      <FormControl isInvalid={!!errors.publishDate} flexGrow={1}>
        <FormLabel isRequired>Date</FormLabel>
        <Controller
          name="publishDate"
          control={control}
          render={({ field }) => (
            <DatePicker
              {...field}
              isDateUnavailable={(date) => {
                const earliestScheduleTime = add(new Date(), {
                  minutes: MINIMUM_SCHEDULE_LEAD_TIME_MINUTES,
                })
                return isBefore(
                  startOfDay(date),
                  startOfDay(earliestScheduleTime),
                )
              }}
            />
          )}
        />
        <FormErrorMessage>{errors.publishDate?.message}</FormErrorMessage>
      </FormControl>
      <FormControl isInvalid={!!errors.publishTime} flexGrow={1}>
        <FormLabel isRequired>Time</FormLabel>
        <Controller
          name="publishTime"
          control={control}
          render={({ field }) => <TimeSelect {...field} />}
        />
        <FormErrorMessage>{errors.publishDate?.message}</FormErrorMessage>
      </FormControl>
    </Flex>
  )
}

const PublishModeCard = ({
  icon,
  title,
  description,
  isSelected,
  onSelect,
}: {
  icon: IconType
  title: string
  description: string
  isSelected: boolean
  onSelect: () => void
}) => {
  return (
    <HStack
      border="1px"
      borderColor={isSelected ? "base.divider.brand" : "base.divider.medium"}
      boxShadow={isSelected ? "sm" : undefined}
      padding="0.75rem"
      spacing="0.5rem"
      cursor="pointer"
      borderRadius="md"
      onClick={onSelect}
    >
      <Icon
        as={icon}
        boxSize="1.25rem"
        color={isSelected ? "base.content.brand" : "base.content.strong"}
      />
      <VStack align="stretch" spacing={0}>
        <HStack display="flex" spacing="0.5rem" alignItems="center">
          <Text
            textStyle="subhead-2"
            color={isSelected ? "base.content.brand" : "base.content.strong"}
          >
            {title}
          </Text>
          {isSelected && (
            <Icon
              as={BiCheck}
              boxSize="1rem"
              color="utility.feedback.success"
            />
          )}
        </HStack>
        <Text textStyle="body-2">{description}</Text>
      </VStack>
    </HStack>
  )
}
