import type { IsomerPageSchemaType } from "@opengovsg/isomer-components"
import type {
  RenderComponentOutput,
  RenderComponentProps,
  RenderPageContentOutput,
  RenderPageContentParams,
} from "@opengovsg/isomer-components/templates/next/render/types"
import type { Metadata } from "next"
import config from "@/data/config.json"
import footer from "@/data/footer.json"
import navbar from "@/data/navbar.json"
import sitemap from "@/sitemap.json"
import { SuperLink } from "@/src/superlink"
import { getSitemapXml } from "@opengovsg/isomer-components/engine/getSitemapXml"
import { getMetadata } from "@opengovsg/isomer-components/engine/metadata"
import { shouldBlockIndexing } from "@opengovsg/isomer-components/engine/shouldBlockIndexing"
import { Accordion } from "@opengovsg/isomer-components/templates/next/components/complex/Accordion"
import { Blockquote } from "@opengovsg/isomer-components/templates/next/components/complex/Blockquote"
import { Callout } from "@opengovsg/isomer-components/templates/next/components/complex/Callout"
import { ChildrenPages } from "@opengovsg/isomer-components/templates/next/components/complex/ChildrenPages"
import { CollectionBlock } from "@opengovsg/isomer-components/templates/next/components/complex/CollectionBlock"
import { ContactInformation } from "@opengovsg/isomer-components/templates/next/components/complex/ContactInformation"
import { Contentpic } from "@opengovsg/isomer-components/templates/next/components/complex/Contentpic"
import { DynamicComponentList } from "@opengovsg/isomer-components/templates/next/components/complex/DynamicComponentList"
import { DynamicDataBanner } from "@opengovsg/isomer-components/templates/next/components/complex/DynamicDataBanner"
import { FormSG } from "@opengovsg/isomer-components/templates/next/components/complex/FormSG"
import { Hero } from "@opengovsg/isomer-components/templates/next/components/complex/Hero"
import { Iframe } from "@opengovsg/isomer-components/templates/next/components/complex/Iframe"
import { Image } from "@opengovsg/isomer-components/templates/next/components/complex/Image"
import { ImageGallery } from "@opengovsg/isomer-components/templates/next/components/complex/ImageGallery"
import { Infobar } from "@opengovsg/isomer-components/templates/next/components/complex/Infobar"
import { InfoCards } from "@opengovsg/isomer-components/templates/next/components/complex/InfoCards"
import { InfoCols } from "@opengovsg/isomer-components/templates/next/components/complex/InfoCols"
import { Infopic } from "@opengovsg/isomer-components/templates/next/components/complex/Infopic"
import { KeyStatistics } from "@opengovsg/isomer-components/templates/next/components/complex/KeyStatistics"
import { LogoCloud } from "@opengovsg/isomer-components/templates/next/components/complex/LogoCloud"
import { Map } from "@opengovsg/isomer-components/templates/next/components/complex/Map"
import { Video } from "@opengovsg/isomer-components/templates/next/components/complex/Video"
import { Prose } from "@opengovsg/isomer-components/templates/next/components/native/Prose"
import { ArticleLayoutSkeleton } from "@opengovsg/isomer-components/templates/next/layouts/ArticleSkeleton"
import { CollectionLayout } from "@opengovsg/isomer-components/templates/next/layouts/Collection"
import { ContentLayoutSkeleton } from "@opengovsg/isomer-components/templates/next/layouts/ContentSkeleton"
import { DatabaseLayoutSkeleton } from "@opengovsg/isomer-components/templates/next/layouts/DatabaseSkeleton"
import { HomepageLayoutSkeleton } from "@opengovsg/isomer-components/templates/next/layouts/HomepageSkeleton"
import { IndexPageLayoutSkeleton } from "@opengovsg/isomer-components/templates/next/layouts/IndexPageSkeleton"
import { NotFoundLayout } from "@opengovsg/isomer-components/templates/next/layouts/NotFound"
import { SearchLayout } from "@opengovsg/isomer-components/templates/next/layouts/Search"
import { renderPageContentSkeleton } from "@opengovsg/isomer-components/templates/next/render/renderPageContentSkeleton"

export const dynamic = "force-static"

const INDEX_PAGE_PERMALINK = "_index"

// We define the permalink here so that it can be easily replaced when we duplicate this page
// Examples on how it's used:
//   - For root /page.tsx: const STATIC_ROUTE_PERMALINK = [] (empty array)
//   - For /newsroom/page.tsx: const STATIC_ROUTE_PERMALINK = ["newsroom"]
//   - For /newsroom/newspage/page.tsx: const STATIC_ROUTE_PERMALINK = ["newsroom", "newspage"]
const STATIC_ROUTE_PERMALINK: string[] = []

const timeNow = new Date()
const lastUpdated =
  timeNow.getDate().toString().padStart(2, "0") +
  " " +
  timeNow.toLocaleString("default", { month: "short" }) +
  " " +
  timeNow.getFullYear()

