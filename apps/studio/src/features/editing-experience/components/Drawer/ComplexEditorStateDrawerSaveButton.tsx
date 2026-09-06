import { Button } from "@opengovsg/design-system-react"
import { isEmpty } from "lodash-es"

import { useBuilderErrors } from "../form-builder/ErrorProvider"

interface ComplexEditorStateDrawerSaveButtonProps {
  onClick: () => void
  isLoading: boolean
  isNonEditableBlock: boolean
}

export const ComplexEditorStateDrawerSaveButton = ({
  onClick,
  isLoading,
  isNonEditableBlock,
}: ComplexEditorStateDrawerSaveButtonProps) => {
  const { errors } = useBuilderErrors()

  return (
    <Button
      w="100%"
      isLoading={isLoading}
      isDisabled={isNonEditableBlock || !isEmpty(errors)}
      onClick={onClick}
    >
      Save block
    </Button>
  )
}
