import {
  type IsomerComponent,
  type IsomerNativeComponentProps,
} from '@opengovsg/isomer-components'
import { useEditorDrawerContext } from '~/contexts/EditorDrawerContext'
import ComponentSelector from '~/components/PageEditor/ComponentSelector'
import RootStateDrawer from './RootStateDrawer'
import TipTapComponent from './TipTapComponent'
import ComplexEditorStateDrawer from './ComplexEditorStateDrawer'

function narrowToTiptap(
  component: IsomerComponent,
): IsomerNativeComponentProps {
  // TODO: get rid of the cast here
  return component as IsomerNativeComponentProps
}

type EditPageDrawerProps = {
  isOpen: boolean
}

export function EditPageDrawer({ isOpen: open }: EditPageDrawerProps) {
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
      const component = narrowToTiptap(pageState[currActiveIdx]!)
      return (
        <TipTapComponent
          data={component.content}
          path="test"
          type={component.type}
        />
      )
    }
    case 'complexEditor':
      return <ComplexEditorStateDrawer />
    default:
      return <h1>Edit Page Drawer</h1>
  }
}

export default EditPageDrawer
