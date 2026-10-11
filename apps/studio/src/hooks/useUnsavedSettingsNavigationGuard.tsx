import { useState } from "react"
import { UnsavedSettingModal } from "~/features/editing-experience/components/UnsavedSettingModal"
import { useNavigationEffect } from "~/hooks/useNavigationEffect"

export const useUnsavedSettingsNavigationGuard = (isDirty: boolean) => {
  const [nextUrl, setNextUrl] = useState("")
  const isOpen = !!nextUrl

  useNavigationEffect({ isOpen, isDirty, callback: setNextUrl })

  const unsavedSettingsModal = (
    <UnsavedSettingModal
      isOpen={isOpen}
      onClose={() => setNextUrl("")}
      nextUrl={nextUrl}
    />
  )

  return { unsavedSettingsModal }
}
