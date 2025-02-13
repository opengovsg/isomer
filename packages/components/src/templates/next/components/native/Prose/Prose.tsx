import type { JSX } from "react"

import type { ProseProps } from "~/interfaces"
import { getTextAsHtml } from "~/utils/getTextAsHtml"
import BaseParagraph from "../../internal/BaseParagraph"
import Divider from "../Divider"
import Heading from "../Heading"
import OrderedList from "../OrderedList"
import Table from "../Table"
import UnorderedList from "../UnorderedList"

const ProseComponent = ({
  component,
  LinkComponent,
  site,
  shouldStripContentHtmlTags,
}: {
  component: NonNullable<ProseProps["content"]>[number]
} & Pick<
  ProseProps,
  "LinkComponent" | "site" | "shouldStripContentHtmlTags"
>): JSX.Element => {
  switch (component.type) {
    case "divider":
      return <Divider {...component} />
    case "heading":
      return <Heading {...component} site={site} />
    case "orderedList":
      return (
        <OrderedList {...component} LinkComponent={LinkComponent} site={site} />
      )
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
          site={site}
          LinkComponent={LinkComponent}
        />
      )
    case "table":
      return <Table {...component} LinkComponent={LinkComponent} site={site} />
    case "unorderedList":
      return (
        <UnorderedList
          {...component}
          LinkComponent={LinkComponent}
          site={site}
        />
      )
  }
}

const Prose = ({
  content,
  LinkComponent,
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
          LinkComponent={LinkComponent}
          site={site}
          shouldStripContentHtmlTags={shouldStripContentHtmlTags}
        />
      ))}
    </>
  )
}

export default Prose
