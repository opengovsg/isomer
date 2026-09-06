import type { JSX } from "react"
import type { ProseProps } from "~/interfaces"
import { getProseContentKey } from "~/utils/getProseContentKey"
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
  headingLevel,
}: {
  component: NonNullable<ProseProps["content"]>[number]
} & Pick<
  ProseProps,
  "site" | "shouldStripContentHtmlTags" | "headingLevel"
>): JSX.Element => {
  switch (component.type) {
    case "divider": {
      return <Divider {...component} />
    }
    case "heading": {
      return <Heading {...component} site={site} headingLevel={headingLevel} />
    }
    case "orderedList": {
      return <OrderedList {...component} site={site} />
    }
    case "paragraph": {
      return (
        <BaseParagraph
          content={getTextAsHtml({
            content: component.content,
            shouldStripContentHtmlTags,
            site,
          })}
          className="prose-body-base text-base-content"
          attrs={component.attrs}
        />
      )
    }
    case "table": {
      return <Table {...component} site={site} />
    }
    case "unorderedList": {
      return <UnorderedList {...component} site={site} />
    }
  }
}

export const Prose = ({
  content,
  site,
  shouldStripContentHtmlTags = false,
  headingLevel,
}: ProseProps) => {
  if (!content) {
    return null
  }

  return (
    <>
      {content.map((component) => (
        <ProseComponent
          component={component}
          key={getProseContentKey(component)}
          site={site}
          shouldStripContentHtmlTags={shouldStripContentHtmlTags}
          headingLevel={headingLevel}
        />
      ))}
    </>
  )
}
