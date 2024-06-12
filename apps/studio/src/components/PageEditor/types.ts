export interface CustomRendererProps {
  data: any
  rootSchema: any
  handleChange(path: string, value: any): void
  path: string
}
