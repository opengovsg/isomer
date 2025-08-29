import type { UseDisclosureReturn } from "@chakra-ui/react"
import type { IconType } from "react-icons"
import type { z } from "zod"
import { useEffect, useMemo, useState } from "react"
import {
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
  Badge,
  Button,
  DatePicker,
  FormErrorMessage,
  FormLabel,
  ModalCloseButton,
  useToast,
} from "@opengovsg/design-system-react"
import { add, format, isBefore, isSameDay, parse, startOfDay } from "date-fns"
import { Controller, FormProvider, useFormContext } from "react-hook-form"
import { BiCalendarCheck, BiCheck, BiRocket, BiTimeFive } from "react-icons/bi"

import type { schedulePublishClientSchema } from "~/schemas/schedule"
import { TimeSelect } from "~/components/Select/TimeSelect"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { useZodForm } from "~/lib/form"
import {
  MINIMUM_SCHEDULE_LEAD_TIME_MINUTES,
  publishClientSchema,
  PublishMode,
} from "~/schemas/schedule"
import { trpc } from "~/utils/trpc"

interface ScheduledPublishingModalProps extends UseDisclosureReturn {
  pageId: number
  siteId: number
  // callback invoked to handle the publishing process now
  onPublishNow: (pageId: number, siteId: number) => void
  // used for the loading state of the publish button
  isPublishingNow?: boolean
}

