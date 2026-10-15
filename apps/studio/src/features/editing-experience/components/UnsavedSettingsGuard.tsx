import { useState } from "react"
import { UnsavedSettingModal } from "~/features/editing-experience/components/UnsavedSettingModal"
import { useNavigationEffect } from "~/hooks/useNavigationEffect"

interface UnsavedSettingsGuardProps {
  isDirty: boolean
}

export const UnsavedSettingsGuard = ({
  isDirty,
}: UnsavedSettingsGuardProps): JSX.Element => {
  const [nextUrl, setNextUrl] = useState("")
  const isOpen = !!nextUrl

  useNavigationEffect({ isOpen, isDirty, callback: setNextUrl })

  return (
    <UnsavedSettingModal
      isOpen={isOpen}
      onClose={() => setNextUrl("")}
      nextUrl={nextUrl}
    />
  )
}
