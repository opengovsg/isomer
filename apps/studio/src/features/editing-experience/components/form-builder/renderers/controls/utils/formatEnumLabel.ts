import { startCase } from "lodash-es"

export const formatEnumLabel = (label: string): string =>
  label === label.toLocaleUpperCase() ? label : startCase(label)
