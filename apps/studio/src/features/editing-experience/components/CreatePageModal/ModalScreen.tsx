import { Box } from "@chakra-ui/react"
import { useAutoAnimate } from "@formkit/auto-animate/react"

import {
  CreatePageFlowStates,
  useCreatePageWizard,
} from "./CreatePageWizardContext"
import { CreatePageDetailsScreen } from "./DetailsScreen"
import { CreatePageLayoutScreen } from "./LayoutScreen"

/**
 * @preconditions Requires CreateFormWizardProvider parent
 * Display screen content depending on the current step (with animation).
 */
export const CreatePageModalScreen = () => {
  const { currentStep } = useCreatePageWizard()
  const [parent] = useAutoAnimate()
  return (
    <Box
      display="flex"
      flexDir="column"
      flex={1}
      overflow="hidden"
      ref={parent}
    >
      {currentStep === CreatePageFlowStates.Details && (
        <CreatePageDetailsScreen />
      )}
      {currentStep === CreatePageFlowStates.Layout && (
        <CreatePageLayoutScreen />
      )}
    </Box>
  )
}
