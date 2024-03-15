import type { IsomerComponent, IsomerPageSchema } from "~/engine"
import HomepageLayout from "./Homepage"
import ContentLayout from "./Content"
import {
  Button,
  Callout,
  Hero,
  InfoCols,
  Infobar,
  Infopic,
  KeyStatistics,
  Paragraph,
} from "../components"
import { HeroProps } from "../components/Hero/Hero"

interface RenderComponentProps {
  component:
    | IsomerComponent
    | (HeroProps & { type: "hero" } & {
        sectionIdx?: number
        indexable?: string[]
      })
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
    case "hero":
      return <Hero {...component} />
    case "infobar":
      return <Infobar {...component} />
    case "infocols":
      return <InfoCols {...component} />
    case "infopic":
      return <Infopic {...component} />
    case "keystatistics":
      return <KeyStatistics {...component} />
    // case "navbar":
    //   return <Navbar {...component} />
    case "paragraph":
      return <Paragraph {...component} />
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
