import type { IsomerComponent, IsomerPageSchema } from "~/engine"

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

const renderLayout = (props: IsomerPageSchema) => {
  return <></>
}

export default renderLayout
