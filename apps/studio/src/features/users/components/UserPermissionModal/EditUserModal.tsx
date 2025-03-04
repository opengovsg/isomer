import type { z } from "zod"
import { useEffect } from "react"
import {
  Button,
  FormControl,
  HStack,
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
import { FormLabel, useToast } from "@opengovsg/design-system-react"
import { RoleType } from "~prisma/generated/generatedEnums"
import { useAtomValue, useSetAtom } from "jotai"
import { z as zod } from "zod"

import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { useZodForm } from "~/lib/form"
import { updateInputSchema } from "~/schemas/user"
import { isGovEmail } from "~/utils/email"
import { trpc } from "~/utils/trpc"
import {
  DEFAULT_UPDATE_USER_MODAL_STATE,
  updateUserModalAtom,
} from "../../atom"
import { AddAdminWarning, NonGovEmailCannotBeAdmin } from "./Banners"
import { ROLE_CONFIGS } from "./constants"
import { RoleBox } from "./RoleBox"

interface EditUserModalProps {
  siteId: z.infer<typeof updateInputSchema>["siteId"]
}

export const EditUserModal = ({ siteId }: EditUserModalProps) => {
  const toast = useToast(BRIEF_TOAST_SETTINGS)
  const utils = trpc.useUtils()

  const { userId, email, role } = useAtomValue(updateUserModalAtom)
  const setUpdateUserModalState = useSetAtom(updateUserModalAtom)
  const onClose = () => setUpdateUserModalState(DEFAULT_UPDATE_USER_MODAL_STATE)

  console.log(1111, userId, email, role)

  const { watch, handleSubmit, setValue } = useZodForm({
    schema: zod.object({
      role: updateInputSchema.shape.role,
    }),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      role,
    },
  })

  // Update form value when role from atom changes
  useEffect(() => {
    setValue("role", role)
  }, [role, setValue])

  const { mutate, isLoading } = trpc.user.update.useMutation({
    onSettled: onClose,
    onSuccess: async () => {
      await utils.user.list.invalidate()
      await utils.user.count.invalidate()
      await utils.user.hasInactiveUsers.invalidate()
      toast({
        status: "success",
        title: `Changes saved!`,
      })
    },
    onError: (err) => {
      toast({
        status: "error",
        title: "Failed to update user",
        description: err.message,
      })
    },
  })

  const onUpdateUser = handleSubmit((data) => {
    mutate({
      siteId,
      userId,
      role: data.role,
    })
  })

  const selectedRole = watch("role")
  const isNonGovEmailInput = !isGovEmail(email)

  return (
    <Modal isOpen={!!siteId && !!userId} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader mr="3.5rem">Edit user details</ModalHeader>
        <ModalCloseButton size="lg" />
        <ModalBody>
          <VStack gap="0.75rem" w="100%">
            <VStack gap="0.5rem" w="100%" align="start">
              <Text textStyle="subhead-1">Email address</Text>
              <Text textStyle="body-1" textColor="base.content.medium">
                {email}
              </Text>
            </VStack>
            <VStack gap="0.75rem" w="100%">
              <FormControl isRequired>
                <FormLabel
                  description={
                    <Text>
                      Read more about user roles on the{" "}
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
                  mb={3}
                >
                  Role
                </FormLabel>
                <HStack spacing={3} width="100%">
                  {ROLE_CONFIGS.map(({ role, permissionLabels }) => (
                    <RoleBox
                      key={role}
                      value={role}
                      isSelected={selectedRole === role}
                      onClick={() => setValue("role", role)}
                      permissionLabels={permissionLabels}
                      isDisabled={role === RoleType.Admin && isNonGovEmailInput}
                    />
                  ))}
                </HStack>
              </FormControl>
              {selectedRole === RoleType.Admin && !isNonGovEmailInput && (
                <AddAdminWarning />
              )}
              {selectedRole === RoleType.Admin && isNonGovEmailInput && (
                <NonGovEmailCannotBeAdmin />
              )}
            </VStack>
          </VStack>
        </ModalBody>
        <ModalFooter gap="1rem">
          <Button
            variant="clear"
            color="base.content.default"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button variant="solid" onClick={onUpdateUser} isLoading={isLoading}>
            Save changes
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
