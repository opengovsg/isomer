import type { IsomerComponent, IsomerPageSchemaType } from "~/engine"

interface RenderComponentProps {
  component: IsomerComponent
  LinkComponent: any // Next.js link
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
