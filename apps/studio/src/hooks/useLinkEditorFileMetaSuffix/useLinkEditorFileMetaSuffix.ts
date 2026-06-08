import { useCallback, useState } from "react"
import { LINK_TYPES } from "~/features/editing-experience/components/LinkEditor/constants"
import { getLinkHrefType } from "~/features/editing-experience/components/LinkEditor/utils"

import { buildFileUploadMetaSuffix } from "./utils/buildFileUploadMetaSuffix"
import { stripFileUploadMetaSuffix } from "./utils/stripFileUploadMetaSuffix"

interface UseLinkEditorFileMetaSuffixParams {
  initialLinkText: string | undefined
  initialLinkHref: string | undefined
  showLinkText: boolean
}

/** Tracks file-link `[type, size]` suffix state for the link editor modal. */
export function useLinkEditorFileMetaSuffix({
  initialLinkText,
  initialLinkHref,
  showLinkText,
}: UseLinkEditorFileMetaSuffixParams) {
  const isInitialFileLink =
    showLinkText && getLinkHrefType(initialLinkHref) === LINK_TYPES.File

  const strippedLinkText = isInitialFileLink
    ? stripFileUploadMetaSuffix(initialLinkText ?? "")
    : (initialLinkText ?? "")

  const [fileMetaSuffix, setFileMetaSuffix] = useState(() =>
    isInitialFileLink
      ? (initialLinkText?.slice(strippedLinkText.length) ?? "")
      : "",
  )

  const onUploadedFile = useCallback((file: File) => {
    const suffix = buildFileUploadMetaSuffix(file)
    if (!suffix) return
    setFileMetaSuffix(suffix)
  }, [])

  const buildFinalLinkTextForSave = useCallback(
    (linkText: string, linkHref: string): string => {
      const final =
        showLinkText && getLinkHrefType(linkHref) === LINK_TYPES.File
          ? stripFileUploadMetaSuffix(linkText) + fileMetaSuffix
          : linkText
      setFileMetaSuffix("")
      return final
    },
    [showLinkText, fileMetaSuffix],
  )

  return {
    strippedLinkText,
    onUploadedFile: showLinkText ? onUploadedFile : undefined,
    buildFinalLinkTextForSave,
  }
}
