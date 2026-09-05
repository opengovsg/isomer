import type {
  IsomerComponent,
  IsomerPageLayoutType,
  IsomerSiteProps,
} from "~/types"

import { Accordion } from "../components/complex/Accordion"
import { AntiScamDisclaimerBanner } from "../components/complex/AntiScamDisclaimerBanner"
import { Audio } from "../components/complex/Audio"
import { Blockquote } from "../components/complex/Blockquote"
import { Button } from "../components/complex/Button"
import { Callout } from "../components/complex/Callout"
import { ChildrenPages } from "../components/complex/ChildrenPages"
import { CollectionBlock } from "../components/complex/CollectionBlock"
import { ContactInformation } from "../components/complex/ContactInformation"
import { Contentpic } from "../components/complex/Contentpic"
import { DynamicComponentList } from "../components/complex/DynamicComponentList"
import { DynamicDataBanner } from "../components/complex/DynamicDataBanner"
import { FormSG } from "../components/complex/FormSG"
import { Hero } from "../components/complex/Hero"
import { Iframe } from "../components/complex/Iframe"
import { Image } from "../components/complex/Image"
import { ImageGallery } from "../components/complex/ImageGallery"
import { Infobar } from "../components/complex/Infobar"
import { InfoCards } from "../components/complex/InfoCards"
import { InfoCols } from "../components/complex/InfoCols"
import { Infopic } from "../components/complex/Infopic"
import { KeyStatistics } from "../components/complex/KeyStatistics"
import { LogoCloud } from "../components/complex/LogoCloud"
import { Map } from "../components/complex/Map"
import { Video } from "../components/complex/Video"
import { Prose } from "../components/native/Prose"

interface RenderComponentProps {
  elementKey?: number
  contentIndex: number
  component: IsomerComponent
  layout: IsomerPageLayoutType
  site: IsomerSiteProps
  shouldLazyLoad?: boolean
  permalink: string
  headingLevel: number
}

export const renderComponent = ({
  elementKey,
  contentIndex,
  component,
  ...rest
}: RenderComponentProps) => {
  switch (component.type) {
    case "logocloud":
      return (
        <LogoCloud
          key={elementKey}
          {...component}
          {...rest}
          contentBlockIndex={contentIndex}
        />
      )
    case "accordion":
      return (
        <Accordion
          key={elementKey}
          {...component}
          {...rest}
          contentBlockIndex={contentIndex}
        />
      )
    case "antiscambanner":
      return (
        <AntiScamDisclaimerBanner
          key={elementKey}
          contentBlockIndex={contentIndex}
        />
      )
    case "blockquote":
      return (
        <Blockquote
          key={elementKey}
          {...component}
          {...rest}
          contentBlockIndex={contentIndex}
        />
      )
    case "button":
      return (
        <Button
          key={elementKey}
          {...component}
          {...rest}
          contentBlockIndex={contentIndex}
        />
      )
    case "callout":
      return (
        <Callout
          key={elementKey}
          {...component}
          {...rest}
          contentBlockIndex={contentIndex}
        />
      )
    case "contentpic":
      return (
        <Contentpic
          key={elementKey}
          {...component}
          {...rest}
          contentBlockIndex={contentIndex}
        />
      )
    case "formsg":
      return (
        <FormSG
          key={elementKey}
          {...component}
          {...rest}
          contentBlockIndex={contentIndex}
        />
      )
    case "hero":
      return (
        <Hero
          key={elementKey}
          {...component}
          {...rest}
          contentBlockIndex={contentIndex}
        />
      )
    case "iframe":
      return (
        <Iframe
          key={elementKey}
          {...component}
          {...rest}
          contentBlockIndex={contentIndex}
        />
      )
    case "image":
      return (
        <Image
          key={elementKey}
          {...component}
          {...rest}
          contentBlockIndex={contentIndex}
        />
      )
    case "infobar":
      return (
        <Infobar
          key={elementKey}
          {...component}
          {...rest}
          contentBlockIndex={contentIndex}
        />
      )
    case "infocards":
      return (
        <InfoCards
          key={elementKey}
          {...component}
          {...rest}
          contentBlockIndex={contentIndex}
        />
      )
    case "infocols":
      return (
        <InfoCols
          key={elementKey}
          {...component}
          {...rest}
          contentBlockIndex={contentIndex}
        />
      )
    case "infopic":
      return (
        <Infopic
          key={elementKey}
          {...component}
          {...rest}
          contentBlockIndex={contentIndex}
        />
      )
    case "keystatistics":
      return (
        <KeyStatistics
          key={elementKey}
          {...component}
          {...rest}
          contentBlockIndex={contentIndex}
        />
      )
    case "map":
      return (
        <Map
          key={elementKey}
          {...component}
          {...rest}
          contentBlockIndex={contentIndex}
        />
      )
    case "childrenpages":
      return (
        <ChildrenPages
          key={elementKey}
          {...component}
          {...rest}
          contentBlockIndex={contentIndex}
        />
      )
    case "prose":
      return (
        <Prose
          key={elementKey}
          {...component}
          {...rest}
          contentBlockIndex={contentIndex}
          shouldStripContentHtmlTags
        />
      )
    case "audio":
      return (
        <Audio
          key={elementKey}
          {...component}
          {...rest}
          contentBlockIndex={contentIndex}
        />
      )
    case "video":
      return (
        <Video
          key={elementKey}
          {...component}
          {...rest}
          contentBlockIndex={contentIndex}
        />
      )
    case "dynamicdatabanner":
      return (
        <DynamicDataBanner
          key={elementKey}
          {...component}
          {...rest}
          contentBlockIndex={contentIndex}
        />
      )

    case "collectionblock":
      return (
        <CollectionBlock
          key={elementKey}
          {...component}
          {...rest}
          contentBlockIndex={contentIndex}
        />
      )
    case "imagegallery":
      return (
        <ImageGallery
          key={elementKey}
          {...component}
          {...rest}
          contentBlockIndex={contentIndex}
        />
      )
    case "contactinformation":
      return (
        <ContactInformation
          key={elementKey}
          {...component}
          {...rest}
          contentBlockIndex={contentIndex}
        />
      )
    case "dynamiccomponentlist":
      return (
        <DynamicComponentList
          key={elementKey}
          {...component}
          {...rest}
          contentBlockIndex={contentIndex}
        />
      )
    default:
      const _: never = component
      return <></>
  }
}
