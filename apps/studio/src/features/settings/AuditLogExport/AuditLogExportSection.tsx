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
import posthog from "posthog-js"
import { useContext, useMemo } from "react"
import { Controller } from "react-hook-form"
import { BiCheckShield, BiHelpCircle, BiInfoCircle } from "react-icons/bi"
import { ISOMER_SUPPORT_EMAIL } from "~/constants/misc"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { UserManagementContext } from "~/features/users"
import { useZodForm } from "~/lib/form"
import { AuditLogExportRequestedReportType } from "~/schemas/audit"
import { trpc } from "~/utils/trpc"

import { auditLogExportFormSchema } from "./schema"
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

  // How many months back the picker may offer — the standard window, or fewer
  // for a site younger than that (see `getAuditLogExportWindow`). Falls back
  // to the full window while loading; `monthOptions[0]` (the current month,
  // used as the form's default) is unaffected either way, since the cap only
  // ever trims how far back the list goes.
  const { data: exportWindow } = trpc.audit.getExportWindow.useQuery(
    {
      siteId,
    },
    { initialData: { maxMonths: 12 } },
  )

  const monthOptions = useMemo(() => {
    const options = getMonthOptions(undefined, exportWindow?.maxMonths)
    const [current] = options
    // `getMonthOptions` always returns at least the current month; relabel it
    // so the picker reads "Current month" rather than e.g. "July 2026".
    if (!current) return options
    return [{ ...current, label: CURRENT_MONTH_LABEL }, ...options.slice(1)]
  }, [exportWindow?.maxMonths])

  // Form state lives in react-hook-form, validated by a schema built on the
  // same one the tRPC procedure uses (minus `siteId`, which comes from
  // props), so client and server validation cannot drift — except that the
  // form's `reportType` also accepts `null` (see schema.ts) as its "unset"
  // state, which the server-facing schema must never allow.
  const form = useZodForm({
    schema: auditLogExportFormSchema,
    defaultValues: {
      month: monthOptions[0]?.value ?? "",
      // `null` until the user picks at least one log type — this also keeps
      // the submit button disabled below, mirroring the design's initial
      // empty state.
      reportType: null,
    },
  })

  const reportType: AuditLogExportRequestedReportType | null =
    form.watch("reportType")
  const isAccessSelected =
    reportType === AuditLogExportRequestedReportType.Access ||
    reportType === AuditLogExportRequestedReportType.Both
  const isActivitySelected =
    reportType === AuditLogExportRequestedReportType.Activity ||
    reportType === AuditLogExportRequestedReportType.Both

  // The "to date" caveat only makes sense for the current (partial) month;
  // past months in the picker are always complete calendar months.
  const selectedMonth = form.watch("month")
  const isCurrentMonthSelected = selectedMonth === monthOptions[0]?.value

  const onToggle = (
    toggled:
      | typeof AuditLogExportRequestedReportType.Access
      | typeof AuditLogExportRequestedReportType.Activity,
  ) => {
    const next = toggleReportType(reportType, toggled)
    // `reportType` is never bound to a native input via `register`/`Controller`
    // (it's driven entirely by this checkbox cluster), so `resetField` is a
    // no-op for it — RHF only resets fields it finds in its internal registry.
    // `setValue` has no such guard, so use it for both the set and clear cases.
    form.setValue("reportType", next, { shouldValidate: true })
  }

  const { mutate: createExportRequest, isPending } =
    trpc.audit.createExportRequest.useMutation({
      onSuccess: (_data, { reportType: requestedReportType, month }) => {
        // `Both` fans out into two DB rows server-side (see auditLogExport.service.ts),
        // so mirror that here with one event per log type actually requested.
        if (
          requestedReportType === AuditLogExportRequestedReportType.Access ||
          requestedReportType === AuditLogExportRequestedReportType.Both
        ) {
          posthog.capture("user_access_log_requested", { site_id: siteId })
        }
        if (
          requestedReportType === AuditLogExportRequestedReportType.Activity ||
          requestedReportType === AuditLogExportRequestedReportType.Both
        ) {
          posthog.capture("audit_log_requested", { site_id: siteId, month })
        }

        form.reset()
        toast({
          title: "Export requested",
          description:
            "Your export is being generated. We'll email you a download link when it's ready.",
          status: "success",
        })
      },
      // The server returns typed, user-facing messages for the expected
      // rejections (future month, not an admin). Duplicate requests never
      // fail — they are accepted idempotently. Surface server messages
      // directly; fall back to a generic message for anything else.
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
                        size="xs"
                        name="month"
                        value={field.value}
                        onChange={field.onChange}
                        items={monthOptions}
                        isClearable={false}
                        isSearchable={false}
                      />
                      <FormErrorMessage>
                        {fieldState.error?.message}
                      </FormErrorMessage>
                    </FormControl>
                  )}
                />
              </Box>
              {isCurrentMonthSelected && (
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
              )}
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
      overflow="hidden"
      borderWidth="1.5px"
      borderRadius="0.5rem"
      borderColor={
        isSelected ? "interaction.main.default" : "base.divider.medium"
      }
      bgColor={
        isSelected ? "utility.feedback.info-subtle" : "base.canvas.default"
      }
    >
      {/* Padding lives on the checkbox itself, not this wrapper, so its hover
          fill reaches the card's edges instead of leaving a padding-sized gap. */}
      <Checkbox
        isChecked={isSelected}
        onChange={onToggle}
        alignItems="flex-start"
        _focusWithin={{ boxShadow: "none" }}
        p="1rem"
        size="sm"
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
        <Box mt="0.75rem" pl="3.25rem" pr="1rem" pb="1rem">
          {children}
        </Box>
      )}
    </Box>
  )
}
