import {
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  InputGroup,
  InputLeftAddon,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
} from "@chakra-ui/react";
import {
  Button,
  FormErrorMessage,
  ModalCloseButton,
} from "@opengovsg/design-system-react";
import { z } from "zod";

import { useZodForm } from "~/lib/form";

interface PageCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MAX_TITLE_LENGTH = 100;
const MAX_PAGE_URL_LENGTH = 150;

const pageCreateSchema = z.object({
  title: z
    .string({
      required_error: "Enter a title for this page",
    })
    .min(1, { message: "Title should be at least 1 character" })
    .max(MAX_TITLE_LENGTH, {
      message: `Title should be at most ${MAX_TITLE_LENGTH} characters`,
    })
    .default(""),
  url: z
    .string({
      required_error: "Enter a URL for this page",
    })
    .min(1, { message: "URL should be at least 1 character" })
    .max(MAX_PAGE_URL_LENGTH, {
      message: `URL should be at most ${MAX_PAGE_URL_LENGTH} characters`,
    })
    .default(""),
});

export const PageCreateModal = ({
  isOpen,
  onClose,
}: PageCreateModalProps): JSX.Element => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useZodForm({
    schema: pageCreateSchema,
  });

  const watchAllFields = watch();
  const titleLen = watchAllFields.title?.length ?? 0;
  const pageUrlLen = watchAllFields.url?.length ?? 0;

  /* TODO: When integrating with BE */
  const onSubmit = handleSubmit((data) => {
    console.log(data);
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalCloseButton />
      <ModalOverlay />
      <ModalContent>
        <ModalHeader color="base.content.strong">
          Tell us about your new page
        </ModalHeader>
        <ModalCloseButton />
        <form onSubmit={onSubmit}>
          <ModalBody>
            <Stack gap={"1.5em"}>
              <Text fontSize="md" color="base.content.default">
                You can change these later.
              </Text>
              {/* Section 1: Page Title */}
              <FormControl isInvalid={!!errors.title}>
                <FormLabel color="base.content.strong">
                  Page title
                  <FormHelperText color="base.content.default">
                    Title should be descriptive
                  </FormHelperText>
                </FormLabel>

                <Input
                  type="text"
                  placeholder="This is a title for your new page"
                  id="title"
                  {...register("title")}
                  isInvalid={!!errors.title}
                />
                {errors.title?.message ? (
                  <FormErrorMessage>{errors.title.message}</FormErrorMessage>
                ) : (
                  <FormHelperText mt={"0.5em"} color="base.content.medium">
                    {MAX_TITLE_LENGTH - titleLen} characters left
                  </FormHelperText>
                )}
              </FormControl>

              {/* Section 2: Page URL */}
              <FormControl isInvalid={!!errors.url}>
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
                    defaultValue={"hello-world"}
                    color="base.content.default"
                    {...register("url")}
                    isInvalid={!!errors.url}
                  />
                </InputGroup>

                {errors.url?.message ? (
                  <FormErrorMessage>{errors.url.message}</FormErrorMessage>
                ) : (
                  <FormHelperText mt={"0.5em"} color="base.content.medium">
                    {MAX_PAGE_URL_LENGTH - pageUrlLen} characters left
                  </FormHelperText>
                )}
              </FormControl>
            </Stack>
          </ModalBody>

          <ModalFooter>
            <Button
              variant="link"
              mr={5}
              onClick={onClose}
              fontWeight={500}
              color={"base.content.strong"}
            >
              Cancel
            </Button>
            <Button bgColor="interaction.main.default" type="submit">
              Create page
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default PageCreateModal;
