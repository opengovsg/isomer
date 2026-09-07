import { Container } from "@chakra-ui/react"
import { Spinner } from "@opengovsg/design-system-react"

export const FullscreenSpinner = (): React.ReactNode => (
  <Container
    display="flex"
    h="$100vh"
    justifyContent="center"
    alignItems="center"
  >
    <Spinner color="interaction.main.default" fontSize="2rem" />
  </Container>
)
