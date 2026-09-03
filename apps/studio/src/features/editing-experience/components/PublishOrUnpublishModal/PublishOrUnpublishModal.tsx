import type { UseDisclosureReturn } from "@chakra-ui/react"
import {
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
  ModalCloseButton,
  useToast,
} from "@opengovsg/design-system-react"
import { add, set } from "date-fns"
import posthog from "posthog-js"
import { useEffect, useState } from "react"
import { FormProvider } from "react-hook-form"
import { BiSolidInfoCircle } from "react-icons/bi"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { useZodForm } from "~/lib/form"
import {
  MINIMUM_SCHEDULE_LEAD_TIME_MINUTES,
  schedulePublishClientSchema,
  scheduleUnpublishClientSchema,
} from "~/schemas/schedule"
import { trpc } from "~/utils/trpc"
import { ResourceType } from "~prisma/generated/generatedEnums"

import type { ActionMode, PublishOrUnpublishAction } from "./ActionOptionsInput"
import { PUBLISHED_AFTER_EDITING_EVENT } from "../../constants"
import { useFireContentEditSurveyEvent } from "../../hooks/useContentEditSurvey"
import { ActionOptionsInput } from "./ActionOptionsInput"
import { ScheduleBanner } from "./ScheduleBanner"
import { ScheduleDateTimeFields } from "./ScheduleDateTimeFields"

interface PublishOrUnpublishModalProps extends UseDisclosureReturn {
  action: PublishOrUnpublishAction
  pageId: number
  siteId: number
  // Unpublish-only: whether the page has unsaved draft changes.
  hasDraftChanges?: boolean
  // Unpublish-only: set when this page is a Folder/Collection's landing
  // page, whose child pages must also be unpublished by the scheduled time.
  containerType?: ResourceType
}

const FIELD_NAMES: Record<
  PublishOrUnpublishAction,
  { date: string; time: string }
> = {
  publish: { date: "publishDate", time: "publishTime" },
  unpublish: { date: "unpublishDate", time: "unpublishTime" },
}