export const ScheduledPublishingModal = ({
  pageId,
  siteId,
  onClose,
  onPublishNow,
  isPublishingNow,
  ...rest
}: ScheduledPublishingModalProps): JSX.Element => {
  const toast = useToast()
  const utils = trpc.useUtils()
  const [isScheduledPublishValid, setIsScheduledPublishValid] = useState(false)

  const methods = useZodForm<typeof publishClientSchema>({
    schema: publishClientSchema,
    defaultValues: {
      publishMode: PublishMode.NOW,
      pageId,
      siteId,
    },
  })
  const publishMode = methods.watch("publishMode")
  // Validate form when publish mode changes or when the date/time selected changes
  // so the banner can be shown to the users. Do NOT use trigger() since that
  // triggers validation and causes error messages to show up
  useEffect(() => {
    const validateForm = () => {
      if (publishMode === PublishMode.NOW) setIsScheduledPublishValid(false)
      const valid = publishClientSchema.safeParse(methods.getValues())
      setIsScheduledPublishValid(valid.success)
    }
    const subscription = methods.watch(() => void validateForm())
    return () => subscription.unsubscribe()
  }, [methods, publishMode])

  const { mutate: schedulePageMutation, isPending: isScheduling } =
    trpc.page.schedulePage.useMutation({
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
        onSubmit={methods.handleSubmit(
          (res: z.output<typeof publishClientSchema>) => {
            // publish immediately if publish mode is now, else schedule publish
            if (res.publishMode === PublishMode.NOW) {
              onPublishNow(res.pageId, res.siteId)
            } else {
              schedulePageMutation(res)
            }
          },
        )}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader mr="3.5rem">Publish this page?</ModalHeader>
          <ModalCloseButton size="lg" />
          <ModalBody>
            <FormProvider {...methods}>
              <VStack align="stretch" spacing="1.5rem">
                <VStack spacing="1rem" align="stretch">
                  <VStack align="stretch" spacing="1.5rem">
                    <Text textStyle="subhead-1">
                      When should we publish this page?
                    </Text>
                    <VStack spacing="0.75rem" align="stretch">
                      <PublishModeCard
                        icon={BiRocket}
                        title="Publish now"
                        description="Changes will be live on your site in approximately 5-10 minutes."
                        isSelected={publishMode === PublishMode.NOW}
                        onSelect={() =>
                          methods.setValue("publishMode", PublishMode.NOW)
                        }
                      />
                      <PublishModeCard
                        icon={BiTimeFive}
                        title="Publish later"
                        description="Let us know when the page should start publishing."
                        isSelected={publishMode === PublishMode.SCHEDULED}
                        onSelect={() =>
                          methods.setValue("publishMode", PublishMode.SCHEDULED)
                        }
                      />
                    </VStack>
                  </VStack>
                  {publishMode === PublishMode.SCHEDULED && (
                    <SchedulePublishDetails />
                  )}
                </VStack>
                {publishMode === PublishMode.SCHEDULED &&
                  isScheduledPublishValid && <SchedulePublishBanner />}
              </VStack>
            </FormProvider>
          </ModalBody>
          <ModalFooter>
            <Button
              mr={3}
              onClick={onClose}
              variant="clear"
              color="base.content.strong"
            >
              No, don't publish
            </Button>
            <Button type="submit" isLoading={isPublishingNow || isScheduling}>
              {publishMode === PublishMode.NOW
                ? "Publish now"
                : "Schedule publish"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </form>
    </Modal>
  )
}

/**
 * if the date provided is equal to the earliestSchedule's date, the earliest allowable time should be set to the FIRST
 * time slot after the current minimum allowable time
 * @param selectedDate Date selected inside the datepicker
 * @param earliestSchedule Earliest schedule time, based on the current date and MINIMUM_SCHEDULE_LEAD_TIME_MINUTES
 * @returns
 */
const getEarliestAllowableTime = (
  selectedDate: Date,
  earliestSchedule: Date,
) => {
  if (isSameDay(selectedDate, earliestSchedule)) {
    return {
      hours: earliestSchedule.getHours(),
      minutes: earliestSchedule.getMinutes(),
    }
  }
  return undefined
}

const SchedulePublishDetails = () => {
  const {
    resetField,
    watch,
    control,
    formState: { errors },
  } = useFormContext<z.input<typeof schedulePublishClientSchema>>()

  const publishDate = watch("publishDate")
  const publishTime = watch("publishTime")
  // this is the earliest date and time that the user can schedule a publish for
  const { earliestAllowableTime, earliestSchedule } = useMemo(() => {
    const earliestSchedule = add(new Date(), {
      minutes: MINIMUM_SCHEDULE_LEAD_TIME_MINUTES,
    })
    const earliestAllowableTime = getEarliestAllowableTime(
      publishDate,
      earliestSchedule,
    )
    // if there is an earliest allowable time and the indicated publish time is out of range
    // reset the publish time to make the user re-input the time
    if (
      earliestAllowableTime &&
      publishTime &&
      isBefore(parse(publishTime, "HH:mm", new Date()), earliestSchedule)
    ) {
      resetField("publishTime")
    }
    return {
      earliestSchedule,
      earliestAllowableTime,
    }
  }, [publishDate, publishTime, resetField])

  return (
    <VStack align="stretch" spacing="0.5rem">
      <HStack spacing="1.5rem" w="100%" alignItems="flex-start">
        <FormControl isInvalid={!!errors.publishDate} flexGrow={1}>
          <FormLabel isRequired>Date</FormLabel>
          <Controller
            name="publishDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                {...field}
                isDateUnavailable={(date) => {
                  return isBefore(
                    startOfDay(date),
                    startOfDay(earliestSchedule),
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
            render={({ field }) => (
              <TimeSelect
                {...field}
                earliestAllowableTime={earliestAllowableTime}
              />
            )}
          />
          <FormErrorMessage>{errors.publishTime?.message}</FormErrorMessage>
        </FormControl>
      </HStack>
      <QuickSelectTimeSection earliestAllowableTime={earliestAllowableTime} />
    </VStack>
  )
}

const QuickSelectTimeSection = ({
  earliestAllowableTime,
}: {
  earliestAllowableTime: { hours: number; minutes: number } | undefined
}) => {
  const optionsToShow = useMemo(() => {
    // the array of pills to display in the section
    const quickSelectTimes: { hours: number; minutes: number }[] = [
      { hours: 0, minutes: 0 },
      { hours: 9, minutes: 0 },
      { hours: 13, minutes: 0 },
      { hours: 17, minutes: 0 },
    ]
    return quickSelectTimes.filter(({ hours, minutes }) => {
      // filter out the time if it is before the earliest allowable time
      // since both are kept as {hours, minutes}, we don't need to convert them to Date objects
      if (!earliestAllowableTime) return true
      return (
        hours > earliestAllowableTime.hours ||
        (hours === earliestAllowableTime.hours &&
          minutes >= earliestAllowableTime.minutes)
      )
    })
  }, [earliestAllowableTime])
  const { setValue } =
    useFormContext<z.input<typeof schedulePublishClientSchema>>()
  return (
    <>
      {optionsToShow.length > 0 && (
        <VStack align="stretch" spacing="0.5rem">
          <Text textStyle="caption-2">Quick select a time?</Text>
          <HStack spacing="0.5rem">
            {optionsToShow.map((time) => {
              const date = new Date()
              date.setHours(time.hours, time.minutes, 0, 0)
              const displayFormatted = format(date, "h:mm a")
              const valueFormatted = format(date, "HH:mm")
              return (
                <Badge
                  key={displayFormatted}
                  variant="outline"
                  cursor="pointer"
                  borderWidth="1px"
                  borderColor="blue.200"
                  onClick={() => setValue("publishTime", valueFormatted)}
                >
                  <Text textStyle="legal" color="interaction.main.default">
                    {displayFormatted}
                  </Text>
                </Badge>
              )
            })}
          </HStack>
        </VStack>
      )}
    </>
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
      display="flex"
      alignItems="flex-start"
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
        boxSize="1.5rem"
        py="0.125rem"
        color={isSelected ? "base.content.brand" : "base.content.strong"}
      />
      <VStack align="stretch" spacing={0}>
        <HStack display="flex" spacing="0" alignItems="center">
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

const SchedulePublishBanner = () => {
  const { getValues } =
    useFormContext<z.input<typeof schedulePublishClientSchema>>()

  return (
    <HStack
      spacing="0.5rem"
      alignItems="flex-start"
      bgColor="utility.feedback.info-subtle"
      borderRadius="0.25rem"
      p="0.75rem"
    >
      <Icon as={BiCalendarCheck} boxSize="1rem" color="base.content.default" />
      <Text textStyle="body-2" color="base.content.strong" display="inline">
        We will publish this page at{" "}
        <Text display="inline" textStyle="subhead-2">
          {format(
            parse(getValues("publishTime"), "HH:mm", new Date()),
            "hh:mm a",
          )}
        </Text>
        , Singapore Standard Time, on{" "}
        <Text display="inline" textStyle="subhead-2">
          {format(getValues("publishDate"), "MMMM d, yyyy")}
        </Text>
        . Changes will be live on your site approximately 15-30 minutes after
        publishing.
      </Text>
    </HStack>
  )
}
