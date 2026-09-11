import { InfopicVariants } from "~/interfaces/complex/Infopic"
import { isExternalUrl } from "~/utils/isExternalUrl"

import type { InfopicProps } from "./types"
import { type ContentBlockIndexProps } from "../../../render/contentBlockIndex"
import { BlockInfopic } from "./components/BlockInfopic"
import { FullInfopic } from "./components/FullInfopic"

type InfopicRenderProps = InfopicProps & ContentBlockIndexProps

export const Infopic = ({
  imageSrc,
  site,
  // NOTE: We need to set a default value here for back-compat
  variant = InfopicVariants.Block.value,
  contentBlockIndex,
  ...rest
}: InfopicRenderProps): JSX.Element => {
  const imgSrc =
    isExternalUrl(imageSrc) || site.assetsBaseUrl === undefined
      ? imageSrc
      : `${site.assetsBaseUrl}${imageSrc}`

  switch (variant) {
    case InfopicVariants.Block.value:
      return (
        <BlockInfopic
          {...rest}
          site={site}
          imageSrc={imgSrc}
          contentBlockIndex={contentBlockIndex}
        />
      )
    case InfopicVariants.Full.value:
      return (
        <FullInfopic
          {...rest}
          site={site}
          imageSrc={imgSrc}
          contentBlockIndex={contentBlockIndex}
        />
      )
    default:
      const missingVariant: never = variant
      return missingVariant
  }
}
