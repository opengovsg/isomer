import { HeadingProps } from "~/common"
import { Heading as HeadingStyles } from "~/templates/next/typography/Heading"
import ContentHole from "../../tiptap/ContentHole"

const Heading = ({
  id,
  content,
  level,
  NodeViewWrapper = `h${level}`,
  NodeViewContent,
}: Omit<HeadingProps, "type">) => {
  if (level === 2 || level === "2") {
    return (
      <NodeViewWrapper
        as="h2"
        id={id}
        className={`${HeadingStyles[2]} text-content [&:not(:first-child)]:mt-36`}
      >
        <ContentHole content={content} NodeViewContent={NodeViewContent} />
      </NodeViewWrapper>
    )
  }
  if (level === 3 || level === "3") {
    return (
      <NodeViewWrapper
        as="h3"
        id={id}
        className={`${HeadingStyles[3]} text-content [&:not(:first-child)]:mt-16`}
      >
        <ContentHole content={content} NodeViewContent={NodeViewContent} />
      </NodeViewWrapper>
    )
  }
  if (level === 4 || level === "4") {
    return (
      <NodeViewWrapper
        as="h4"
        id={id}
        className={`${HeadingStyles[4]} text-content [&:not(:first-child)]:mt-12`}
      >
        <ContentHole content={content} NodeViewContent={NodeViewContent} />
      </NodeViewWrapper>
    )
  }
  if (level === 5 || level === "5") {
    return (
      <NodeViewWrapper
        as="h5"
        id={id}
        className={`${HeadingStyles[5]} text-content [&:not(:first-child)]:mt-7`}
      >
        <ContentHole content={content} NodeViewContent={NodeViewContent} />
      </NodeViewWrapper>
    )
  }
  return (
    <NodeViewWrapper
      as="h6"
      id={id}
      className={`${HeadingStyles[6]} text-content [&:not(:first-child)]:mt-7`}
    >
      <ContentHole content={content} NodeViewContent={NodeViewContent} />
    </NodeViewWrapper>
  )
}

export default Heading
