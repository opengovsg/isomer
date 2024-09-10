import type { IsomerComponent, IsomerPageSchemaType } from "~/engine"
import type { LinkComponentType } from "~/types"

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
