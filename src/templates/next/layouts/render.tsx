import type { IsomerComponent, IsomerPageSchema } from "~/engine"
import ArticleLayout from "./Article"
import CollectionLayout from "./Collection"
import ContentLayout from "./Content"
import HomepageLayout from "./Homepage"
import NotFoundLayout from "./NotFound"
import SearchLayout from "./Search"
import Notification from "../components/shared/Notification"
import {
  Accordion,
  Button,
  Callout,
  CollectionCard,
  Footer,
  Heading,
  Hero,
  Image,
  InfoCards,
  InfoCols,
  Infobar,
  Infopic,
  KeyStatistics,
  Masthead,
  Navbar,
  OrderedList,
  Paragraph,
  Table,
  UnorderedList,
} from "../components"

interface RenderComponentProps {
  component: IsomerComponent
  LinkComponent?: any // Next.js link
  ScriptComponent?: any // Next.js script
}

export const renderComponent = ({
  component,
  LinkComponent,
  ScriptComponent,
}: RenderComponentProps) => {
  switch (component.type) {
    case "accordion":
      return <Accordion {...component} />
    case "button":
      return <Button {...component} LinkComponent={LinkComponent} />
    case "callout":
      return <Callout {...component} />
    case "collectionCard":
      return <CollectionCard {...component} LinkComponent={LinkComponent} />
    case "footer":
      return <Footer {...component} LinkComponent={LinkComponent} />
    case "heading":
      return <Heading {...component} />
    case "hero":
      return <Hero {...component} />
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
    case "masthead":
      return <Masthead {...component} />
    case "navbar":
      return (
        <Navbar
          {...component}
          LinkComponent={LinkComponent}
          ScriptComponent={ScriptComponent}
        />
      )
    case "orderedlist":
      return <OrderedList {...component} />
    case "paragraph":
      return <Paragraph {...component} />
    case "table":
      return <Table {...component} />
    case "unorderedlist":
      return <UnorderedList {...component} />
    case "notification":
      return <Notification {...component} />
  }
}

export const renderLayout = (props: IsomerPageSchema) => {
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
  }
}
