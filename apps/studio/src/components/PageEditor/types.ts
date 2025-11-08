import { type IsomerComponent } from "@opengovsg/isomer-components"

// TODO: Add better types other than `any`
export interface CustomRendererProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rootSchema: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleChange(path: string, value: any): void
  path: string
}

export type SectionType = IsomerComponent["type"]
