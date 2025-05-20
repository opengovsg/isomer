import type { InfopicProps } from "./types"
import { InfopicVariants } from "~/interfaces/complex/Infopic"
import { isExternalUrl } from "~/utils"
import { BlockInfopic } from "./components/BlockInfopic"
import { FullInfopic } from "./components/FullInfopic"

export const Infopic = ({
  imageSrc,
  site,
  // NOTE: We need to set a default value here for back-compat
  variant = InfopicVariants.Block.value,
  ...rest
}: InfopicProps): JSX.Element => {
  const imgSrc =
    isExternalUrl(imageSrc) || site.assetsBaseUrl === undefined
      ? imageSrc
      : `${site.assetsBaseUrl}${imageSrc}`

  switch (variant) {
    case InfopicVariants.Block.value:
      return <BlockInfopic {...rest} site={site} imageSrc={imgSrc} />
    case InfopicVariants.Full.value:
      return <FullInfopic {...rest} site={site} imageSrc={imgSrc} />
    default:
      const missingVariant: never = variant
      throw new Error(
        `Expected all variants to be covered for Infopic, missing: ${missingVariant}`,
      )
  }
}
