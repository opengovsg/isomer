import { useCallback, useEffect } from "react"
import {
  Button,
  FormControl,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  VStack,
} from "@chakra-ui/react"
import {
  FormErrorMessage,
  FormLabel,
  PhoneNumberInput,
  useToast,
} from "@opengovsg/design-system-react"
import { useAtomValue, useSetAtom } from "jotai"
import { Controller } from "react-hook-form"

import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { useMe } from "~/features/me/api"
import { useZodForm } from "~/lib/form"
import { updateUserDetailsInputSchema } from "~/schemas/user"
import { trpc } from "~/utils/trpc"
import { updateProfileModalOpenAtom } from "../../atoms"

export const EditProfileModal = () => {
  const toast = useToast(BRIEF_TOAST_SETTINGS)
  const utils = trpc.useUtils()

  const isOpen = useAtomValue(updateProfileModalOpenAtom)
  const setIsOpen = useSetAtom(updateProfileModalOpenAtom)

  const { me, isOnboarded } = useMe()

  useEffect(() => {
    if (!isOnboarded) {
      setIsOpen(true)
    }
  }, [isOnboarded, setIsOpen])

  const updateDetailsMutation = trpc.user.updateDetails.useMutation()

  useEffect(() => {
    if (updateDetailsMutation.isSuccess) {
      void utils.me.get.invalidate()
      toast({
        status: "success",
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      })
      handleClose()
    }
  }, [updateDetailsMutation.isSuccess, utils.me.get, toast, handleClose])

  useEffect(() => {
    if (updateDetailsMutation.isError) {
      toast({
        status: "error",
        title: "Failed to update profile",
        description: updateDetailsMutation.error.message,
      })
      reset()
    }
  }, [updateDetailsMutation.isError, updateDetailsMutation.error, toast, reset])

  const {
    register,
    control,
    reset,
    handleSubmit,
    formState: { isDirty, errors },
  } = useZodForm({
    schema: updateUserDetailsInputSchema,
    defaultValues: {
      name: me.name,
      phone: me.phone,
    },
    mode: "onChange",
    reValidateMode: "onChange",
  })

  // Reset form when user data changes
  useEffect(() => {
    reset({
      name: me.name,
      phone: me.phone,
    })
  }, [me, reset])

  const handleClose = useCallback(() => {
    reset()
    setIsOpen(false)
  }, [reset, setIsOpen])

  const onSubmit = handleSubmit((data) => {
    updateDetailsMutation.mutate(
      {
        name: data.name,
        phone: data.phone,
      },
      {
        onSuccess: () => reset(data),
      },
    )
  })

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalOverlay>
        <ModalContent>
          {isOnboarded ? (
            <>
              <ModalHeader mr="3.5rem">Edit profile</ModalHeader>
              <ModalCloseButton size="lg" />
            </>
          ) : (
            <ModalHeader mr="3.5rem">
              Welcome to Studio! Tell us about yourself.
            </ModalHeader>
          )}
          <ModalBody>
            <VStack gap="1rem" width="100%">
              <FormControl isRequired isInvalid={!!errors.name}>
                <FormLabel description="Used to address you on support channels">
                  Your full name
                </FormLabel>
                <Input
                  noOfLines={1}
                  maxLength={256} // arbitrary limit
                  {...register("name")}
                />
                {errors.name && (
                  <FormErrorMessage>{errors.name.message}</FormErrorMessage>
                )}
              </FormControl>
              <FormControl isRequired isInvalid={!!errors.phone}>
                <FormLabel>Your phone number</FormLabel>
                <Controller
                  control={control}
                  name="phone"
                  render={({ field: { onChange, value, ...field } }) => (
                    <PhoneNumberInput
                      allowInternational={false}
                      defaultCountry="SG"
                      value={value}
                      onChange={onChange}
                      {...field}
                    />
                  )}
                />
                {errors.phone && (
                  <FormErrorMessage>{errors.phone.message}</FormErrorMessage>
                )}
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="solid"
              onClick={onSubmit}
              isDisabled={!isDirty || Object.keys(errors).length > 0}
              isLoading={updateDetailsMutation.isPending}
            >
              Save changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  )
}
