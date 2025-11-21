import dynamic from "next/dynamic"

import type {
  IsomerComponent,
  IsomerPageLayoutType,
  IsomerSiteProps,
  LinkComponentType,
} from "../../../packages/components/dist/esm/types"

const Accordion = dynamic(() =>
  import(
    "@opengovsg/isomer-components/templates/next/components/complex/Accordion"
  ).then((mod) => mod.Accordion),
)
const Blockquote = dynamic(() =>
  import(
    "@opengovsg/isomer-components/templates/next/components/complex/Blockquote"
  ).then((mod) => mod.Blockquote),
)
const Callout = dynamic(() =>
  import(
    "@opengovsg/isomer-components/templates/next/components/complex/Callout"
  ).then((mod) => mod.Callout),
)
const ChildrenPages = dynamic(() =>
  import(
    "@opengovsg/isomer-components/templates/next/components/complex/ChildrenPages"
  ).then((mod) => mod.ChildrenPages),
)
const CollectionBlock = dynamic(() =>
  import(
    "@opengovsg/isomer-components/templates/next/components/complex/CollectionBlock"
  ).then((mod) => mod.CollectionBlock),
)
const ContactInformation = dynamic(() =>
  import(
    "@opengovsg/isomer-components/templates/next/components/complex/ContactInformation"
  ).then((mod) => mod.ContactInformation),
)
const Contentpic = dynamic(() =>
  import(
    "@opengovsg/isomer-components/templates/next/components/complex/Contentpic"
  ).then((mod) => mod.Contentpic),
)
const DynamicComponentList = dynamic(() =>
  import(
    "@opengovsg/isomer-components/templates/next/components/complex/DynamicComponentList"
  ).then((mod) => mod.DynamicComponentList),
)
const DynamicDataBanner = dynamic(() =>
  import(
    "@opengovsg/isomer-components/templates/next/components/complex/DynamicDataBanner"
  ).then((mod) => mod.DynamicDataBanner),
)
const FormSG = dynamic(() =>
  import(
    "@opengovsg/isomer-components/templates/next/components/complex/FormSG"
  ).then((mod) => mod.FormSG),
)
const Hero = dynamic(() =>
  import(
    "@opengovsg/isomer-components/templates/next/components/complex/Hero"
  ).then((mod) => mod.Hero),
)
const Iframe = dynamic(() =>
  import(
    "@opengovsg/isomer-components/templates/next/components/complex/Iframe"
  ).then((mod) => mod.Iframe),
)
const Image = dynamic(() =>
  import(
    "@opengovsg/isomer-components/templates/next/components/complex/Image"
  ).then((mod) => mod.Image),
)
const ImageGallery = dynamic(() =>
  import(
    "@opengovsg/isomer-components/templates/next/components/complex/ImageGallery"
  ).then((mod) => mod.ImageGallery),
)
const Infobar = dynamic(() =>
  import(
    "@opengovsg/isomer-components/templates/next/components/complex/Infobar"
  ).then((mod) => mod.Infobar),
)
const InfoCards = dynamic(() =>
  import(
    "@opengovsg/isomer-components/templates/next/components/complex/InfoCards"
  ).then((mod) => mod.InfoCards),
)
const InfoCols = dynamic(() =>
  import(
    "@opengovsg/isomer-components/templates/next/components/complex/InfoCols"
  ).then((mod) => mod.InfoCols),
)
const Infopic = dynamic(() =>
  import(
    "@opengovsg/isomer-components/templates/next/components/complex/Infopic"
  ).then((mod) => mod.Infopic),
)
const KeyStatistics = dynamic(() =>
  import(
    "@opengovsg/isomer-components/templates/next/components/complex/KeyStatistics"
  ).then((mod) => mod.KeyStatistics),
)
const LogoCloud = dynamic(() =>
  import(
    "@opengovsg/isomer-components/templates/next/components/complex/LogoCloud"
  ).then((mod) => mod.LogoCloud),
)
const Map = dynamic(() =>
  import(
    "@opengovsg/isomer-components/templates/next/components/complex/Map"
  ).then((mod) => mod.Map),
)
const Video = dynamic(() =>
  import(
    "@opengovsg/isomer-components/templates/next/components/complex/Video"
  ).then((mod) => mod.Video),
)
const Prose = dynamic(() =>
  import(
    "@opengovsg/isomer-components/templates/next/components/native/Prose"
  ).then((mod) => mod.Prose),
)

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
