import {
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  InputGroup,
  InputLeftAddon,
  Text,
  Stack,
  Box,
} from '@chakra-ui/react'
import { Button, ModalCloseButton } from '@opengovsg/design-system-react'
import { useState } from 'react'

export default function Dashboard() {
  const { isOpen, onOpen, onClose } = useDisclosure()

  return (
    // TODO: Color tokens
    <div>
      <h1>DASHBOARD</h1>

      <Button onClick={onOpen}>Create new page</Button>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Tell us about your new page</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <Stack gap={'1.5em'}>
                <Text fontSize="md">You can change these later.</Text>
                {/* Section 1: Page Title */}
                <Box>
                  <FormLabel>
                    Page title
                    <FormHelperText>Title should be descriptive</FormHelperText>
                  </FormLabel>

                  <Input
                    type="text"
                    placeholder="This is a title for your new page"
                  />
                  <FormHelperText mt={'0.5em'}>
                    200 characters left
                  </FormHelperText>
                </Box>

                {/* Section 2: Page URL */}
                <Box>
                  <FormLabel>
                    Page URL
                    <FormHelperText>
                      URL should be short and simple
                    </FormHelperText>
                  </FormLabel>
                  <InputGroup>
                    <InputLeftAddon color={'brand.secondary.400'}>
                      your-site.gov.sg/
                    </InputLeftAddon>
                    <Input type="tel" defaultValue={'hello-world'} />
                  </InputGroup>
                  <FormHelperText mt={'0.5em'}>
                    200 characters left
                  </FormHelperText>
                </Box>
              </Stack>
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button
              variant="link"
              mr={5}
              onClick={onClose}
              color={'brand.secondary.700'}
            >
              Cancel
            </Button>
            <Button>Create page</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}
