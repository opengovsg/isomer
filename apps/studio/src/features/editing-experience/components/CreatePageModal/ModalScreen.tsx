import { XMotionBox } from "~/components/Motionbox"
import {
  CreatePageFlowStates,
  useCreatePageWizard,
} from "./CreatePageWizardContext"
import { CreatePageLayoutScreen } from "./LayoutScreen"
import { CreatePageSetupScreen } from "./SetupScreen"

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
      keyProp={currentStep}
      custom={direction}
    >
      {currentStep === CreatePageFlowStates.Setup && <CreatePageSetupScreen />}
      {currentStep === CreatePageFlowStates.Layout && (
        <CreatePageLayoutScreen />
      )}
    </XMotionBox>
  )
}
