import type { RenderComponentOutput, RenderComponentProps } from "./types"
import { Accordion } from "../components/complex/Accordion"
import { Blockquote } from "../components/complex/Blockquote"
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
      const _: never = component
      return <></>
  }
}
