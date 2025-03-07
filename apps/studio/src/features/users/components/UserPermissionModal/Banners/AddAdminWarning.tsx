import { Infobox } from "@opengovsg/design-system-react"

export const AddAdminWarning = () => (
  <Infobox
    textStyle="body-2"
    size="sm"
    borderWidth="1px"
    borderRadius="md"
    variant="warning"
    w="100%"
    border="none"
  >
    You are adding a new admin to the website. An admin can make any change to
    the site content, settings, and users.s admin. Select another role.
  </Infobox>
)
