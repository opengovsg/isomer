import { useEditorDrawerContext } from '~/contexts/EditorDrawerContext'
import ComponentSelector from '~/components/PageEditor/ComponentSelector'
import RootStateDrawer from './RootStateDrawer'
import TipTapComponent from './TipTapComponent'
import ComplexEditorStateDrawer from './ComplexEditorStateDrawer'

type EditPageDrawerProps = {
  isOpen: boolean
}

export function EditPageDrawer({ isOpen: open }: EditPageDrawerProps) {
  const { drawerState: currState } = useEditorDrawerContext()

  switch (currState.state) {
    case 'root':
      return <RootStateDrawer />
    case 'addBlock':
      return <ComponentSelector />
    case 'nativeEditor':
      return <TipTapComponent data="test" path="test" type="paragraph" />
    case 'complexEditor':
      return <ComplexEditorStateDrawer />
    default:
      return <h1>Edit Page Drawer</h1>
  }
}

export default EditPageDrawer
