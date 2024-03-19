export interface HeadingLink {
  content: string
  anchorLink: string
  level: number
}

export interface TableOfContentsProps {
  type: "tableofcontents"
  items: HeadingLink[]
}

export default TableOfContentsProps
