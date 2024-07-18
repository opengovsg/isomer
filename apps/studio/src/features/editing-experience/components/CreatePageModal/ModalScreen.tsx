import { Box } from "@chakra-ui/react"

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

  return (
    <Box display="flex" flexDir="column" flex={1} overflow="hidden">
      {currentStep === CreatePageFlowStates.Details && (
        <CreatePageDetailsScreen />
      )}
      {currentStep === CreatePageFlowStates.Layout && (
        <CreatePageLayoutScreen />
      )}
    </Box>
  )
}
