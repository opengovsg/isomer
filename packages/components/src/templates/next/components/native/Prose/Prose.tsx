import type { JSX } from "react"
import type { ProseProps } from "~/interfaces"
import { getTextAsHtml } from "~/utils/getTextAsHtml"

import { type ContentBlockIndexProps } from "../../../render/contentBlockIndex"
import { BaseParagraph } from "../../internal/BaseParagraph"
import { Divider } from "../Divider"
import { Heading } from "../Heading"
import { OrderedList } from "../OrderedList"
import { Table } from "../Table"
import { UnorderedList } from "../UnorderedList"

type ProseRenderProps = ProseProps & ContentBlockIndexProps

const ProseComponent = ({
  component,
  site,
  shouldStripContentHtmlTags,
  headingLevel,
  contentBlockIndex,
}: {
  component: NonNullable<ProseProps["content"]>[number]
} & Pick<ProseProps, "site" | "shouldStripContentHtmlTags" | "headingLevel"> &
  ContentBlockIndexProps): JSX.Element => {
  switch (component.type) {
    case "divider":
      return <Divider {...component} contentBlockIndex={contentBlockIndex} />
    case "heading":
      return (
        <Heading
          {...component}
          contentBlockIndex={contentBlockIndex}
          site={site}
          headingLevel={headingLevel}
        />
      )
    case "orderedList":
      return (
        <OrderedList
          {...component}
          contentBlockIndex={contentBlockIndex}
          site={site}
        />
      )
    case "paragraph":
      return (
        <BaseParagraph
          contentBlockIndex={contentBlockIndex}
          content={getTextAsHtml({
            site,
            content: component.content,
            shouldStripContentHtmlTags: shouldStripContentHtmlTags,
          })}
          className="prose-body-base text-base-content"
          attrs={component.attrs}
        />
      )
    case "table":
      return (
        <Table
          {...component}
          contentBlockIndex={contentBlockIndex}
          site={site}
        />
      )
    case "unorderedList":
      return (
        <UnorderedList
          {...component}
          contentBlockIndex={contentBlockIndex}
          site={site}
        />
      )
  }
}

export const Prose = ({
  content,
  site,
  shouldStripContentHtmlTags = false,
  headingLevel,
  contentBlockIndex,
}: ProseRenderProps) => {
  if (!content) {
    return <></>
  }

  return (
    <>
      {content.map((component, index) => (
        <ProseComponent
          component={component}
          key={index}
          site={site}
          shouldStripContentHtmlTags={shouldStripContentHtmlTags}
          headingLevel={headingLevel}
          contentBlockIndex={contentBlockIndex}
        />
      ))}
    </>
  )
}
