export interface HeadingLink {
  content: string
  anchorLink: string
}

export interface TableOfContentsProps {
  type: "tableofcontents"
  items: HeadingLink[]
}

export default TableOfContentsProps
