import React from "react"
import Markdown from "markdown-to-jsx"
import { decode } from "js-base64"

export interface ContentProps {
  markdown: string
}

const HtmlElement = ({ children, ...props }: any) => (
  <div {...props}>{children}</div>
)

const Content: React.FC<ContentProps> = ({ markdown }) => {
  const decodedMarkdown = decode(markdown)
  return (
    <div className="flex justify-center">
      <article className="prose prose-isomer md:prose-lg lg:prose-xl">
        <Markdown>{decodedMarkdown}</Markdown>
      </article>
    </div>
  )
}

export default Content
