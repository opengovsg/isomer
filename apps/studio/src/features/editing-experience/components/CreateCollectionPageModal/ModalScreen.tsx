import { Box } from "@chakra-ui/react"
import { useAutoAnimate } from "@formkit/auto-animate/react"

import { CreateCollectionPageDetailsScreen } from "./DetailsScreen"

/**
 * @preconditions Requires CreateFormWizardProvider parent
 * Display screen content depending on the current step (with animation).
 */
export const CreateCollectionPageModalScreen = () => {
  const [parent] = useAutoAnimate()
  return (
    <Box
      display="flex"
      flexDir="column"
      flex={1}
      overflow="hidden"
      ref={parent}
    >
      <CreateCollectionPageDetailsScreen />
    </Box>
  )
}
