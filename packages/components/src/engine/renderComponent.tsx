import type {
  IsomerComponent,
  IsomerPageLayoutType,
  IsomerSiteProps,
} from "~/types"
import { Accordion } from "~/templates/next/components/complex/Accordion"
import { AntiScamDisclaimerBanner } from "~/templates/next/components/complex/AntiScamDisclaimerBanner"
import { Audio } from "~/templates/next/components/complex/Audio"
import { Blockquote } from "~/templates/next/components/complex/Blockquote"
import { Button } from "~/templates/next/components/complex/Button"
import { Callout } from "~/templates/next/components/complex/Callout"
import { ChildrenPages } from "~/templates/next/components/complex/ChildrenPages"
import { CollectionBlock } from "~/templates/next/components/complex/CollectionBlock"
import { ContactInformation } from "~/templates/next/components/complex/ContactInformation"
import { Contentpic } from "~/templates/next/components/complex/Contentpic"
import { DynamicComponentList } from "~/templates/next/components/complex/DynamicComponentList"
import { DynamicDataBanner } from "~/templates/next/components/complex/DynamicDataBanner"
import { FormSG } from "~/templates/next/components/complex/FormSG"
import { Hero } from "~/templates/next/components/complex/Hero"
import { Iframe } from "~/templates/next/components/complex/Iframe"
import { Image } from "~/templates/next/components/complex/Image"
import { ImageGallery } from "~/templates/next/components/complex/ImageGallery"
import { Infobar } from "~/templates/next/components/complex/Infobar"
import { InfoCards } from "~/templates/next/components/complex/InfoCards"
import { InfoCols } from "~/templates/next/components/complex/InfoCols"
import { Infopic } from "~/templates/next/components/complex/Infopic"
import { KeyStatistics } from "~/templates/next/components/complex/KeyStatistics"
import { LogoCloud } from "~/templates/next/components/complex/LogoCloud"
import { Map } from "~/templates/next/components/complex/Map"
import { Steps } from "~/templates/next/components/complex/Steps"
import { Video } from "~/templates/next/components/complex/Video"
import { Prose } from "~/templates/next/components/native/Prose"
import { getThemeOverrides } from "~/themes/overrides"

export const defaultComponents = {
  Accordion,
  AntiScamDisclaimerBanner,
  Audio,
  Blockquote,
  Button,
  Callout,
  ChildrenPages,
  CollectionBlock,
  ContactInformation,
  Contentpic,
  DynamicComponentList,
  DynamicDataBanner,
  FormSG,
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
  Steps,
  Video,
  Prose,
}

interface RenderComponentProps {
  elementKey?: number
  component: IsomerComponent
  layout: IsomerPageLayoutType
  site: IsomerSiteProps
  shouldLazyLoad?: boolean
  permalink: string
  headingLevel: number
}

export const renderComponent = ({
  elementKey,
  component,
  ...rest
}: RenderComponentProps) => {
  const components = {
    ...defaultComponents,
    ...getThemeOverrides(rest.site.theme).components,
  }
  switch (component.type) {
    case "logocloud":
      return <components.LogoCloud key={elementKey} {...component} {...rest} />
    case "accordion":
      return <components.Accordion key={elementKey} {...component} {...rest} />
    case "antiscambanner":
      return (
        <components.AntiScamDisclaimerBanner
          key={elementKey}
          {...component}
          {...rest}
        />
      )
    case "blockquote":
      return <components.Blockquote key={elementKey} {...component} {...rest} />
    case "button":
      return <components.Button key={elementKey} {...component} {...rest} />
    case "callout":
      return <components.Callout key={elementKey} {...component} {...rest} />
    case "contentpic":
      return <components.Contentpic key={elementKey} {...component} {...rest} />
    case "formsg":
      return <components.FormSG key={elementKey} {...component} {...rest} />
    case "hero":
      return <components.Hero key={elementKey} {...component} {...rest} />
    case "iframe":
      return <components.Iframe key={elementKey} {...component} {...rest} />
    case "image":
      return <components.Image key={elementKey} {...component} {...rest} />
    case "infobar":
      return <components.Infobar key={elementKey} {...component} {...rest} />
    case "infocards":
      return <components.InfoCards key={elementKey} {...component} {...rest} />
    case "infocols":
      return <components.InfoCols key={elementKey} {...component} {...rest} />
    case "infopic":
      return <components.Infopic key={elementKey} {...component} {...rest} />
    case "keystatistics":
      return (
        <components.KeyStatistics key={elementKey} {...component} {...rest} />
      )
    case "steps":
      return <components.Steps key={elementKey} {...component} {...rest} />
    case "map":
      return <components.Map key={elementKey} {...component} {...rest} />
    case "childrenpages":
      return (
        <components.ChildrenPages key={elementKey} {...component} {...rest} />
      )
    case "prose":
      return (
        <components.Prose
          key={elementKey}
          {...component}
          {...rest}
          shouldStripContentHtmlTags
        />
      )
    case "audio":
      return <components.Audio key={elementKey} {...component} {...rest} />
    case "video":
      return <components.Video key={elementKey} {...component} {...rest} />
    case "dynamicdatabanner":
      return (
        <components.DynamicDataBanner
          key={elementKey}
          {...component}
          {...rest}
        />
      )

    case "collectionblock":
      return (
        <components.CollectionBlock key={elementKey} {...component} {...rest} />
      )
    case "imagegallery":
      return (
        <components.ImageGallery key={elementKey} {...component} {...rest} />
      )
    case "contactinformation":
      return (
        <components.ContactInformation
          key={elementKey}
          {...component}
          {...rest}
        />
      )
    case "dynamiccomponentlist":
      return (
        <components.DynamicComponentList
          key={elementKey}
          {...component}
          {...rest}
        />
      )
    default:
      const _: never = component
      return <></>
  }
}
