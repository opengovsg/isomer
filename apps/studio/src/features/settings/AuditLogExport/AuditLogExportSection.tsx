import {
  Box,
  Center,
  Flex,
  FormControl,
  HStack,
  Icon,
  Stack,
  Text,
} from "@chakra-ui/react"
import {
  Button,
  Checkbox,
  FormErrorMessage,
  Link,
  SingleSelect,
  useToast,
} from "@opengovsg/design-system-react"
import { useContext, useMemo } from "react"
import { Controller } from "react-hook-form"
import { BiCheckShield, BiHelpCircle, BiInfoCircle } from "react-icons/bi"
import { ISOMER_SUPPORT_EMAIL } from "~/constants/misc"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { UserManagementContext } from "~/features/users"
import { useZodForm } from "~/lib/form"
import {
  AuditLogExportRequestedReportType,
  createAuditLogExportRequestSchema,
} from "~/schemas/audit"
import { trpc } from "~/utils/trpc"

import { getMonthOptions, toggleReportType } from "./utils"

interface AuditLogExportSectionProps {
  siteId: number
}

// Where "Which log do I need?" points. Feature-local because it is used in
// exactly one place; the exact help-centre article can be swapped here.
const WHICH_LOG_HELP_LINK =
  "https://support.isomer.gov.sg/en/articles/16159428-audit-logs"

// Map the current (partial) month to a friendlier label than "July 2026", so
// the picker reads the way the design does. The value is still the shared
// "yyyy-MM" so it stays in lockstep with the server contract.
const CURRENT_MONTH_LABEL = "Current month"

