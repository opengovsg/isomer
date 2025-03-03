import type { z } from "zod"
import { useEffect, useState } from "react"
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
import { z as zod } from "zod"

import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { useZodForm } from "~/lib/form"
import { createInputSchema } from "~/schemas/user"
import { isGovEmail } from "~/utils/email"
import { trpc } from "~/utils/trpc"
import { AddAdminWarning, NonGovEmailCannotBeAdmin } from "./Banners"
import { ROLE_CONFIGS } from "./constants"
import { RoleBox } from "./RoleBox"

interface AddUserModalProps {
  siteId: z.infer<typeof createInputSchema>["siteId"]
  isOpen: boolean
  onClose: () => void
}

// Create a simplified schema for the form that only collects email
// Using the email validation from createInputSchema
const addUserFormSchema = zod.object({
  email: createInputSchema.shape.users.element.shape.email,
})

type AddUserFormValues = z.infer<typeof addUserFormSchema>

export const AddUserModal = ({
  siteId,
  isOpen,
  onClose,
}: AddUserModalProps) => {
  const toast = useToast(BRIEF_TOAST_SETTINGS)
  const utils = trpc.useUtils()
  const [whitelistError, setWhitelistError] = useState<boolean>(false)
  const [selectedRole, setSelectedRole] = useState<RoleType>(RoleType.Editor)

  const {
    watch,
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useZodForm({
    schema: addUserFormSchema,
    mode: "onChange",
    reValidateMode: "onChange",
  })

  const email = watch("email")

  const { mutate: createUser } = trpc.user.create.useMutation({
    onSuccess: async (createdUsers) => {
      await utils.user.list.invalidate()
      await utils.user.count.invalidate()
      toast({
        status: "success",
        title: "Profile updated",
        description:
          createdUsers.length === 1
            ? `Sent invite to ${createdUsers[0]?.email}. They'll receive an email in a few minutes.`
            : `Sent invite to ${createdUsers.length} users. They'll receive an email in a few minutes.`,
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
          if (!isWhitelisted) {
            setWhitelistError(true)
          } else {
            setWhitelistError(false)
          }
        },
        onError: () => {
          setWhitelistError(false)
        },
      },
    )

  // Check whitelist when email changes and is valid
  useEffect(() => {
    // Only check whitelist if email is valid (no errors)
    if (email && !errors.email) {
      void checkWhitelist()
    } else {
      setWhitelistError(false)
    }
  }, [email, errors.email, checkWhitelist])

  const handleOnClose = () => {
    reset()
    setSelectedRole(RoleType.Editor)
    setWhitelistError(false)
    onClose()
  }

  const onSendInvite = handleSubmit((data: AddUserFormValues) => {
    createUser(
      {
        siteId,
        users: [
          {
            email: data.email,
            role: selectedRole,
          },
        ],
      },
      {
        onError: (error) => {
          toast({
            status: "error",
            title: "Failed to create user",
            description: error.message,
          })
        },
        onSuccess: () => reset(),
        onSettled: () => {
          void handleOnClose()
        },
      },
    )
  })

  const isNonGovEmailInput = !!(!errors.email && email && !isGovEmail(email))

  // Add effect to change role from Admin to Editor when non-gov email is entered
  useEffect(() => {
    if (isNonGovEmailInput && selectedRole === RoleType.Admin) {
      setSelectedRole(RoleType.Editor)
    }
  }, [isNonGovEmailInput, selectedRole])

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
              isInvalid={!!errors.email || whitelistError}
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
              {!errors.email && whitelistError && (
                <FormErrorMessage>
                  There are non-gov.sg domains that need to be whitelisted. Chat
                  with Isomer Support to whitelist domains.
                </FormErrorMessage>
              )}
            </FormControl>
            <VStack gap="1rem" w="100%">
              <FormControl isRequired>
                <FormLabel
                  description={
                    <Text>
                      You can change this later. Read more about user roles on
                      the{" "}
                      <Link
                        // TODO: update this placeholder
                        href="https://guide.isomer.gov.sg/user-management/user-roles"
                        isExternal
                      >
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
                      isSelected={selectedRole === role}
                      onClick={() => setSelectedRole(role)}
                      permissionLabels={permissionLabels}
                      isDisabled={role === RoleType.Admin && isNonGovEmailInput}
                    />
                  ))}
                </HStack>
              </FormControl>
              {selectedRole === RoleType.Admin && <AddAdminWarning />}
              {isNonGovEmailInput && <NonGovEmailCannotBeAdmin />}
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
            isDisabled={Object.keys(errors).length > 0 || whitelistError}
          >
            Send invite
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
