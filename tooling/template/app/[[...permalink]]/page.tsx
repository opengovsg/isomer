import type { IsomerPageSchemaType } from "@opengovsg/isomer-components"
import type {
  RenderComponentProps,
  RenderPageContentParams,
} from "@opengovsg/isomer-components/templates/next/render/types"
import type { Metadata, ResolvingMetadata } from "next"
import Link from "next/link"
import config from "@/data/config.json"
import footer from "@/data/footer.json"
import navbar from "@/data/navbar.json"
import sitemap from "@/sitemap.json"
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
import { doesComponentHaveImage } from "@opengovsg/isomer-components/templates/next/render/doesComponentHaveImage"

export const dynamic = "force-static"

const INDEX_PAGE_PERMALINK = "_index"

// For static routes (copied pages), define the permalink here as a constant.
// This is needed because static routes don't receive params from Next.js.
//
// Examples:
//   - For /contact/page.tsx: const STATIC_ROUTE_PERMALINK = ["contact"]
//   - For /newsroom/page.tsx: const STATIC_ROUTE_PERMALINK = ["newsroom"]
//   - For /the-president/former-presidents/page.tsx: const STATIC_ROUTE_PERMALINK = ["the-president", "former-presidents"]
//   - For root /page.tsx: const STATIC_ROUTE_PERMALINK = [] (empty array)
//
// Leave undefined for dynamic routes (catch-all route [[...permalink]])
const STATIC_ROUTE_PERMALINK: string[] | undefined = undefined

interface ParamsContent {
  permalink: string[]
}
interface DynamicPageProps {
  params: Promise<ParamsContent>
}

// Note: permalink should not be able to be undefined
// However, nextjs had some magic props passing going on that causes
// { permalink: [""] } to be converted to {}
// Thus the patch is necessary to convert it back if its undefined
// For static routes (copied pages without params), use STATIC_ROUTE_PERMALINK constant
const getPatchedPermalink = async (
  props: DynamicPageProps,
): Promise<ParamsContent["permalink"]> => {
  // For static routes, use the defined constant if available
  // Disabling this because this is a necessary check after this file has been duplicated for each page
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (STATIC_ROUTE_PERMALINK !== undefined) {
    return STATIC_ROUTE_PERMALINK
  }

  // For dynamic routes (catch-all), get from params
  const params = await props.params

  if (
    // Disabling this because this is a necessary check after this file has been duplicated for each page
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    params.permalink &&
    params.permalink.length > 0 &&
    params.permalink[0] !== ""
  ) {
    return params.permalink
  }

  // Fallback to homepage (empty permalink)
  return [""]
}

const timeNow = new Date()
const lastUpdated =
  timeNow.getDate().toString().padStart(2, "0") +
  " " +
  timeNow.toLocaleString("default", { month: "short" }) +
  " " +
  timeNow.getFullYear()

