import { InfopicVariants } from "~/interfaces/complex/Infopic"
import { isExternalUrl } from "~/utils"
import { BlockInfopic } from "./components/BlockInfopic"
import { FullInfopic } from "./components/FullInfopic"
import { InfopicProps } from "./types"

export const Infopic = ({
  // NOTE: We need to set a default value here for back-compat
  variant = "block",
  imageSrc,
  site,
  ...rest
}: InfopicProps): JSX.Element => {
  const imgSrc =
    isExternalUrl(imageSrc) || site.assetsBaseUrl === undefined
      ? imageSrc
      : `${site.assetsBaseUrl}${imageSrc}`

  return variant === InfopicVariants.Block.value ? (
    <BlockInfopic {...rest} variant={variant} site={site} imageSrc={imgSrc} />
  ) : (
    <FullInfopic {...rest} variant={variant} site={site} imageSrc={imgSrc} />
  )
}
