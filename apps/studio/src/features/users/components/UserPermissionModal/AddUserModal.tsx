import { useCallback, useEffect, useMemo } from "react"
import {
  Button,
  FormControl,
  HStack,
  Input,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  Tooltip,
  VStack,
} from "@chakra-ui/react"
import {
  FormErrorMessage,
  FormLabel,
  useToast,
} from "@opengovsg/design-system-react"
import { useDebounce } from "@uidotdev/usehooks"
import { RoleType } from "~prisma/generated/generatedEnums"
import { useAtomValue, useSetAtom } from "jotai"

import { SINGPASS_DISABLED_ERROR_MESSAGE } from "~/constants/customErrorMessage"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { useIsSingpassEnabled } from "~/hooks/useIsSingpassEnabled"
import { useZodForm } from "~/lib/form"
import { createUserInputSchema } from "~/schemas/user"
import { isGovEmail } from "~/utils/email"
import { trpc } from "~/utils/trpc"
import { addUserModalAtom, DEFAULT_ADD_USER_MODAL_STATE } from "../../atoms"
import { AddAdminWarning, NonGovEmailCannotBeAdmin } from "./Banners"
import { ISOMER_GUIDE_URL, ROLE_CONFIGS } from "./constants"
import { RoleBox } from "./RoleBox"

export const AddUserModal = () => {
  const toast = useToast(BRIEF_TOAST_SETTINGS)
  const utils = trpc.useUtils()

  const addUserModalState = useAtomValue(addUserModalAtom)
  const { siteId, hasWhitelistError } = addUserModalState
  const setAddUserModalState = useSetAtom(addUserModalAtom)

  const isSingpassEnabled = useIsSingpassEnabled()

  const {
    watch,
    register,
    reset,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useZodForm({
    // Create a simplified schema that only accept 1 user with email and role
    // as we currently only support adding 1 user at a time
    schema: createUserInputSchema.shape.users.element,
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      email: "",
      role: RoleType.Editor,
    },
  })

  const email = watch("email")
  const debouncedEmail = useDebounce(email, 300)

  const isNonGovEmailInput = useMemo(
    () => !!(!errors.email && email && !isGovEmail(email)),
    [errors.email, email],
  )

  // Reason we are not using zodForm build-in schema is because the checking of whitelist
  // is an async operation requiring an API call, and combining them will be less readable
  const additionalEmailError = useMemo(
    () => isNonGovEmailInput && hasWhitelistError,
    [isNonGovEmailInput, hasWhitelistError],
  )

  const { mutate: createUser, isLoading } = trpc.user.create.useMutation({
    onSuccess: async (createdUsers) => {
      await utils.user.list.invalidate()
      await utils.user.count.invalidate()
      toast({
        status: "success",
        description: `Sent invite to ${createdUsers.length === 1 ? createdUsers[0]?.email : createdUsers.length + " users"}. They'll receive an email in a few minutes.`,
      })
    },
    onError: (error) => {
      toast({
        status: "error",
        title: "Failed to create user",
        description: error.message,
      })
      reset()
    },
  })

  const { refetch: checkWhitelist } =
    trpc.whitelist.isEmailWhitelisted.useQuery(
      { siteId, email: debouncedEmail || "" },
      {
        enabled: false,
        onSuccess: (isWhitelisted) => {
          setAddUserModalState((prev) => ({
            ...prev,
            hasWhitelistError: !isWhitelisted,
          }))
        },
        onError: () => {
          setAddUserModalState((prev) => ({
            ...prev,
            hasWhitelistError: false,
          }))
        },
      },
    )

  // Check whitelist when email changes
  useEffect(() => {
    // no need to check whitelist if email is not entered or already invalid
    if (!debouncedEmail || errors.email) return

    void checkWhitelist()
  }, [
    debouncedEmail,
    isNonGovEmailInput,
    errors.email,
    checkWhitelist,
    setAddUserModalState,
  ])

  const handleOnClose = useCallback(() => {
    reset()
    setAddUserModalState(DEFAULT_ADD_USER_MODAL_STATE)
  }, [reset, setAddUserModalState])

  const onSendInvite = handleSubmit((data) => {
    createUser(
      {
        siteId,
        users: [
          {
            email: data.email,
            role: getValues("role"),
          },
        ],
      },
      {
        onSuccess: () => reset(),
        onSettled: () => {
          void handleOnClose()
        },
      },
    )
  })

  const renderSendInviteButton = (): JSX.Element => {
    const SendInviteButton = (
      <Button
        variant="solid"
        onClick={onSendInvite}
        isLoading={isLoading}
        isDisabled={
          Object.keys(errors).length > 0 ||
          email === "" ||
          additionalEmailError ||
          email !== debouncedEmail || // check if email has changed
          (watch("role") === RoleType.Admin && isNonGovEmailInput) ||
          !isSingpassEnabled
        }
      >
        Send invite
      </Button>
    )

    return isSingpassEnabled ? (
      SendInviteButton
    ) : (
      <Tooltip label={SINGPASS_DISABLED_ERROR_MESSAGE}>
        {SendInviteButton}
      </Tooltip>
    )
  }

  return (
    <Modal isOpen={!!siteId} onClose={handleOnClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader mr="3.5rem">Invite to collaborate</ModalHeader>
        <ModalCloseButton size="lg" />
        <ModalBody>
          <VStack gap="1.25rem" w="100%">
            <FormControl
              isRequired
              isInvalid={!!errors.email || additionalEmailError}
            >
              <FormLabel>Email address</FormLabel>
              <Input
                {...register("email")}
                noOfLines={1}
                placeholder="example@agency.gov.sg"
              />
              {errors.email && (
                <FormErrorMessage>
                  This doesn't look like a valid email address.
                </FormErrorMessage>
              )}
              {!errors.email && additionalEmailError && (
                <FormErrorMessage>
                  There are non-gov.sg domains that need to be whitelisted. Chat
                  with Isomer Support to whitelist domains.
                </FormErrorMessage>
              )}
            </FormControl>
            <VStack gap="1rem" w="100%">
              <FormControl
                isRequired
                isInvalid={
                  watch("role") === RoleType.Admin && isNonGovEmailInput
                }
              >
                <FormLabel
                  description={
                    <Text>
                      You can change this later. Read more about user roles on
                      the{" "}
                      <Link href={ISOMER_GUIDE_URL} isExternal>
                        Isomer Guide
                      </Link>
                      .
                    </Text>
                  }
                  mb={4}
                >
                  Role
                </FormLabel>
                <HStack spacing={3} width="100%">
                  {ROLE_CONFIGS.map(({ role, permissionLabels }) => (
                    <RoleBox
                      key={role}
                      value={role}
                      isSelected={watch("role") === role}
                      onClick={() => setValue("role", role)}
                      permissionLabels={permissionLabels}
                      isDisabled={role === RoleType.Admin && isNonGovEmailInput}
                    />
                  ))}
                </HStack>
              </FormControl>
              {watch("role") === RoleType.Admin && !isNonGovEmailInput && (
                <AddAdminWarning />
              )}
              {watch("role") === RoleType.Admin && isNonGovEmailInput && (
                <NonGovEmailCannotBeAdmin />
              )}
            </VStack>
          </VStack>
        </ModalBody>
        <ModalFooter gap="1rem">
          <Button
            variant="clear"
            color="base.content.default"
            onClick={handleOnClose}
          >
            Cancel
          </Button>
          {renderSendInviteButton()}
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
