import { type IsomerComponent } from '@opengovsg/isomer-components'

export interface CustomRendererProps {
  data: any
  rootSchema: any
  handleChange(path: string, value: any): void
  path: string
}

export type SectionType = IsomerComponent['type']