const getSchema = async ({ permalink }: Pick<ParamsContent, "permalink">) => {
  const joinedPermalink: string = permalink.join("/")

  const schema = (await import(`@/schema/${joinedPermalink}.json`)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    .then((module) => module.default)
    // NOTE: If the initial import is missing,
    // this might be the case where the file is an index page
    // and has `_index` appended to the original permalink
    // so we have to do another import w the appended index path
    .catch(async () => {
      if (joinedPermalink === "") {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return import(`@/schema/${INDEX_PAGE_PERMALINK}.json`).then(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
          (module) => module.default,
        )
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return import(
        `@/schema/${joinedPermalink}/${INDEX_PAGE_PERMALINK}.json`
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
      ).then((module) => module.default)
    })) as IsomerPageSchemaType

  const lastModified =
    // TODO: fixup all the typing errors
    // @ts-expect-error to fix when types are proper
    getSitemapXml(sitemap).find(
      ({ url }) => joinedPermalink === url.replace(/^\//, ""),
    ).lastModified || new Date().toISOString()

  schema.page.permalink = "/" + joinedPermalink
  schema.page.lastModified = lastModified

  return schema
}

export const generateStaticParams = () => {
  // TODO: fixup all the typing errors
  // @ts-expect-error to fix when types are proper
  return getSitemapXml(sitemap).map(({ url }) => ({
    permalink: url.replace(/^\//, "").split("/"),
  }))
}

export const generateMetadata = async (
  props: DynamicPageProps,
  _parent: ResolvingMetadata,
): Promise<Metadata> => {
  const schema = await getSchema({
    permalink: await getPatchedPermalink(props),
  })
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
      // TODO: to add transformed content
      // refer to "packages/components/src/templates/next/layouts/Article/Article.tsx"
      return (
        <ArticleLayoutSkeleton
          {...{
            ...props,
            renderPageContent: renderPageContent({
              content: props.content,
              layout: props.layout,
              site: props.site,
              LinkComponent: Link,
              permalink: props.page.permalink,
            }),
          }}
        />
      )
    case "collection":
      return <CollectionLayout {...props} />
    case "content":
      // TODO: to add transformed content
      // refer to "packages/components/src/templates/next/layouts/Content/Content.tsx"
      return (
        <ContentLayoutSkeleton
          {...{
            ...props,
            renderPageContent: renderPageContent({
              content: props.content,
              layout: props.layout,
              site: props.site,
              LinkComponent: Link,
              permalink: props.page.permalink,
            }),
          }}
        />
      )
    case "database":
      // TODO: to add transformed content
      // refer to "packages/components/src/templates/next/layouts/Database/Database.tsx"
      return (
        <DatabaseLayoutSkeleton
          {...{
            ...props,
            renderPageContent: renderPageContent({
              content: props.content,
              layout: props.layout,
              site: props.site,
              LinkComponent: Link,
              permalink: props.page.permalink,
            }),
          }}
        />
      )
    case "homepage":
      // TODO: to add transformed content
      // refer to "packages/components/src/templates/next/layouts/Homepage/Homepage.tsx"
      return (
        <HomepageLayoutSkeleton
          {...{
            ...props,
            renderPageContent: renderPageContent({
              content: props.content,
              layout: props.layout,
              site: props.site,
              LinkComponent: Link,
              permalink: props.page.permalink,
            }),
          }}
        />
      )
    case "index":
      // TODO: to add default children pages block
      // refer to "packages/components/src/templates/next/layouts/IndexPage/IndexPage.tsx"
      return (
        <IndexPageLayoutSkeleton
          {...{
            ...props,
            renderPageContent: renderPageContent({
              content: props.content,
              layout: props.layout,
              site: props.site,
              LinkComponent: Link,
              permalink: props.page.permalink,
            }),
          }}
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

const renderPageContent = ({ content, ...rest }: RenderPageContentParams) => {
  // Find index of first component with image
  const firstImageIndex = content.findIndex((component) =>
    doesComponentHaveImage({ component }),
  )

  let isInfopicTextOnRight = false

  return content.map((component, index) => {
    // Lazy load components with images that appear after the first image.
    // We assume that only the first image component will be visible above the fold,
    // while subsequent components should be lazy loaded to enhance the Lighthouse performance score.
    const shouldLazyLoad = index > firstImageIndex

    if (component.type === "infopic") {
      isInfopicTextOnRight = !isInfopicTextOnRight
      const formattedComponent = {
        ...component,
        isTextOnRight: isInfopicTextOnRight,
      }
      return renderComponent({
        elementKey: index,
        component: formattedComponent,
        shouldLazyLoad,
        ...rest,
      })
    }

    return renderComponent({
      elementKey: index,
      component,
      shouldLazyLoad,
      ...rest,
    })
  })
}

const renderComponent = ({
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

const Page = async (props: DynamicPageProps) => {
  const renderSchema = await getSchema({
    permalink: await getPatchedPermalink(props),
  })

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
      LinkComponent={Link}
    />
  )
}

export default Page
