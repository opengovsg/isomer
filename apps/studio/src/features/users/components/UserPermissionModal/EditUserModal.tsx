import { useEffect, useMemo } from "react"
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
import { useIsSingpassEnabled } from "~/hooks/useIsSingpassEnabled"
import { useZodForm } from "~/lib/form"
import { updateUserInputSchema } from "~/schemas/user"
import { isGovEmail } from "~/utils/email"
import { trpc } from "~/utils/trpc"
import {
  DEFAULT_UPDATE_USER_MODAL_STATE,
  updateUserModalAtom,
} from "../../atoms"
import { SingpassConditionalTooltip } from "../SingpassConditionalTooltip"
import { AddAdminWarning, NonGovEmailCannotBeAdmin } from "./Banners"
import { ISOMER_GUIDE_URL, ROLE_CONFIGS } from "./constants"
import { RoleBox } from "./RoleBox"

export const EditUserModal = () => {
  const toast = useToast(BRIEF_TOAST_SETTINGS)
  const utils = trpc.useUtils()

  const { siteId, userId, email, role } = useAtomValue(updateUserModalAtom)
  const setUpdateUserModalState = useSetAtom(updateUserModalAtom)

  const isSingpassEnabled = useIsSingpassEnabled()

  const onClose = () => {
    reset()
    setUpdateUserModalState(DEFAULT_UPDATE_USER_MODAL_STATE)
  }

  const { watch, handleSubmit, setValue, reset } = useZodForm({
    schema: zod.object({
      role: updateUserInputSchema.shape.role,
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

  const updateUserMutation = trpc.user.update.useMutation()

  useEffect(() => {
    if (updateUserMutation.isSuccess || updateUserMutation.isError) {
      onClose()
    }
  }, [updateUserMutation.isSuccess, updateUserMutation.isError, onClose])

  useEffect(() => {
    if (updateUserMutation.isSuccess) {
      void utils.user.list.invalidate()
      void utils.user.count.invalidate()
      toast({
        status: "success",
        title: `Changes saved!`,
      })
    }
  }, [updateUserMutation.isSuccess])

  useEffect(() => {
    if (updateUserMutation.isError) {
      toast({
        status: "error",
        title: "Failed to update user",
        description: updateUserMutation.error.message,
      })
    }
  }, [updateUserMutation.isError, updateUserMutation.error])

  const onUpdateUser = handleSubmit((data) => {
    updateUserMutation.mutate({
      siteId,
      userId,
      role: data.role,
    })
  })

  const selectedRole = watch("role")

  const isNonGovEmailInput = useMemo(() => !isGovEmail(email), [email])

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
                      <Link href={ISOMER_GUIDE_URL} isExternal>
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
          <SingpassConditionalTooltip>
            <Button
              variant="solid"
              onClick={onUpdateUser}
              isLoading={updateUserMutation.isPending}
              isDisabled={!isSingpassEnabled}
            >
              Save changes
            </Button>
          </SingpassConditionalTooltip>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
