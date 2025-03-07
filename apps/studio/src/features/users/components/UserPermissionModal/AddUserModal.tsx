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
  VStack,
} from "@chakra-ui/react"
import {
  FormErrorMessage,
  FormLabel,
  useToast,
} from "@opengovsg/design-system-react"
import { RoleType } from "~prisma/generated/generatedEnums"
import { useAtomValue, useSetAtom } from "jotai"

import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { useZodForm } from "~/lib/form"
import { createUserInputSchema } from "~/schemas/user"
import { isGovEmail } from "~/utils/email"
import { trpc } from "~/utils/trpc"
import {
  addUserModalAtom,
  addUserModalOpenAtom,
  DEFAULT_ADD_USER_MODAL_OPEN_STATE,
  DEFAULT_ADD_USER_MODAL_STATE,
} from "../../atoms"
import { AddAdminWarning, NonGovEmailCannotBeAdmin } from "./Banners"
import { ISOMER_GUIDE_URL, ROLE_CONFIGS } from "./constants"
import { RoleBox } from "./RoleBox"

export const AddUserModal = () => {
  const toast = useToast(BRIEF_TOAST_SETTINGS)
  const utils = trpc.useUtils()

  const isOpen = useAtomValue(addUserModalOpenAtom)
  const setAddUserModalOpen = useSetAtom(addUserModalOpenAtom)

  const addUserModalState = useAtomValue(addUserModalAtom)
  const { siteId, whitelistError } = addUserModalState
  const setAddUserModalState = useSetAtom(addUserModalAtom)

  const {
    watch,
    register,
    reset,
    handleSubmit,
    setValue,
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

  const isNonGovEmailInput = useMemo(
    () => !!(!errors.email && email && !isGovEmail(email)),
    [errors.email, email],
  )

  // Reason we are not using zodForm build-in schema is because the checking of whitelist
  // is an async operation requiring an API call, and combining them will be less readable
  const additionalEmailError = useMemo(
    () => isNonGovEmailInput && whitelistError,
    [isNonGovEmailInput, whitelistError],
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
      { siteId, email: email || "" },
      {
        enabled: false,
        onSuccess: (isWhitelisted) => {
          setAddUserModalState((prev) => ({
            ...prev,
            whitelistError: !isWhitelisted,
          }))
        },
        onError: () => {
          setAddUserModalState((prev) => ({ ...prev, whitelistError: false }))
        },
      },
    )

  // Check whitelist when email changes
  useEffect(() => {
    // no need to check whitelist if email is not entered or already invalid
    if (!email || errors.email) return

    // no need to check whitelist if email is gov.sg
    if (!isNonGovEmailInput) {
      setAddUserModalState((prev) => ({ ...prev, whitelistError: false }))
      return
    }

    void checkWhitelist()
  }, [
    email,
    isNonGovEmailInput,
    errors.email,
    checkWhitelist,
    setAddUserModalState,
  ])

  const handleOnClose = useCallback(() => {
    reset()
    setAddUserModalOpen(DEFAULT_ADD_USER_MODAL_OPEN_STATE)
    setAddUserModalState(DEFAULT_ADD_USER_MODAL_STATE)
  }, [reset, setAddUserModalOpen, setAddUserModalState])

  const onSendInvite = handleSubmit((data) => {
    createUser(
      {
        siteId,
        users: [
          {
            email: data.email,
            role: watch("role"),
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

  return (
    <Modal isOpen={isOpen} onClose={handleOnClose}>
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
                <FormErrorMessage>{errors.email.message}</FormErrorMessage>
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
          <Button
            variant="solid"
            onClick={onSendInvite}
            isLoading={isLoading}
            isDisabled={
              Object.keys(errors).length > 0 ||
              email === "" ||
              additionalEmailError ||
              (watch("role") === RoleType.Admin && isNonGovEmailInput)
            }
          >
            Send invite
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
