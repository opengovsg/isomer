import { useCallback, useRef } from "react"
import { LINK_TYPES } from "~/features/editing-experience/components/LinkEditor/constants"
import { getLinkHrefType } from "~/features/editing-experience/components/LinkEditor/utils"

import {
  buildFileUploadMetaSuffix,
  stripFileUploadMetaSuffix,
} from "./fileUploadMetaSuffix"

interface UseLinkEditorFileMetaSuffixParams {
  initialLinkText: string | undefined
  showLinkText: boolean
}

/** Tracks file-link `[type, size]` suffix state for the link editor modal. */
export function useLinkEditorFileMetaSuffix({
  initialLinkText,
  showLinkText,
}: UseLinkEditorFileMetaSuffixParams) {
  const strippedLinkTextForForm = stripFileUploadMetaSuffix(
    initialLinkText ?? "",
  )
  const fileMetaSuffixRef = useRef(
    initialLinkText?.slice(strippedLinkTextForForm.length) ?? "",
  )

  const onUploadedFile = useCallback((file: File) => {
    const suffix = buildFileUploadMetaSuffix(file)
    if (!suffix) return
    fileMetaSuffixRef.current = suffix
  }, [])

  const buildFinalLinkTextForSave = useCallback(
    (linkText: string, linkHref: string): string => {
      const final =
        showLinkText && getLinkHrefType(linkHref) === LINK_TYPES.File
          ? stripFileUploadMetaSuffix(linkText) + fileMetaSuffixRef.current
          : linkText
      fileMetaSuffixRef.current = ""
      return final
    },
    [showLinkText],
  )

  return {
    strippedLinkTextForForm,
    onUploadedFile: showLinkText ? onUploadedFile : undefined,
    buildFinalLinkTextForSave,
  }
}
