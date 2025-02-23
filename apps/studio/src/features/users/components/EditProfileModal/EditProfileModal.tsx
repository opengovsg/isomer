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
import { Controller } from "react-hook-form"

import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { useMe } from "~/features/me/api"
import { useZodForm } from "~/lib/form"
import { updateDetailsInputSchema } from "~/schemas/user"
import { trpc } from "~/utils/trpc"

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export const EditProfileModal = ({
  isOpen,
  onClose,
}: EditProfileModalProps) => {
  const toast = useToast(BRIEF_TOAST_SETTINGS)
  const utils = trpc.useUtils()

  const { me, isOnboarded } = useMe()

  const { mutate: updateDetails } = trpc.user.updateDetails.useMutation({
    onSuccess: () => {
      void utils.me.get.invalidate()
      toast({
        status: "success",
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      })
    },
    onError: (error) => {
      toast({
        status: "error",
        title: "Failed to update profile",
        description: error.message,
      })
      reset()
    },
  })

  const {
    register,
    control,
    reset,
    handleSubmit,
    formState: { isDirty, errors },
  } = useZodForm({
    schema: updateDetailsInputSchema,
    defaultValues: {
      name: me.name,
      phone: me.phone,
    },
    mode: "onChange",
    reValidateMode: "onChange",
  })

  const handleClose = () => {
    reset()
    onClose()
  }

  const onSubmit = handleSubmit((data) => {
    updateDetails(
      {
        name: data.name,
        phone: data.phone,
      },
      {
        onSuccess: () => reset(data),
        onSettled: () => {
          void handleClose()
        },
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
                <FormLabel description="Used for two-factor authentication (2FA). Make sure it is accurate">
                  Your phone number
                </FormLabel>
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
            <Button variant="solid" onClick={onSubmit} isDisabled={!isDirty}>
              Save changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  )
}
