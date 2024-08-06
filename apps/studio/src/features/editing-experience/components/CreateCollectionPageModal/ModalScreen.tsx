import { Box } from "@chakra-ui/react"
import { useAutoAnimate } from "@formkit/auto-animate/react"

import {
  CreateCollectionPageFlowStates,
  useCreateCollectionPageWizard,
} from "./CreateCollectionPageWizardContext"
import { CreateCollectionPageDetailsScreen } from "./DetailsScreen"
import { CreateCollectionPageTypeScreen } from "./TypeScreen"

/**
 * @preconditions Requires CreateFormWizardProvider parent
 * Display screen content depending on the current step (with animation).
 */
export const CreateCollectionPageModalScreen = () => {
  const { currentStep } = useCreateCollectionPageWizard()
  const [parent] = useAutoAnimate()
  return (
    <Box
      display="flex"
      flexDir="column"
      flex={1}
      overflow="hidden"
      ref={parent}
    >
      {currentStep === CreateCollectionPageFlowStates.Type && (
        <CreateCollectionPageTypeScreen />
      )}
      {currentStep === CreateCollectionPageFlowStates.Details && (
        <CreateCollectionPageDetailsScreen />
      )}
    </Box>
  )
}
