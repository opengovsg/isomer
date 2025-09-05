import type { UseDisclosureReturn } from "@chakra-ui/react"
import type { z } from "zod"
import { useEffect, useState } from "react"
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
import { format, parse } from "date-fns"
import { FormProvider, useFormContext } from "react-hook-form"
import { BiCalendarCheck, BiRocket, BiTimeFive } from "react-icons/bi"

import type { schedulePublishClientSchema } from "~/schemas/schedule"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { useZodForm } from "~/lib/form"
import { publishClientSchema, PublishMode } from "~/schemas/schedule"
import { trpc } from "~/utils/trpc"
import { PublishModeCard } from "./PublishModeCard"
import { SchedulePublishDetails } from "./ScheduledPublishDetails"

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
  // triggers validation and causes error messages to appear
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
      onSettled: async () => {
        await utils.page.readPage.refetch({ pageId, siteId })
        onClose()
      },
      onSuccess: () => {
        toast({
          status: "success",
          title: "Page scheduled successfully",
          ...BRIEF_TOAST_SETTINGS,
        })
      },
      onError: (error) => {
        console.error(`Error occurred when scheduling page: ${error.message}`)
        toast({
          status: "error",
          title: "Failed to schedule page. Please contact Isomer support.",
          ...BRIEF_TOAST_SETTINGS,
        })
      },
    })
  return (
    <Modal onClose={onClose} {...rest}>
      <form
        onSubmit={methods.handleSubmit(
          (res: z.output<typeof publishClientSchema>) => {
            // publish immediately if publish mode is now, else schedule publish
            switch (res.publishMode) {
              case PublishMode.NOW:
                onPublishNow(res.pageId, res.siteId)
                break
              case PublishMode.SCHEDULED:
                schedulePageMutation(res)
                break
              default:
                const _exhaustiveCheck: never = res
                throw new Error(
                  `Unknown publish mode. Please check the publish mode type`,
                )
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
              {getPublishButtonLabel(publishMode)}
            </Button>
          </ModalFooter>
        </ModalContent>
      </form>
    </Modal>
  )
}

const getPublishButtonLabel = (publishMode: PublishMode): string => {
  switch (publishMode) {
    case PublishMode.NOW:
      return "Publish now"
    case PublishMode.SCHEDULED:
      return "Schedule publish"
    default:
      // Exhaustive check: ensures all enum values are handled
      const _exhaustiveCheck: never = publishMode
      throw new Error(
        `Unknown publish mode. Please check the publish mode type`,
      )
  }
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
        . Changes will be live on your site approximately 5-10 minutes after
        publishing.
      </Text>
    </HStack>
  )
}
