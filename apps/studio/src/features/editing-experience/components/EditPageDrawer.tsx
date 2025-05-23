import type { IsomerComponent } from "@opengovsg/isomer-components"
import type { ProseProps } from "@opengovsg/isomer-components/dist/cjs/interfaces"
import { getComponentSchema } from "@opengovsg/isomer-components"

import ComponentSelector from "~/components/PageEditor/ComponentSelector"
import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { ajv } from "~/utils/ajv"
import ComplexEditorStateDrawer from "./ComplexEditorStateDrawer"
import HeroEditorDrawer from "./HeroEditorDrawer"
import MetadataEditorStateDrawer from "./MetadataEditorStateDrawer"
import RawJsonEditorModeStateDrawer from "./RawJsonEditorModeStateDrawer"
import RootStateDrawer from "./RootStateDrawer"
import TipTapProseComponent from "./TipTapProseComponent"

const proseSchema = getComponentSchema({ component: "prose" })

const validate = ajv.compile<ProseProps>(proseSchema)

export function EditPageDrawer(): JSX.Element {
  const {
    previewPageState,
    drawerState: currState,
    currActiveIdx,
  } = useEditorDrawerContext()

  const inferAsProse = (component?: IsomerComponent): ProseProps => {
    if (!component) {
      throw new Error("Expected component of type prose but got undefined")
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
    case "rawJsonEditor":
      return <RawJsonEditorModeStateDrawer />
    case "addBlock":
      return <ComponentSelector />
    case "nativeEditor": {
      const component = previewPageState.content[currActiveIdx]
      if (!component) return <div />
      return <TipTapProseComponent content={inferAsProse(component)} />
    }
    case "complexEditor":
      return <ComplexEditorStateDrawer />
    case "metadataEditor":
      return <MetadataEditorStateDrawer />
    case "heroEditor":
      return <HeroEditorDrawer />
    default:
      const _: never = currState
      return <h1>Edit Page Drawer</h1>
  }
}

export default EditPageDrawer
