import type {
  IsomerComponent,
  IsomerPageSchemaType,
  IsomerSiteProps,
} from "~/engine"
import type { IsomerPageLayoutType, LinkComponentType } from "~/types"
import { DYNAMIC_DATA_BANNER_TYPE, IMAGE_GALLERY_TYPE } from "~/interfaces"
import {
  Accordion,
  Blockquote,
  Callout,
  ChildrenPages,
  Contentpic,
  DynamicDataBanner,
  Hero,
  Iframe,
  Image,
  ImageGallery,
  Infobar,
  InfoCards,
  InfoCols,
  Infopic,
  KeyStatistics,
  LogoCloud,
  Map,
  Prose,
  Video,
} from "../components"
import {
  ArticleLayout,
  CollectionLayout,
  ContentLayout,
  DatabaseLayout,
  HomepageLayout,
  IndexPageLayout,
  NotFoundLayout,
  SearchLayout,
} from "../layouts"

interface RenderComponentProps {
  elementKey?: number
  component: IsomerComponent
  layout: IsomerPageLayoutType
  site: IsomerSiteProps
  LinkComponent?: LinkComponentType
  shouldLazyLoad?: boolean
  permalink: string
}

export const renderComponent = ({
  elementKey,
  component,
  ...rest
}: RenderComponentProps) => {
  switch (component.type) {
    case "logocloud":
      return <LogoCloud key={elementKey} {...component} {...rest} />
    case "accordion":
      return <Accordion key={elementKey} {...component} {...rest} />
    case "blockquote":
      return <Blockquote key={elementKey} {...component} {...rest} />
    case "callout":
      return <Callout key={elementKey} {...component} {...rest} />
    case "contentpic":
      return <Contentpic key={elementKey} {...component} {...rest} />
    case "hero":
      return <Hero key={elementKey} {...component} {...rest} />
    case "iframe":
      return <Iframe key={elementKey} {...component} {...rest} />
    case "image":
      return <Image key={elementKey} {...component} {...rest} />
    case "infobar":
      return <Infobar key={elementKey} {...component} {...rest} />
    case "infocards":
      return <InfoCards key={elementKey} {...component} {...rest} />
    case "infocols":
      return <InfoCols key={elementKey} {...component} {...rest} />
    case "infopic":
      return <Infopic key={elementKey} {...component} {...rest} />
    case "keystatistics":
      return <KeyStatistics key={elementKey} {...component} {...rest} />
    case "map":
      return <Map key={elementKey} {...component} {...rest} />
    case "childrenpages":
      return <ChildrenPages key={elementKey} {...component} {...rest} />
    case "prose":
      return (
        <Prose
          key={elementKey}
          {...component}
          {...rest}
          shouldStripContentHtmlTags
        />
      )
    case "video":
      return <Video key={elementKey} {...component} {...rest} />
    case DYNAMIC_DATA_BANNER_TYPE:
      return <DynamicDataBanner key={elementKey} {...component} {...rest} />
    case IMAGE_GALLERY_TYPE:
      return <ImageGallery key={elementKey} {...component} {...rest} />
    default:
      const _: never = component
      return <></>
  }
}

export const renderLayout = ({
  LinkComponent = "a",
  ScriptComponent = "script",
  ...rest
}: IsomerPageSchemaType) => {
  const props = {
    ...rest,
    LinkComponent,
    ScriptComponent,
  }

  switch (props.layout) {
    case "article":
      return <ArticleLayout {...props} />
    case "collection":
      return <CollectionLayout {...props} />
    case "content":
      return <ContentLayout {...props} />
    case "database":
      return <DatabaseLayout {...props} />
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
