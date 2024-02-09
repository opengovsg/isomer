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
} from "../components"

interface IsomerComponent {
  id: string
  sectionIdx: number
  props: any
}

interface IsomerBaseSchema {
  id: string
  layout: string
  path: string
  components: IsomerComponent[]
}

const RenderEngine = ({
  id,
  layout,
  path,
  components,
}: IsomerBaseSchema): ReactElement => {
  console.log(`${id} ${layout} ${path}`)
  if (components && components.length > 0) {
    const collatedComponents = components.map(
      (component: IsomerComponent, idx: number) => {
        if (component.id === "Button") {
          return <Button label={component.props.label} />
        }
        if (component.id === "Hero") {
          const { heroTitle, heroCaption, buttonLabel, logoUrl, nav, bgUrl } =
            component.props
          return (
            <Hero
              sectionIdx={component.sectionIdx}
              logoUrl={logoUrl}
              heroTitle={heroTitle}
              heroCaption={heroCaption}
              buttonLabel={buttonLabel}
              bgUrl={bgUrl}
            />
          )
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
              alt={alt}
              imageUrl={imageUrl}
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
          const { logo, links } = component.props
          return <Navbar logo={logo} links={links} />
        }
        return <div key={idx}>Component not found</div>
      },
    )
    return <>{collatedComponents}</>
  }
  return <h1>Hello World</h1>
}

export default RenderEngine
