import dynamic from "next/dynamic"
// Static imports - lightweight/critical components that need SSR
import { Accordion } from "@opengovsg/isomer-components/templates/next/components/complex/Accordion"
import { Blockquote } from "@opengovsg/isomer-components/templates/next/components/complex/Blockquote"
import { Callout } from "@opengovsg/isomer-components/templates/next/components/complex/Callout"
import { ChildrenPages } from "@opengovsg/isomer-components/templates/next/components/complex/ChildrenPages"
// Dynamic imports with ssr: false - heavy components that can load client-side
import { ContactInformation } from "@opengovsg/isomer-components/templates/next/components/complex/ContactInformation"
import { Hero } from "@opengovsg/isomer-components/templates/next/components/complex/Hero"
import { Image } from "@opengovsg/isomer-components/templates/next/components/complex/Image"
import { Infobar } from "@opengovsg/isomer-components/templates/next/components/complex/Infobar"
import { InfoCards } from "@opengovsg/isomer-components/templates/next/components/complex/InfoCards"
import { InfoCols } from "@opengovsg/isomer-components/templates/next/components/complex/InfoCols"
import { Infopic } from "@opengovsg/isomer-components/templates/next/components/complex/Infopic"
import { KeyStatistics } from "@opengovsg/isomer-components/templates/next/components/complex/KeyStatistics"
import { Prose } from "@opengovsg/isomer-components/templates/next/components/native/Prose"
import { Contentpic } from "@opengovsg/isomer-components/templates/next/components/complex/Contentpic"
import { CollectionBlock } from "@opengovsg/isomer-components/templates/next/components/complex/CollectionBlock"
import { LogoCloud } from "@opengovsg/isomer-components/templates/next/components/complex/LogoCloud"

import type {
  IsomerComponent,
  IsomerPageLayoutType,
  IsomerSiteProps,
  LinkComponentType,
} from "../../../packages/components/dist/esm/types"

const DynamicComponentList = dynamic(
  () =>
    import(
      "@opengovsg/isomer-components/templates/next/components/complex/DynamicComponentList"
    ).then((m) => m.DynamicComponentList),
  { ssr: false },
)
const DynamicDataBanner = dynamic(
  () =>
    import(
      "@opengovsg/isomer-components/templates/next/components/complex/DynamicDataBanner"
    ).then((m) => m.DynamicDataBanner),
  { ssr: false },
)
const FormSG = dynamic(
  () =>
    import(
      "@opengovsg/isomer-components/templates/next/components/complex/FormSG"
    ).then((m) => m.FormSG),
  { ssr: false },
)
const Iframe = dynamic(
  () =>
    import(
      "@opengovsg/isomer-components/templates/next/components/complex/Iframe"
    ).then((m) => m.Iframe),
  { ssr: false },
)
const ImageGallery = dynamic(
  () =>
    import(
      "@opengovsg/isomer-components/templates/next/components/complex/ImageGallery"
    ).then((m) => m.ImageGallery),
  { ssr: false },
)
const Map = dynamic(
  () =>
    import(
      "@opengovsg/isomer-components/templates/next/components/complex/Map"
    ).then((m) => m.Map),
  { ssr: false },
)
const Video = dynamic(
  () =>
    import(
      "@opengovsg/isomer-components/templates/next/components/complex/Video"
    ).then((m) => m.Video),
  { ssr: false },
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
