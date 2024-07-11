import { useEditorDrawerContext } from '~/contexts/EditorDrawerContext'
import ComponentSelector from '~/components/PageEditor/ComponentSelector'
import RootStateDrawer from './RootStateDrawer'
import TipTapComponent from './TipTapComponent'
import ComplexEditorStateDrawer from './ComplexEditorStateDrawer'
import { inferAsProse } from '../utils'


export function EditPageDrawer() {
  const {
    pageState,
    drawerState: currState,
    currActiveIdx,
  } = useEditorDrawerContext()

  switch (currState.state) {
    case "root":
      return <RootStateDrawer />
    case "addBlock":
      return <ComponentSelector />
    case 'nativeEditor': {
      const component = pageState[currActiveIdx]
      return <TipTapComponent content={inferAsProse(component)} />
    }
    case 'complexEditor':
      return <ComplexEditorStateDrawer />
    default:
      return <h1>Edit Page Drawer</h1>
  }
}

export default EditPageDrawer
