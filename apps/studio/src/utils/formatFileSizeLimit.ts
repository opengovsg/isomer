import { ONE_MB_IN_BYTES } from "~/features/editing-experience/components/form-builder/renderers/controls/constants"

const ONE_KB_IN_BYTES = ONE_MB_IN_BYTES / 1000

const formatQuotient = ({
  bytes,
  unitSize,
}: {
  bytes: number
  unitSize: number
}): string => {
  const q = bytes / unitSize
  if (Number.isInteger(q)) return String(q)
  const rounded = Math.round(q * 100) / 100
  return String(rounded)
}

/** Human-readable size for upload limits: KB if under 1 MB, otherwise MB (decimal units, matching ONE_MB_IN_BYTES). */
export const formatFileSizeLimit = ({ bytes }: { bytes: number }): string => {
  if (bytes >= ONE_MB_IN_BYTES) {
    return `${formatQuotient({ bytes, unitSize: ONE_MB_IN_BYTES })} MB`
  }
  return `${formatQuotient({ bytes, unitSize: ONE_KB_IN_BYTES })} KB`
}
