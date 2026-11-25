import { InfopicVariants } from "~/interfaces/complex/Infopic"

import type { InfopicProps } from "./types"
import { BlockInfopic } from "./components/BlockInfopic"
import { FullInfopic } from "./components/FullInfopic"

// imageSrc is passed through raw (relative). ImageClient (BlockInfopic) and
// FullInfopic resolve it against assetsBaseUrl themselves.
export const Infopic = ({
  site,
  // NOTE: We need to set a default value here for back-compat
  variant = InfopicVariants.Block.value,
  ...rest
}: InfopicProps): JSX.Element => {
  switch (variant) {
    case InfopicVariants.Block.value:
      return <BlockInfopic {...rest} site={site} />
    case InfopicVariants.Full.value:
      return <FullInfopic {...rest} site={site} />
    default:
      const missingVariant: never = variant
      return missingVariant
  }
}
