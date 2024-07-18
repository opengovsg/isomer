import { XMotionBox } from "~/components/Motionbox"
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
  const { direction, currentStep } = useCreatePageWizard()

  return (
    <XMotionBox
      display="flex"
      flexDir="column"
      flex={1}
      overflow="hidden"
      keyProp={currentStep}
      custom={direction}
    >
      {currentStep === CreatePageFlowStates.Details && (
        <CreatePageDetailsScreen />
      )}
      {currentStep === CreatePageFlowStates.Layout && (
        <CreatePageLayoutScreen />
      )}
    </XMotionBox>
  )
}
