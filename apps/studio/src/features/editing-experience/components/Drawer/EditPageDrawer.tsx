import ComponentSelector from "~/components/PageEditor/ComponentSelector"
import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"

import { inferAsProse } from "../../utils/inferAsProse"
import TipTapProseComponent from "../TipTapProseComponent"
import CollectionEditorStateDrawer from "./CollectionEditorStateDrawer"
import ComplexEditorStateDrawer from "./ComplexEditorStateDrawer"
import DatabaseEditorStateDrawer from "./DatabaseEditorStateDrawer"
import HeroEditorDrawer from "./HeroEditorDrawer"
import MetadataEditorStateDrawer from "./MetadataEditorStateDrawer"
import RawJsonEditorModeStateDrawer from "./RawJsonEditorModeStateDrawer"
import RootStateDrawer from "./RootStateDrawer"
import SiderailOrderingEditorStateDrawer from "./SiderailOrderingEditorStateDrawer"

export function EditPageDrawer(): JSX.Element {
  const {
    previewPageState,
    drawerState: currState,
    currActiveIdx,
  } = useEditorDrawerContext()

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
    case "databaseEditor":
      return <DatabaseEditorStateDrawer />
    case "heroEditor":
      return <HeroEditorDrawer />
    case "collectionEditor":
      return <CollectionEditorStateDrawer />
    case "siderailOrderingEditor":
      return <SiderailOrderingEditorStateDrawer />
    default:
      const _: never = currState
      return <h1>Edit Page Drawer</h1>
  }
}
