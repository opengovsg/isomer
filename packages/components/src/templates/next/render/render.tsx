import type {
  IsomerComponent,
  IsomerPageSchemaType,
  IsomerSiteProps,
} from "~/engine"
import {
  Accordion,
  Callout,
  Contentpic,
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
  IndexPageLayout,
  NotFoundLayout,
  SearchLayout,
} from "../layouts"

interface RenderComponentProps {
  site: IsomerSiteProps
  component: IsomerComponent
  elementKey?: number
  LinkComponent?: any // Next.js link
}

export const renderComponent = ({
  site,
  component,
  LinkComponent,
  elementKey,
}: RenderComponentProps) => {
  switch (component.type) {
    case "accordion":
      return <Accordion key={elementKey} {...component} />
    case "callout":
      return <Callout key={elementKey} {...component} />
    case "hero":
      return <Hero key={elementKey} {...component} />
    case "iframe":
      return <Iframe key={elementKey} {...component} />
    case "image":
      return (
        <Image
          {...component}
          key={elementKey}
          site={site}
          LinkComponent={LinkComponent}
        />
      )
    case "infobar":
      return (
        <Infobar
          key={elementKey}
          {...component}
          LinkComponent={LinkComponent}
        />
      )
    case "infocards":
      return <InfoCards key={elementKey} {...component} />
    case "infocols":
      return (
        <InfoCols
          key={elementKey}
          {...component}
          LinkComponent={LinkComponent}
        />
      )
    case "infopic":
      return <Infopic key={elementKey} {...component} />
    case "contentpic":
      return <Contentpic key={elementKey} {...component} />
    case "keystatistics":
      return <KeyStatistics key={elementKey} {...component} />
    case "prose":
      return (
        <Prose key={elementKey} {...component} LinkComponent={LinkComponent} />
      )
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
    case "index":
      return <IndexPageLayout {...props} />
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
