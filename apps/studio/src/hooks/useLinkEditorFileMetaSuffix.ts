import { useCallback, useRef } from "react"
import { LINK_TYPES } from "~/features/editing-experience/components/LinkEditor/constants"
import { getLinkHrefType } from "~/features/editing-experience/components/LinkEditor/utils"
import {
  buildFileUploadMetaSuffix,
  stripFileUploadMetaSuffix,
} from "~/utils/fileUploadMetaSuffix"

/**
 * Computes saved link text: for file links, re-appends `[type, size]` from
 * `fileMetaSuffix` (suffix trimmed on open and/or replaced by the latest upload).
 */
function resolveLinkTextForSave({
  showLinkText,
  linkText,
  linkHref,
  fileMetaSuffix,
}: {
  showLinkText: boolean
  linkText: string
  linkHref: string
  fileMetaSuffix: string | null
}): string {
  if (!showLinkText || getLinkHrefType(linkHref) !== LINK_TYPES.File)
    return linkText

  const base = stripFileUploadMetaSuffix(linkText)
  return base + (fileMetaSuffix ?? "")
}

interface UseLinkEditorFileMetaSuffixParams {
  initialLinkText: string | undefined
  showLinkText: boolean
}

/**
 * Tracks the `[type, size]` suffix for the link editor: seeded from text hidden in the
 * field on open, replaced when the user uploads a file, re-applied on save for file links.
 */
export function useLinkEditorFileMetaSuffix({
  initialLinkText,
  showLinkText,
}: UseLinkEditorFileMetaSuffixParams) {
  const strippedLinkTextForForm = stripFileUploadMetaSuffix(
    initialLinkText ?? "",
  )
  const fileMetaSuffixRef = useRef<string | null>(
    initialLinkText != null &&
      initialLinkText !== "" &&
      initialLinkText !== strippedLinkTextForForm
      ? initialLinkText.slice(strippedLinkTextForForm.length)
      : null,
  )

  const onUploadedFile = useCallback(
    (file: File) => {
      if (!showLinkText) return
      const suffix = buildFileUploadMetaSuffix(file)
      if (!suffix) return
      fileMetaSuffixRef.current = suffix
    },
    [showLinkText],
  )

  const buildFinalLinkTextForSave = useCallback(
    (linkText: string, linkHref: string): string => {
      const final = resolveLinkTextForSave({
        showLinkText,
        linkText,
        linkHref,
        fileMetaSuffix: fileMetaSuffixRef.current,
      })
      fileMetaSuffixRef.current = null
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
