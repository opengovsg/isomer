import type { IsomerComponent, IsomerPageSchema } from "~/engine"
import HomepageLayout from "./Homepage"
import ContentLayout from "./Content"
import {
  Button,
  Callout,
  ContentPageHeader,
  Hero,
  InfoCols,
  Infobar,
  Infopic,
  KeyStatistics,
  Paragraph,
} from "../components"
import OrderedList from "../components/OrderedList"
import UnorderedList from "../components/UnorderedList"

interface RenderComponentProps {
  component: IsomerComponent
  LinkComponent: any // Next.js link
}

export const renderComponent = ({
  component,
  LinkComponent,
}: RenderComponentProps) => {
  switch (component.type) {
    case "button":
      return <Button {...component} LinkComponent={LinkComponent} />
    case "callout":
      return <Callout {...component} />
    case "contentpageheader":
      return <ContentPageHeader {...component} />
    case "hero":
      return <Hero {...component} />
    case "infobar":
      return <Infobar {...component} />
    case "infocols":
      return <InfoCols {...component} LinkComponent={LinkComponent} />
    case "infopic":
      return <Infopic {...component} />
    case "keystatistics":
      return <KeyStatistics {...component} />
    // case "navbar":
    //   return <Navbar {...component} />
    case "orderedlist":
      return <OrderedList {...component} />
    case "paragraph":
      return <Paragraph {...component} />
    case "unorderedlist":
      return <UnorderedList {...component} />
  }
}

const renderLayout = (props: IsomerPageSchema) => {
  switch (props.page.layout) {
    case "homepage":
      return <HomepageLayout {...props} />
    case "content":
      return <ContentLayout {...props} />
  }
}

export default renderLayout
