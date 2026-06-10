import type { JSX } from "react"
import type { ProseProps } from "~/interfaces"
import { getTextAsHtml } from "~/utils/getTextAsHtml"

import { BaseParagraph } from "../../internal/BaseParagraph"
import { Divider } from "../Divider"
import { Heading } from "../Heading"
import { OrderedList } from "../OrderedList"
import { Table } from "../Table"
import { UnorderedList } from "../UnorderedList"

const ProseComponent = ({
  component,
  site,
  shouldStripContentHtmlTags,
}: {
  component: NonNullable<ProseProps["content"]>[number]
} & Pick<ProseProps, "site" | "shouldStripContentHtmlTags">): JSX.Element => {
  switch (component.type) {
    case "divider":
      return <Divider {...component} />
    case "heading":
      return <Heading {...component} site={site} />
    case "orderedList":
      return <OrderedList {...component} site={site} />
    case "paragraph":
      return (
        <BaseParagraph
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
      return <Table {...component} site={site} />
    case "unorderedList":
      return <UnorderedList {...component} site={site} />
  }
}

export const Prose = ({
  content,
  site,
  shouldStripContentHtmlTags = false,
}: ProseProps) => {
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
        />
      ))}
    </>
  )
}
