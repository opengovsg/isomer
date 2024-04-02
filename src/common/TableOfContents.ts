export interface HeadingLink {
  content: string
  anchorLink: string
}

export interface TableOfContentsProps {
  items: HeadingLink[]
}

export default TableOfContentsProps
