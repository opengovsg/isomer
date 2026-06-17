import type { Meta, StoryObj } from "@storybook/nextjs"
import { Box } from "@chakra-ui/react"
import { useSetAtom } from "jotai"
import { useEffect } from "react"
import { redirectHandlers } from "tests/msw/handlers/redirect"
import { deleteResourceModalAtom } from "~/features/dashboard/atoms"
import { DeleteResourceModal } from "~/features/dashboard/components/DeleteResourceModal/DeleteResourceModal"
import { ADMIN_HANDLERS } from "~/stories/handlers"
import { ResourceType } from "~prisma/generated/generatedEnums"

// The modal is opened by its jotai atom rather than a prop, so a small wrapper
// opens it on mount for the story.
const OpenedDeleteResourceModal = (): JSX.Element => {
  const setState = useSetAtom(deleteResourceModalAtom)
  useEffect(() => {
    setState({
      title: "Contact us",
      resourceId: "1",
      resourceType: ResourceType.Page,
    })
  }, [setState])
  return <DeleteResourceModal siteId={1} />
}

const meta: Meta<typeof DeleteResourceModal> = {
  title: "Components/DeleteResourceModal",
  component: DeleteResourceModal,
  // The modal renders in a portal; give Chromatic a bounding box to snapshot.
  decorators: [
    (storyFn) => (
      <Box w="100%" h="100vh">
        {storyFn()}
      </Box>
    ),
  ],
  render: () => <OpenedDeleteResourceModal />,
  parameters: {
    layout: "fullscreen",
    // Prevent flaky snapshots while the modal animates in.
    chromatic: { delay: 200 },
    msw: {
      handlers: [
        ...ADMIN_HANDLERS,
        redirectHandlers.countByDestinationResource.none(),
      ],
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// No redirects point at this page — only the standard delete confirmation.
export const Default: Story = {}

// Redirects point at this page — warn that they will be removed on delete
// (ISOM-2266). Copy is placeholder pending design.
export const HasRedirectsPointingHere: Story = {
  parameters: {
    msw: {
      handlers: [
        ...ADMIN_HANDLERS,
        redirectHandlers.countByDestinationResource.some(),
      ],
    },
  },
}
