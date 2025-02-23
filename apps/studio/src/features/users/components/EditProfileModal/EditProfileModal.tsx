import {
  Button,
  FormControl,
  FormErrorMessage,
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
import { FormLabel, PhoneNumberInput } from "@opengovsg/design-system-react"
import { Controller } from "react-hook-form"

import { useMe } from "~/features/me/api"
import { useZodForm } from "~/lib/form"
import { updateDetailsInputSchema } from "~/schemas/user"

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export const EditProfileModal = ({
  isOpen,
  onClose,
}: EditProfileModalProps) => {
  const { me, isOnboarded } = useMe()

  const {
    register,
    watch,
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
  })

  const onSaveChanges = () => {
    console.log("TODO: Save changes")
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
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
              <FormControl isRequired>
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
              <FormControl isRequired>
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
            <Button variant="solid" onClick={onSaveChanges}>
              Save changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  )
}
