import type { ProseProps } from "@opengovsg/isomer-components/dist/cjs/interfaces"
import { getComponentSchema } from "@opengovsg/isomer-components"
import Ajv from "ajv"

import ComponentSelector from "~/components/PageEditor/ComponentSelector"
import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { useQueryParse } from "~/hooks/useQueryParse"
import { editPageSchema } from "~/pages/sites/[siteId]/pages/[pageId]"
import ComplexEditorStateDrawer from "./ComplexEditorStateDrawer"
import RootStateDrawer from "./RootStateDrawer"
import TipTapComponent from "./TipTapComponent"

export function EditPageDrawer() {
  const {
    previewPageState,
    drawerState: currState,
    currActiveIdx,
  } = useEditorDrawerContext()

  const proseSchema = getComponentSchema("prose")
  const { pageId, siteId } = useQueryParse(editPageSchema)

  const ajv = new Ajv({ allErrors: true, strict: false })
  const validate = ajv.compile<ProseProps>(proseSchema)

  const inferAsProse = (
    component?: (typeof previewPageState)[number],
  ): ProseProps => {
    if (!component) {
      throw new Error(`Expected component of type prose but got undefined`)
    }

    if (validate(component)) {
      return component
    }

    throw new Error(
      `Expected component of type prose but got type ${component.type}`,
    )
  }

  switch (currState.state) {
    case "root":
      return <RootStateDrawer />
    case "addBlock":
      return <ComponentSelector siteId={siteId} pageId={pageId} />
    case "nativeEditor": {
      const component = previewPageState[currActiveIdx]
      return <TipTapComponent content={inferAsProse(component)} />
    }
    case "complexEditor":
      return <ComplexEditorStateDrawer />
    default:
      const _: never = currState
      return <h1>Edit Page Drawer</h1>
  }
}

export default EditPageDrawer
