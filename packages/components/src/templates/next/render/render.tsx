import type { IsomerComponent, IsomerPageSchemaType } from "~/engine"
import {
  Accordion,
  Button,
  Callout,
  Hero,
  Iframe,
  Image,
  Infobar,
  InfoCards,
  InfoCols,
  Infopic,
  KeyStatistics,
  Prose,
} from "../components"
import {
  ArticleLayout,
  CollectionLayout,
  ContentLayout,
  HomepageLayout,
  NotFoundLayout,
  SearchLayout,
} from "../layouts"

interface RenderComponentProps {
  component: IsomerComponent
  LinkComponent?: any // Next.js link
  ScriptComponent?: any // Next.js script
}

export const renderComponent = ({
  component,
  LinkComponent,
}: RenderComponentProps) => {
  switch (component.type) {
    case "accordion":
      return <Accordion {...component} />
    case "button":
      return <Button {...component} LinkComponent={LinkComponent} />
    case "callout":
      return <Callout {...component} />
    case "hero":
      return <Hero {...component} />
    case "iframe":
      return <Iframe {...component} />
    case "image":
      return <Image {...component} />
    case "infobar":
      return <Infobar {...component} LinkComponent={LinkComponent} />
    case "infocards":
      return <InfoCards {...component} />
    case "infocols":
      return <InfoCols {...component} LinkComponent={LinkComponent} />
    case "infopic":
      return <Infopic {...component} />
    case "keystatistics":
      return <KeyStatistics {...component} />
    case "prose":
      return <Prose {...component} />
    default:
      const _: never = component
      return <></>
  }
}

export const renderLayout = (props: IsomerPageSchemaType) => {
  switch (props.layout) {
    case "article":
      return <ArticleLayout {...props} />
    case "collection":
      return <CollectionLayout {...props} />
    case "content":
      return <ContentLayout {...props} />
    case "homepage":
      return <HomepageLayout {...props} />
    case "notfound":
      return <NotFoundLayout {...props} />
    case "search":
      return <SearchLayout {...props} />
    // These are references that we should not render to the user
    case "file":
    case "link":
      return <></>
    default:
      const _: never = props
      return <></>
  }
}
