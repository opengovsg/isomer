import React, { useState } from 'react'
import {
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
interface PageCreateModalProps {
  isOpen: boolean
  onClose: () => void
}

export const PageCreateModal = ({
  isOpen,
  onClose,
}: PageCreateModalProps): JSX.Element => {
  const MAX_TITLE_LENGTH = 100
  const MAX_PAGE_URL_LENGTH = 200
  const [titleLen, setTitleLen] = useState(0)
  const [pageUrlLen, setPageUrlLen] = useState(0)

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalCloseButton />
      <ModalOverlay />
      <ModalContent>
        <ModalHeader color="base.content.strong">
          Tell us about your new page
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl>
            <Stack gap={'1.5em'}>
              <Text fontSize="md" color="base.content.default">
                You can change these later.
              </Text>
              {/* Section 1: Page Title */}
              <Box>
                <FormLabel color="base.content.strong">
                  Page title
                  <FormHelperText color="base.content.default">
                    Title should be descriptive
                  </FormHelperText>
                </FormLabel>

                <Input
                  type="text"
                  placeholder="This is a title for your new page"
                  onChange={(event) => setTitleLen(event.target.value.length)}
                  maxLength={MAX_TITLE_LENGTH}
                />
                <FormHelperText mt={'0.5em'} color="base.content.medium">
                  {MAX_TITLE_LENGTH - titleLen} characters left
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
                  <InputLeftAddon
                    bgColor="interaction.support.disabled"
                    color="base.divider.strong"
                  >
                    your-site.gov.sg/
                  </InputLeftAddon>
                  <Input
                    type="tel"
                    defaultValue={'hello-world'}
                    color="base.content.default"
                    onChange={(event) =>
                      setPageUrlLen(event.target.value.length)
                    }
                    maxLength={MAX_PAGE_URL_LENGTH}
                  />
                </InputGroup>
                <FormHelperText mt={'0.5em'} color="base.content.medium">
                  {MAX_PAGE_URL_LENGTH - pageUrlLen} characters left
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
            fontWeight={500}
            color={'base.content.strong'}
          >
            Cancel
          </Button>
          <Button bgColor="interaction.main.default">Create page</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default PageCreateModal
