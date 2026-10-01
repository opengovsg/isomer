import { useRouter } from "next/router"
import { useEffect } from "react"
import ComponentSelector from "~/components/PageEditor/ComponentSelector"
import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"

import { inferAsProse } from "../../utils/inferAsProse"
import TipTapProseComponent from "../TipTapProseComponent"
import CollectionEditorStateDrawer from "./CollectionEditorStateDrawer"
import ComplexEditorStateDrawer from "./ComplexEditorStateDrawer"
import DatabaseEditorStateDrawer from "./DatabaseEditorStateDrawer"
import HeroEditorDrawer from "./HeroEditorDrawer"
import HistoryStateDrawer from "./HistoryStateDrawer"
import MetadataEditorStateDrawer from "./MetadataEditorStateDrawer"
import RawJsonEditorModeStateDrawer from "./RawJsonEditorModeStateDrawer"
import RootStateDrawer from "./RootStateDrawer"
import SiderailOrderingEditorStateDrawer from "./SiderailOrderingEditorStateDrawer"

export function EditPageDrawer(): JSX.Element {
  const {
    previewPageState,
    drawerState: currState,
    currActiveIdx,
    setDrawerState,
  } = useEditorDrawerContext()
  const router = useRouter()

  // The navbar sits outside EditorDrawerProvider, so use a one-shot route
  // request to open history without moving or duplicating editor state.
  useEffect(() => {
    if (router.query.history !== "true") return

    setDrawerState({ state: "history" })
    const { history: _, ...query } = router.query
    void router.replace({ pathname: router.pathname, query }, undefined, {
      shallow: true,
      scroll: false,
    })
  }, [router, setDrawerState])

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
    case "history":
      return <HistoryStateDrawer />
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
