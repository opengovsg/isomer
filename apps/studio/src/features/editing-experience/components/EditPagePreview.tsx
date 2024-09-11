import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { useSiteThemeCssVars } from "~/features/preview/hooks/useSiteThemeCssVars"
import Preview from "./Preview"
import { PreviewIframe } from "./PreviewIframe"

export const EditPagePreview = (): JSX.Element => {
  const { previewPageState, siteId, permalink } = useEditorDrawerContext()
  const themeCssVars = useSiteThemeCssVars({ siteId })

  return (
    <PreviewIframe style={themeCssVars}>
      {/* @ts-expect-error JsonForm types are messing up */}
      <Preview
        {...previewPageState}
        siteId={siteId}
        permalink={permalink}
        version="0.1.0"
      />
    </PreviewIframe>
  )
}
