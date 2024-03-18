export interface HeadingLink {
  content: string
  anchorLink: string
  level: number
}

export interface TableOfContentsProps {
  type: "tableofcontents"
  headings: HeadingLink[]
}

export default TableOfContentsProps
