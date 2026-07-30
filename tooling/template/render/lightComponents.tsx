import type {
  RenderComponentOutput,
  RenderComponentProps,
  RenderPageContentOutput,
  RenderPageContentParams,
} from "@opengovsg/isomer-components/templates/next/render/types"
import { Accordion } from "@opengovsg/isomer-components/templates/next/components/complex/Accordion"
import { AntiScamDisclaimerBanner } from "@opengovsg/isomer-components/templates/next/components/complex/AntiScamDisclaimerBanner"
import { Audio } from "@opengovsg/isomer-components/templates/next/components/complex/Audio"
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
import { renderPageContentSkeleton } from "@opengovsg/isomer-components/templates/next/render/renderPageContentSkeleton"

export const renderComponent = ({
  elementKey,
  component,
  ...rest
}: RenderComponentProps): RenderComponentOutput => {
  switch (component.type) {
    case "logocloud":
      return <LogoCloud key={elementKey} {...component} {...rest} />
    case "accordion":
      return <Accordion key={elementKey} {...component} {...rest} />
    case "antiscambanner":
      return (
        <AntiScamDisclaimerBanner key={elementKey} {...component} {...rest} />
      )
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
    case "audio":
      return <Audio key={elementKey} {...component} {...rest} />
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
    default: {
      const _: never = component
      return <></>
    }
  }
}

export const renderPageContent = (
  props: RenderPageContentParams,
): RenderPageContentOutput => {
  return renderPageContentSkeleton({ ...props, renderComponent })
}
