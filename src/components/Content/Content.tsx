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
  // Define custom components with Tailwind CSS classes
  const options = {
    overrides: {
      h1: {
        component: HtmlElement,
        props: {
          className: "text-5xl font-bold mb-4",
        },
      },
      h2: {
        component: HtmlElement,
        props: {
          className: "text-4xl font-bold mb-4",
        },
      },
      h3: {
        component: HtmlElement,
        props: {
          className: "text-3xl font-bold mb-3",
        },
      },
      h4: {
        component: HtmlElement,
        props: {
          className: "text-2xl font-bold mb-3",
        },
      },
      h5: {
        component: HtmlElement,
        props: {
          className: "text-xl font-bold mb-2",
        },
      },
      h6: {
        component: HtmlElement,
        props: {
          className: "text-lg font-bold mb-2",
        },
      },
      p: {
        component: HtmlElement,
        props: {
          className: "mb-4",
        },
      },
      ul: {
        component: HtmlElement,
        props: {
          className: "list-disc pl-5 mb-4",
        },
      },
      li: {
        component: HtmlElement,
        props: {
          className: "mb-2",
        },
      },
      a: {
        component: HtmlElement,
        props: {
          className:
            "text-blue-500 hover:text-blue-600 transition-colors duration-200",
        },
      },
    },
  }

  const decodedMarkdown = decode(markdown)
  console.log(`Decoded markdown`, decodedMarkdown)
  return (
    <div>
      <Markdown options={options}>{decodedMarkdown}</Markdown>
    </div>
  )
}

export default Content
