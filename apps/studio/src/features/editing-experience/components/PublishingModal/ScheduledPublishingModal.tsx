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
import { BiCalendarCheck } from "react-icons/bi"

import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { useZodForm } from "~/lib/form"
import { schedulePublishClientSchema } from "~/schemas/schedule"
import { trpc } from "~/utils/trpc"
import { SchedulePublishDetails } from "./ScheduledPublishDetails"

interface ScheduledPublishingModalProps extends UseDisclosureReturn {
  pageId: number
  siteId: number
}

export const ScheduledPublishingModal = ({
  pageId,
  siteId,
  onClose,
  ...rest
}: ScheduledPublishingModalProps): JSX.Element => {
  const toast = useToast()
  const utils = trpc.useUtils()
  const [isScheduledPublishValid, setIsScheduledPublishValid] = useState(false)

  const methods = useZodForm<typeof schedulePublishClientSchema>({
    schema: schedulePublishClientSchema,
    defaultValues: {
      pageId,
      siteId,
    },
  })
  // Validate form when the date/time selected changes
  // so the banner can be shown to the users. Do NOT use trigger() since that
  // triggers validation and causes error messages to appear
  useEffect(() => {
    const validateForm = () => {
      const valid = schedulePublishClientSchema.safeParse(methods.getValues())
      setIsScheduledPublishValid(valid.success)
    }
    const subscription = methods.watch(() => void validateForm())
    return () => subscription.unsubscribe()
  }, [methods])

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
          (res: z.output<typeof schedulePublishClientSchema>) =>
            schedulePageMutation(res),
        )}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader mr="3.5rem">
            When should we publish this page?
          </ModalHeader>
          <ModalCloseButton size="lg" />
          <ModalBody>
            <FormProvider {...methods}>
              <VStack align="stretch" spacing="1.5rem">
                <SchedulePublishDetails />
                {isScheduledPublishValid && <SchedulePublishBanner />}
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
              Cancel
            </Button>
            <Button type="submit" isLoading={isScheduling}>
              Schedule publish
            </Button>
          </ModalFooter>
        </ModalContent>
      </form>
    </Modal>
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
        . Changes will be live on your site approximately 5-10 minutes after
        publishing.
      </Text>
    </HStack>
  )
}
