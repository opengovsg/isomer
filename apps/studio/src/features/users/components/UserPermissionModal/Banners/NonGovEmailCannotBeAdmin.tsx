import { Infobox } from "@opengovsg/design-system-react"

export const NonGovEmailCannotBeAdmin = () => (
  <Infobox
    textStyle="body-2"
    size="sm"
    borderWidth="1px"
    borderRadius="md"
    variant="error"
    w="100%"
    border="none"
  >
    This email can't be added as an admin. Select another role.
  </Infobox>
)
