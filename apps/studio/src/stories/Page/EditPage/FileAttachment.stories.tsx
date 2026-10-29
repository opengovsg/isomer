import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Box } from "@chakra-ui/react"

import { FileAttachment } from "~/components/PageEditor/FileAttachment"
import {
  FILE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING,
  MAX_FILE_SIZE_BYTES,
} from "~/lib/fileUpload"

const meta: Meta<typeof FileAttachment> = {
  title: "Pages/Edit Page/FileAttachment",
  component: FileAttachment,
  decorators: [
    (storyFn) => (
      <Box maxW="32rem" p="1rem">
        {storyFn()}
      </Box>
    ),
  ],
  parameters: {
    chromatic: { delay: 200 },
  },
  args: {
    siteId: 1,
    setHref: (href) => console.log("setHref", href),
    maxSizeInBytes: MAX_FILE_SIZE_BYTES,
    acceptedFileTypes: FILE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING,
    shouldFetchResource: false,
  },
}

export default meta

type Story = StoryObj<typeof FileAttachment>

// File-attachment surface (Button/CTA + rich-text link): shows the content-
// verification warning.
export const WithUploadWarning: Story = {
  args: {
    enableUploadWarnings: true,
  },
}

// Image-block surface: no warning (default).
export const WithoutUploadWarning: Story = {
  args: {
    enableUploadWarnings: false,
  },
}
