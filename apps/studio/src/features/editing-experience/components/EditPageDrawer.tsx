import type { IsomerComponent } from "@opengovsg/isomer-components"
import type { ProseProps } from "@opengovsg/isomer-components/dist/cjs/interfaces"
import { getComponentSchema } from "@opengovsg/isomer-components"
import Ajv from "ajv"

import ComponentSelector from "~/components/PageEditor/ComponentSelector"
import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import AdminModeStateDrawer from "./AdminModeStateDrawer"
import ComplexEditorStateDrawer from "./ComplexEditorStateDrawer"
import HeroEditorDrawer from "./HeroEditorDrawer"
import MetadataEditorStateDrawer from "./MetadataEditorStateDrawer"
import RootStateDrawer from "./RootStateDrawer"
import TipTapProseComponent from "./TipTapProseComponent"

const proseSchema = getComponentSchema("prose")
const ajv = new Ajv({ allErrors: true, strict: false, logger: false })
const validate = ajv.compile<ProseProps>(proseSchema)

export function EditPageDrawer(): JSX.Element {
  const {
    previewPageState,
    drawerState: currState,
    currActiveIdx,
  } = useEditorDrawerContext()

  const inferAsProse = (component?: IsomerComponent): ProseProps => {
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

  if (!previewPageState) {
    return <></>
  }

  switch (currState.state) {
    case "root":
      return <RootStateDrawer />
    case "adminMode":
      return <AdminModeStateDrawer />
    case "addBlock":
      return <ComponentSelector />
    case "nativeEditor": {
      const component = previewPageState.content[currActiveIdx]
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
