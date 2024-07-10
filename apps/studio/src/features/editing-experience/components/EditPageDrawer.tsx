import { useEditorDrawerContext } from '~/contexts/EditorDrawerContext'
import ComponentSelector from '~/components/PageEditor/ComponentSelector'
import RootStateDrawer from './RootStateDrawer'
import TipTapComponent from './TipTapComponent'
import ComplexEditorStateDrawer from './ComplexEditorStateDrawer'
import { IsomerNativeComponentsMap } from '@opengovsg/isomer-components'
import { TypeCompiler } from '@sinclair/typebox/compiler'
import type { ProseProps } from '@opengovsg/isomer-components/dist/cjs/interfaces'


export function EditPageDrawer() {
  const {
    pageState,
    drawerState: currState,
    currActiveIdx,
  } = useEditorDrawerContext()

  const proseSchema = IsomerNativeComponentsMap.prose
  const compiled = TypeCompiler.Compile(proseSchema)

  const inferAsProse = (component?: typeof pageState[number]): ProseProps => {
    if (!component) {
      throw new Error(`Expected component of type prose but got undefined`)
    }

    if (compiled.Check(component)) {
      return component
    }

    throw new Error(`Expected component of type prose but got type ${component.type}`)
  }

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