const getSchema = async () => {
  const joinedPermalink = STATIC_ROUTE_PERMALINK.join("/")

  const schema = (await import(`@/schema/${joinedPermalink}.json`)
    .then((module) => module.default)
    // NOTE: If the initial import is missing,
    // this might be the case where the file is an index page
    // and has `_index` appended to the original permalink
    // so we have to do another import w the appended index path
    .catch(async () => {
      const path =
        joinedPermalink === ""
          ? `${INDEX_PAGE_PERMALINK}.json`
          : `${joinedPermalink}/${INDEX_PAGE_PERMALINK}.json`
      return import(`@/schema/${path}`).then((module) => module.default)
    })) as IsomerPageSchemaType

  schema.page.permalink = "/" + joinedPermalink

  schema.page.lastModified =
    // TODO: fixup all the typing errors
    // @ts-ignore to fix when types are proper
    getSitemapXml(sitemap).find(
      ({ url }) => joinedPermalink === url.replace(/^\//, ""),
    ).lastModified || new Date().toISOString()

  return schema
}

export const generateMetadata = async (): Promise<Metadata> => {
  const schema = await getSchema()
  schema.site = {
    ...config.site,
    environment: process.env.NEXT_PUBLIC_ISOMER_NEXT_ENVIRONMENT,
    // TODO: fixup all the typing errors
    // @ts-ignore to fix when types are proper
    siteMap: sitemap,
    navbar: navbar,
    // TODO: fixup all the typing errors
    // @ts-ignore to fix when types are proper
    footerItems: footer,
    lastUpdated,
    assetsBaseUrl: process.env.NEXT_PUBLIC_ASSETS_BASE_URL,
  }
  return getMetadata(schema)
}

const RenderEngine = (props: IsomerPageSchemaType) => {
  if (props.site.theme === "isomer-next") {
    return renderNextLayout(props)
  }

  return null
}

const renderNextLayout = (props: IsomerPageSchemaType) => {
  switch (props.layout) {
    case "article":
      return (
        <ArticleLayoutSkeleton
          {...props}
          renderPageContent={renderPageContent}
        />
      )
    case "collection":
      return <CollectionLayout {...props} />
    case "content":
      return (
        <ContentLayoutSkeleton
          {...props}
          renderPageContent={renderPageContent}
        />
      )
    case "database":
      return (
        <DatabaseLayoutSkeleton
          {...props}
          renderPageContent={renderPageContent}
        />
      )
    case "homepage":
      return (
        <HomepageLayoutSkeleton
          {...props}
          renderPageContent={renderPageContent}
        />
      )
    case "index":
      return (
        <IndexPageLayoutSkeleton
          {...props}
          renderPageContent={renderPageContent}
        />
      )
    case "notfound":
      return <NotFoundLayout {...props} />
    case "search":
      return <SearchLayout {...props} />
    // These are references that we should not render to the user
    case "file":
    case "link":
      return <></>
    default:
      return <></>
  }
}

const renderPageContent = (
  props: RenderPageContentParams,
): RenderPageContentOutput => {
  return renderPageContentSkeleton({ ...props, renderComponent })
}

const renderComponent = ({
  elementKey,
  component,
  ...rest
}: RenderComponentProps): RenderComponentOutput => {
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
    case "formsg":
      return <FormSG key={elementKey} {...component} {...rest} />
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
    case "dynamicdatabanner":
      return <DynamicDataBanner key={elementKey} {...component} {...rest} />
    case "collectionblock":
      return <CollectionBlock key={elementKey} {...component} {...rest} />
    case "imagegallery":
      return <ImageGallery key={elementKey} {...component} {...rest} />
    case "contactinformation":
      return <ContactInformation key={elementKey} {...component} {...rest} />
    case "dynamiccomponentlist":
      return <DynamicComponentList key={elementKey} {...component} {...rest} />
    default:
      return <></>
  }
}

const Page = async () => {
  const renderSchema = await getSchema()

  return (
    <RenderEngine
      {...renderSchema}
      site={{
        ...config.site,
        environment: process.env.NEXT_PUBLIC_ISOMER_NEXT_ENVIRONMENT,
        // TODO: fixup all the typing errors
        // @ts-ignore to fix when types are proper
        siteMap: sitemap,
        navbar: navbar,
        // TODO: fixup all the typing errors
        // @ts-ignore to fix when types are proper
        footerItems: footer,
        lastUpdated,
        assetsBaseUrl: process.env.NEXT_PUBLIC_ASSETS_BASE_URL,
      }}
      meta={{
        // TODO: fixup all the typing errors
        noIndex: shouldBlockIndexing(
          process.env.NEXT_PUBLIC_ISOMER_NEXT_ENVIRONMENT,
        ),
      }}
      LinkComponent={SuperLink}
    />
  )
}

export default Page
