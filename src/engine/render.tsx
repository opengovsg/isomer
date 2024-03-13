import React, { ReactElement } from "react"
import {
  Button,
  Cards,
  Footer,
  Hero,
  InfoPic,
  Content,
  Infobar,
  Navbar,
  Search,
  Image,
} from "../templates/classic/components"
import { DefaultLayout, HomeLayout, ContentLayout } from "../layouts"

export interface IsomerComponent {
  id: string
  sectionIdx?: number
  props: any
  indexable?: string[]
}

export type Sitemap = {
  title: string
  paths: SitemapEntry[]
}

export type SitemapEntry = {
  permalink: string
  title: string
  paths?: SitemapEntry[] // Optional to handle leaf nodes with no further paths
}

export interface IsomerBaseSchema {
  id: string
  layout?: string
  title?: string
  config?: Config
  permalink?: string
  components: IsomerComponent[]
  sitemap?: Sitemap
  indexable?: string[] // specifies which keys are indexable
  LinkComponent?: any // Next.js Link
}

export interface Config {
  navbar: IsomerBaseSchema
  footer: IsomerBaseSchema
}

const getComponent = (
  component: IsomerComponent,
  LinkComponent: any,
): ReactElement | null => {
  if (component.id === "Button") {
    const {
      label,
      href,
      textColor,
      clear,
      outlined,
      rounded,
      leftIcon,
      rightIcon,
    } = component.props
    return (
      <Button
        label={label}
        href={href}
        textColor={textColor}
        clear={clear}
        outlined={outlined}
        rounded={rounded}
        leftIcon={leftIcon}
        rightIcon={rightIcon}
      />
    )
  }
  if (component.id === "Hero") {
    return <Hero {...component.props} />
  }
  if (component.id === "Footer") {
    const { agencyName, lastUpdated, items } = component.props
    return (
      <Footer
        sectionIdx={component.sectionIdx}
        agencyName={agencyName}
        lastUpdated={lastUpdated}
        items={items}
      />
    )
  }
  if (component.id === "Cards") {
    const { sectionTitle, sectionCaption, cards } = component.props
    return (
      <Cards
        sectionIdx={component.sectionIdx}
        sectionTitle={sectionTitle}
        sectionCaption={sectionCaption}
        cards={cards}
      />
    )
  }
  if (component.id === "InfoPic") {
    const {
      title,
      subtitle,
      description,
      alt,
      imageUrl,
      buttonLabel,
      buttonUrl,
    } = component.props
    return (
      <InfoPic
        sectionIndex={component.sectionIdx}
        title={title}
        subtitle={subtitle}
        description={description}
        imageAlt={alt}
        imageSrc={imageUrl}
        buttonLabel={buttonLabel}
        buttonUrl={buttonUrl}
      />
    )
  }
  if (component.id === "Content") {
    const { markdown } = component.props
    return <Content markdown={markdown} />
  }
  if (component.id === "Infobar") {
    const { title, subtitle, description, buttonLabel, buttonUrl } =
      component.props
    return (
      <Infobar
        sectionIdx={component.sectionIdx}
        title={title}
        subtitle={subtitle}
        description={description}
        buttonLabel={buttonLabel}
        buttonUrl={buttonUrl}
      />
    )
  }
  if (component.id === "Navbar") {
    const { logo, links, search } = component.props
    return (
      <Navbar
        logo={logo}
        links={links}
        search={search}
        LinkComponent={LinkComponent}
      />
    )
  }

  if (component.id === "Search") {
    const { index } = component.props
    return <Search index={index} />
  }

  if (component.id === "Image") {
    const { src, alt, width, href, openInNewTab } = component.props
    return <Image src={src} alt={alt} width={width} href={href} />
  }
  return null
}

const renderLayout = (
  layout: string,
  config: Config,
  collatedComponents: React.ReactNode,
  permalink?: string,
  sitemap?: Sitemap,
  LinkComponent?: any,
) => {
  if (layout && config) {
    switch (layout) {
      case "default":
        return (
          <DefaultLayout
            navbar={config.navbar}
            footer={config.footer}
            sitemap={sitemap}
            permalink={permalink}
            LinkComponent={LinkComponent}
          >
            {collatedComponents}
          </DefaultLayout>
        )
      case "content":
        return (
          <ContentLayout
            navbar={config.navbar}
            footer={config.footer}
            sitemap={sitemap}
            permalink={permalink}
            LinkComponent={LinkComponent}
          >
            {collatedComponents}
          </ContentLayout>
        )
      case "home":
        return (
          <HomeLayout
            navbar={config.navbar}
            footer={config.footer}
            LinkComponent={LinkComponent}
          >
            {collatedComponents}
          </HomeLayout>
        )
      default:
        return collatedComponents
    }
  }
}

const RenderEngine = ({
  layout,
  permalink,
  config,
  sitemap,
  components,
  LinkComponent,
}: IsomerBaseSchema): React.ReactNode => {
  if (components && components.length > 0) {
    const collatedComponents = components.map(
      (component: IsomerComponent, idx: number) => {
        return <div key={idx}>{getComponent(component, LinkComponent)}</div>
      },
    )

    if (layout && config)
      return renderLayout(
        layout,
        config,
        collatedComponents,
        permalink,
        sitemap,
        LinkComponent,
      )
    return collatedComponents
  }
}

export default RenderEngine
export { RenderEngine }