export const AuditLogExportSection = ({
  siteId,
}: AuditLogExportSectionProps): JSX.Element | null => {
  const ability = useContext(UserManagementContext)
  const canManageUsers = ability.can("manage", "UserManagement")

  const toast = useToast(BRIEF_TOAST_SETTINGS)

  const monthOptions = useMemo(() => {
    const options = getMonthOptions()
    const [current] = options
    // `getMonthOptions` always returns at least the current month; relabel it
    // so the picker reads "Current month" rather than e.g. "July 2026".
    if (!current) return options
    return [{ ...current, label: CURRENT_MONTH_LABEL }, ...options.slice(1)]
  }, [])

  // Form state lives in react-hook-form, validated by the same zod schema the
  // tRPC procedure uses (minus `siteId`, which comes from props), so client
  // and server validation cannot drift.
  const form = useZodForm({
    schema: createAuditLogExportRequestSchema.omit({ siteId: true }),
    defaultValues: { month: monthOptions[0]?.value ?? "" },
  })

  // `reportType` has no default value, so it is undefined until the user picks
  // at least one log type — widen the watched type accordingly. An undefined
  // reportType keeps the submit button disabled, mirroring the design's
  // initial empty state.
  const reportType: AuditLogExportRequestedReportType | undefined =
    form.watch("reportType")
  const isAccessSelected =
    reportType === AuditLogExportRequestedReportType.Access ||
    reportType === AuditLogExportRequestedReportType.Both
  const isActivitySelected =
    reportType === AuditLogExportRequestedReportType.Activity ||
    reportType === AuditLogExportRequestedReportType.Both

  const onToggle = (
    toggled:
      | typeof AuditLogExportRequestedReportType.Access
      | typeof AuditLogExportRequestedReportType.Activity,
  ) => {
    const next = toggleReportType(reportType, toggled)
    if (next) {
      form.setValue("reportType", next, { shouldValidate: true })
    } else {
      // Last selection cleared: drop the field back to its (absent) default so
      // the schema's "Select a report type" requirement disables submit again.
      form.resetField("reportType")
    }
  }

  const { mutate: createExportRequest, isPending } =
    trpc.audit.createExportRequest.useMutation({
      onSuccess: () => {
        form.reset()
        toast({
          title: "Export requested",
          description:
            "Your export is being generated. We'll email you a download link when it's ready.",
          status: "success",
        })
      },
      // The server returns typed, user-facing messages for the expected
      // rejections (future month, duplicate in flight, not an admin). Surface
      // those directly; fall back to a generic message for anything else.
      onError: (error) => {
        if (error.data?.code === "FORBIDDEN") {
          toast({
            title: "You don't have permission to export audit logs",
            description: "Only site admins can request an audit log export.",
            status: "error",
          })
          return
        }

        toast({
          title: "Couldn't request export",
          description:
            error.message ||
            `If this persists, please report this issue at ${ISOMER_SUPPORT_EMAIL}`,
          status: "error",
        })
      },
    })

  if (!canManageUsers) return null

  // handleSubmit only fires once the schema passes (reportType picked, month
  // valid), so the payload is exactly what the server-side `.input()` expects.
  const onSubmit = form.handleSubmit((data) =>
    createExportRequest({ siteId, ...data }),
  )

  return (
    <Stack spacing="1.5rem" align="flex-start">
      <Flex align="center" gap="0.75rem">
        <Center
          boxSize="2rem"
          bgColor="brand.secondary.100"
          borderRadius="6px"
          flexShrink={0}
        >
          <Icon
            as={BiCheckShield}
            boxSize="1rem"
            color="base.content.default"
          />
        </Center>
        <Text as="h1" textStyle="h3" color="base.content.default">
          Logs
        </Text>
      </Flex>

      <Stack
        as="form"
        spacing="1.25rem"
        align="flex-start"
        w="full"
        maxW="37.5rem"
        onSubmit={onSubmit}
      >
        <Flex align="center" justify="space-between" w="full">
          <Text textStyle="subhead-1" color="base.content.strong">
            Select log type(s) to export
          </Text>
          <Link
            href={WHICH_LOG_HELP_LINK}
            isExternal
            display="inline-flex"
            alignItems="center"
            gap="0.25rem"
            textStyle="caption-1"
          >
            <Icon as={BiHelpCircle} boxSize="1rem" />
            Which log do I need?
          </Link>
        </Flex>

        <Stack spacing="1.25rem" w="full">
          <LogTypeCard
            title="User access review logs"
            description="Get a list of users with access to your site, their role, and last login."
            isSelected={isAccessSelected}
            onToggle={() => onToggle(AuditLogExportRequestedReportType.Access)}
          />

          <LogTypeCard
            title="Audit logs"
            description="Review login history and when content was created, edited, deleted, and published."
            isSelected={isActivitySelected}
            onToggle={() =>
              onToggle(AuditLogExportRequestedReportType.Activity)
            }
          >
            <Stack spacing="0.75rem" w="full">
              <Box maxW="18.25rem">
                <Text
                  textStyle="subhead-2"
                  color="base.content.strong"
                  mb="0.5rem"
                >
                  For the month of
                </Text>
                <Controller
                  control={form.control}
                  name="month"
                  render={({ field, fieldState }) => (
                    <FormControl isInvalid={!!fieldState.error}>
                      <SingleSelect
                        name="month"
                        value={field.value}
                        onChange={field.onChange}
                        items={monthOptions}
                        isClearable={false}
                      />
                      <FormErrorMessage>
                        {fieldState.error?.message}
                      </FormErrorMessage>
                    </FormControl>
                  )}
                />
              </Box>
              <HStack spacing="0.25rem" align="center">
                <Icon
                  as={BiInfoCircle}
                  boxSize="1rem"
                  color="utility.feedback.info"
                  flexShrink={0}
                />
                <Text textStyle="caption-2" color="base.content.default">
                  This will include activities from 1st day of the month to
                  date.
                </Text>
              </HStack>
            </Stack>
          </LogTypeCard>
        </Stack>

        <Button type="submit" isLoading={isPending} isDisabled={!reportType}>
          {reportType ? "Export log" : "Select log types to export"}
        </Button>
      </Stack>
    </Stack>
  )
}

interface LogTypeCardProps {
  title: string
  description: string
  isSelected: boolean
  onToggle: () => void
  // Extra content revealed under the label when the card is selected (e.g. the
  // month picker for audit logs).
  children?: React.ReactNode
}

const LogTypeCard = ({
  title,
  description,
  isSelected,
  onToggle,
  children,
}: LogTypeCardProps): JSX.Element => {
  return (
    <Box
      w="full"
      p="1rem"
      borderWidth="1.5px"
      borderRadius="0.5rem"
      borderColor={
        isSelected ? "interaction.main.default" : "base.divider.medium"
      }
      bgColor={
        isSelected ? "utility.feedback.info-subtle" : "base.canvas.default"
      }
    >
      <Checkbox
        isChecked={isSelected}
        onChange={onToggle}
        alignItems="flex-start"
      >
        <Stack spacing="0.25rem" ml="0.25rem">
          <Text textStyle="subhead-2" color="base.content.strong">
            {title}
          </Text>
          <Text textStyle="body-2" color="base.content.medium">
            {description}
          </Text>
        </Stack>
      </Checkbox>
      {/* The revealed content sits outside the checkbox label so interacting
          with it (e.g. opening the month dropdown) does not toggle selection. */}
      {isSelected && children && (
        <Box mt="0.75rem" pl="2rem">
          {children}
        </Box>
      )}
    </Box>
  )
}
