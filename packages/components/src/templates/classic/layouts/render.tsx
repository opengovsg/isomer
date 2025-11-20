import type {
  IsomerComponent,
  IsomerPageSchemaType,
  LinkComponentType,
} from "~/types"

interface RenderComponentProps {
  component: IsomerComponent
  LinkComponent: LinkComponentType
}

export const renderComponent = ({
  component,
  LinkComponent,
}: RenderComponentProps) => {
  return <></>
}

const renderLayout = (props: IsomerPageSchemaType) => {
  return <></>
}

export default renderLayout
