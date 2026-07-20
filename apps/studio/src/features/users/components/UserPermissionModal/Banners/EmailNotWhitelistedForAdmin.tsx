import { Infobox } from "@opengovsg/design-system-react"

export const EmailNotWhitelistedForAdmin = () => (
  <Infobox
    textStyle="body-2"
    size="sm"
    borderWidth="1px"
    borderRadius="md"
    variant="error"
    w="100%"
    border="none"
  >
    Non-whitelisted or vendor (temporarily whitelisted) emails cannot be added
    as admin. Select another role.
  </Infobox>
)
