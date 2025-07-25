import type { IsomerSchema } from "@opengovsg/isomer-components"
import { useCallback, useMemo, useState } from "react"
import { useToast } from "@opengovsg/design-system-react"
import { schema } from "@opengovsg/isomer-components"
import isEqual from "lodash/isEqual"

import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { useQueryParse } from "~/hooks/useQueryParse"
import { ajv } from "~/utils/ajv"
import { safeJsonParse } from "~/utils/safeJsonParse"
import { trpc } from "~/utils/trpc"
import { pageSchema } from "../schema"
import { CHANGES_SAVED_PLEASE_PUBLISH_MESSAGE } from "./constants"
import { RawJsonEditor } from "./RawJsonEditor"

const validateFn = ajv.compile<IsomerSchema>(schema)

export default function RawJsonEditorModeStateDrawer(): JSX.Element {
  const {
    setDrawerState,
    savedPageState,
    setSavedPageState,
    previewPageState,
    setPreviewPageState,
  } = useEditorDrawerContext()
  const { pageId, siteId } = useQueryParse(pageSchema)
  const toast = useToast()
  const [pendingChanges, setPendingChanges] = useState(
    JSON.stringify(savedPageState, null, 2),
  )

  const utils = trpc.useUtils()
  const { mutate, isLoading } = trpc.page.updatePageBlob.useMutation({
    onSuccess: async () => {
      await utils.page.readPageAndBlob.invalidate({ pageId, siteId })
      await utils.page.readPage.invalidate({ pageId, siteId })
      toast({
        title: CHANGES_SAVED_PLEASE_PUBLISH_MESSAGE,
        ...BRIEF_TOAST_SETTINGS,
      })
    },
  })

  const handleSaveChanges = useCallback(() => {
    setSavedPageState(previewPageState)
    mutate(
      {
        pageId,
        siteId,
        content: JSON.stringify(previewPageState),
      },
      {
        onSuccess: () => setDrawerState({ state: "root" }),
      },
    )
  }, [
    mutate,
    pageId,
    previewPageState,
    setDrawerState,
    setSavedPageState,
    siteId,
  ])

  const handleChange = (data: string) => {
    setPendingChanges(data)
    const parsedPendingChanges = safeJsonParse(data) as unknown

    if (validateFn(parsedPendingChanges)) {
      setPreviewPageState(parsedPendingChanges)
    }
  }

  const isPendingChangesValid = useMemo(() => {
    return validateFn(safeJsonParse(pendingChanges))
  }, [pendingChanges])

  const handleDiscardChanges = () => {
    setPreviewPageState(savedPageState)
    setDrawerState({ state: "root" })
  }

  return (
    <RawJsonEditor
      pendingChanges={pendingChanges}
      isLoading={isLoading}
      isModified={!isEqual(previewPageState, savedPageState)}
      isPendingChangesValid={isPendingChangesValid}
      handleChange={handleChange}
      handleDiscardChanges={handleDiscardChanges}
      handleSaveChanges={handleSaveChanges}
    />
  )
}
