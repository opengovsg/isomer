import { useState } from "react"
import {
  Box,
  Button,
  chakra,
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
  Select,
  Text,
  useRadioGroup,
  VStack,
} from "@chakra-ui/react"
import {
  FormErrorMessage,
  FormLabel,
  PhoneNumberInput,
  useToast,
} from "@opengovsg/design-system-react"
import { RoleType } from "~prisma/generated/generatedEnums"
import { Controller } from "react-hook-form"

import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { useMe } from "~/features/me/api"
import { useZodForm } from "~/lib/form"
import { updateDetailsInputSchema } from "~/schemas/user"
import { trpc } from "~/utils/trpc"
import { ROLE_CONFIGS } from "./constants"
import { RoleBox } from "./RoleBox"

interface AddUserModalProps {
  isOpen: boolean
  onClose: () => void
}

export const AddUserModal = ({ isOpen, onClose }: AddUserModalProps) => {
  const [selectedRole, setSelectedRole] = useState<RoleType>(RoleType.Editor)

  const handleOnClose = () => {
    setSelectedRole(RoleType.Editor)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleOnClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader mr="3.5rem">Invite to collaborate</ModalHeader>
        <ModalCloseButton size="lg" />
        <ModalBody>
          <VStack gap="1.25rem" w="100%">
            <FormControl isRequired>
              <FormLabel>Email address</FormLabel>
              <Input noOfLines={1} placeholder="example@agency.gov.sg" />
            </FormControl>
            <FormControl isRequired>
              <FormLabel
                description={
                  <Text>
                    You can change this later. Read more about user roles on the{" "}
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
                  />
                ))}
              </HStack>
            </FormControl>
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
          <Button variant="solid" onClick={() => console.log("TODO")}>
            Send invite
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
