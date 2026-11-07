import type { SingleCardWithImageProps } from "~/interfaces/complex/InfoCards"

// NOTE: helper type to extend the base number of columns
export type With4Cols<T extends Pick<SingleCardWithImageProps, "maxColumns">> =
  Omit<T, "maxColumns"> & {
    maxColumns: SingleCardWithImageProps["maxColumns"] | "4"
  }