export const PublishOrUnpublishModal = ({
  action,
  pageId,
  siteId,
  hasDraftChanges = false,
  containerType,
  onClose,
  ...rest
}: PublishOrUnpublishModalProps): JSX.Element => {
  const toast = useToast()
  const utils = trpc.useUtils()
  const fireContentEditSurveyEvent = useFireContentEditSurveyEvent()
  const [mode, setMode] = useState<ActionMode | undefined>(undefined)
  const [isScheduleValid, setIsScheduleValid] = useState(false)

  const schema =
    action === "publish"
      ? schedulePublishClientSchema
      : scheduleUnpublishClientSchema
  const { date: dateField, time: timeField } = FIELD_NAMES[action]

  // Publish/unpublish schemas differ in shape, so typing is deliberately
  // loose here to let both flows share one form.
  const methods = useZodForm<typeof schedulePublishClientSchema>({
    schema: schema as typeof schedulePublishClientSchema,
    defaultValues: { pageId, siteId },
  })

  // Don't use trigger() here — it would surface field error messages
  // before the user has finished filling the form.
  useEffect(() => {
    const validateForm = () => {
      setIsScheduleValid(schema.safeParse(methods.getValues()).success)
    }
    const subscription = methods.watch(() => validateForm())
    return () => subscription.unsubscribe()
  }, [methods, schema])

  const invalidateAfterMutation = () =>
    Promise.all([
      utils.page.readPage.refetch({ pageId, siteId }),
      utils.site.getLocalisedSitemap.invalidate({
        resourceId: pageId,
        siteId,
      }),
      // liveStatus feeds the dashboard tables and index-page row — refresh
      // whichever of these is currently mounted.
      utils.resource.listWithoutRoot.invalidate(),
      utils.collection.list.invalidate(),
      utils.folder.getIndexpage.invalidate(),
    ])

  const { mutate: publishNow, isPending: isPublishingNow } =
    trpc.page.publishPage.useMutation({
      onSettled: () => {
        void invalidateAfterMutation()
        onClose()
      },
      onSuccess: () => {
        posthog.capture("page_published", { site_id: siteId })
        fireContentEditSurveyEvent(PUBLISHED_AFTER_EDITING_EVENT)
        toast({
          status: "success",
          title: "Page published successfully",
          ...BRIEF_TOAST_SETTINGS,
        })
      },
      onError: (error) => {
        console.error(`Error occurred when publishing page: ${error.message}`)
        // CONFLICT and PRECONDITION_FAILED carry actionable messages
        // (e.g. redirect to remove, ancestor lock) — show them verbatim.
        toast({
          status: "error",
          title:
            error.data?.code === "CONFLICT" ||
            error.data?.code === "PRECONDITION_FAILED"
              ? error.message
              : "Failed to publish page. Please contact Isomer support.",
          ...BRIEF_TOAST_SETTINGS,
        })
      },
    })

  const { mutate: schedulePageMutation, isPending: isSchedulingPublish } =
    trpc.page.schedulePage.useMutation({
      onSettled: () => {
        void invalidateAfterMutation()
        onClose()
      },
      onSuccess: () => {
        fireContentEditSurveyEvent(PUBLISHED_AFTER_EDITING_EVENT)
        toast({
          status: "success",
          title: "Page scheduled successfully",
          ...BRIEF_TOAST_SETTINGS,
        })
      },
      onError: (error) => {
        console.error(`Error occurred when scheduling page: ${error.message}`)
        // PRECONDITION_FAILED (e.g. ancestor lock) carries an actionable
        // message — show it verbatim.
        toast({
          status: "error",
          title:
            error.data?.code === "PRECONDITION_FAILED"
              ? error.message
              : "Failed to schedule page. Please contact Isomer support.",
          ...BRIEF_TOAST_SETTINGS,
        })
      },
    })

  const { mutate: unpublishNow, isPending: isUnpublishingNow } =
    trpc.page.unpublishPage.useMutation({
      onSettled: () => {
        void invalidateAfterMutation()
        onClose()
      },
      onSuccess: () => {
        toast({
          status: "success",
          title: "Page unpublished successfully",
          ...BRIEF_TOAST_SETTINGS,
        })
      },
      onError: (error) => {
        console.error(`Error occurred when unpublishing page: ${error.message}`)
        // PRECONDITION_FAILED (e.g. other pages inside still live) carries
        // an actionable message — show it verbatim.
        toast({
          status: "error",
          title:
            error.data?.code === "PRECONDITION_FAILED"
              ? error.message
              : "Failed to unpublish page. Please contact Isomer support.",
          ...BRIEF_TOAST_SETTINGS,
        })
      },
    })

  const {
    mutate: scheduleUnpublishMutation,
    isPending: isSchedulingUnpublish,
  } = trpc.page.scheduleUnpublish.useMutation({
    onSettled: () => {
      void invalidateAfterMutation()
      onClose()
    },
    onSuccess: () => {
      toast({
        status: "success",
        title: "Page scheduled to unpublish successfully",
        ...BRIEF_TOAST_SETTINGS,
      })
    },
    onError: (error) => {
      console.error(
        `Error occurred when scheduling unpublish: ${error.message}`,
      )
      // PRECONDITION_FAILED (e.g. child pages won't unpublish in time)
      // carries an actionable message — show it verbatim.
      toast({
        status: "error",
        title:
          error.data?.code === "PRECONDITION_FAILED"
            ? error.message
            : "Failed to schedule page unpublish. Please contact Isomer support.",
        ...BRIEF_TOAST_SETTINGS,
      })
    },
  })

  const isSubmitting =
    action === "publish"
      ? isPublishingNow || isSchedulingPublish
      : isUnpublishingNow || isSchedulingUnpublish

  const handleSubmitClick = () => {
    if (mode === "now") {
      if (action === "publish") {
        publishNow({ pageId, siteId })
      } else {
        unpublishNow({ pageId, siteId })
      }
    } else if (mode === "later") {
      void methods.handleSubmit((res) => {
        if (action === "publish") {
          schedulePageMutation(res)
        } else {
          scheduleUnpublishMutation(res)
        }
      })()
    }
  }

  const earliestSchedule = add(new Date(), {
    minutes: MINIMUM_SCHEDULE_LEAD_TIME_MINUTES,
  })

  const [selectedDate, selectedTime] = methods.watch([
    dateField as "publishDate",
    timeField as "publishTime",
  ])
  const scheduledAt =
    isScheduleValid && selectedDate && selectedTime
      ? (() => {
          const [hours, minutes] = String(selectedTime).split(":").map(Number)
          return set(selectedDate, {
            hours,
            minutes,
            seconds: 0,
            milliseconds: 0,
          })
        })()
      : null

  return (
    <Modal onClose={onClose} {...rest}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader mr="3.5rem">
          {action === "publish" ? "Publish this page?" : "Unpublish this page?"}
        </ModalHeader>
        <ModalCloseButton size="lg" />
        <ModalBody>
          <FormProvider {...methods}>
            <VStack align="stretch" spacing="1rem">
              <ActionOptionsInput
                action={action}
                value={mode}
                onChange={(value) => setMode(value as ActionMode)}
              />
              {mode === "later" && (
                <VStack align="stretch" spacing="1rem">
                  <ScheduleDateTimeFields
                    dateField={dateField}
                    timeField={timeField}
                    earliestSchedule={earliestSchedule}
                  />
                  {action === "unpublish" && containerType && (
                    <ChildPagesDisclaimerBanner containerType={containerType} />
                  )}
                  {scheduledAt && (
                    <ScheduleBanner action={action} scheduledAt={scheduledAt} />
                  )}
                </VStack>
              )}
              {action === "unpublish" && hasDraftChanges && (
                <DraftChangesBanner />
              )}
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
            {action === "publish" ? "No, don't publish" : "No, don't unpublish"}
          </Button>
          <Button
            onClick={handleSubmitClick}
            isDisabled={!mode}
            isLoading={isSubmitting}
          >
            {mode === "later"
              ? action === "publish"
                ? "Schedule publish"
                : "Schedule unpublish"
              : action === "publish"
                ? "Publish now"
                : "Unpublish now"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

const DraftChangesBanner = () => (
  <HStack
    spacing="0.5rem"
    alignItems="flex-start"
    bgColor="utility.feedback.info-subtle"
    borderRadius="0.25rem"
    p="0.75rem"
  >
    <Icon
      as={BiSolidInfoCircle}
      boxSize="1rem"
      color="utility.feedback.info"
      mt="0.125rem"
    />
    <Text textStyle="body-2" color="base.content.strong" display="inline">
      <Text as="span" textStyle="subhead-2">
        This page has unsaved draft changes.
      </Text>{" "}
      They'll be kept, and you can keep editing and publish them later.
    </Text>
  </HStack>
)

const ChildPagesDisclaimerBanner = ({
  containerType,
}: {
  containerType: ResourceType
}) => {
  const label =
    containerType === ResourceType.Collection ? "collection" : "folder"
  return (
    <HStack
      spacing="0.5rem"
      alignItems="flex-start"
      bgColor="utility.feedback.info-subtle"
      borderRadius="0.25rem"
      p="0.75rem"
    >
      <Icon
        as={BiSolidInfoCircle}
        boxSize="1rem"
        color="utility.feedback.info"
        mt="0.125rem"
      />
      <Text textStyle="body-2" color="base.content.strong">
        This {label}'s child pages must also be unpublished by this time.
      </Text>
    </HStack>
  )
}
