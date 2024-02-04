import React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Components } from "react-markdown"

export interface ContentProps {
  markdown: string
}

export default function Content({ markdown }: ContentProps) {
  // Define custom components with Tailwind CSS classes
  const customComponents: Components = {
    h1: ({ node, ...props }) => (
      <h1 className="text-5xl font-bold mb-4" {...props} />
    ),
    h2: ({ node, ...props }) => (
      <h2 className="text-4xl font-bold mb-4" {...props} />
    ),
    h3: ({ node, ...props }) => (
      <h3 className="text-3xl font-bold mb-3" {...props} />
    ),
    h4: ({ node, ...props }) => (
      <h4 className="text-2xl font-bold mb-3" {...props} />
    ),
    h5: ({ node, ...props }) => (
      <h5 className="text-xl font-bold mb-2" {...props} />
    ),
    h6: ({ node, ...props }) => (
      <h6 className="text-lg font-bold mb-2" {...props} />
    ),
    p: ({ node, ...props }) => <p className="mb-4" {...props} />,
    ul: ({ node, ...props }) => (
      <ul className="list-disc pl-5 mb-4" {...props} />
    ),
    li: ({ node, ...props }) => <li className="mb-2" {...props} />,
    a: ({ node, ...props }) => (
      <a
        className="text-blue-500 hover:text-blue-600 transition-colors duration-200"
        {...props}
      />
    ),

    // Add more custom components as needed for other elements
  }

  return (
    <div>
      <ReactMarkdown rehypePlugins={[remarkGfm]} components={customComponents}>
        {markdown}
      </ReactMarkdown>
    </div>
  )
}
