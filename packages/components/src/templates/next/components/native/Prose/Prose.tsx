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
}: {
  component: NonNullable<ProseProps["content"]>[number]
}): JSX.Element => {
  switch (component.type) {
    case "divider":
      return <Divider {...component} />
    case "heading":
      return <Heading {...component} />
    case "orderedList":
      return <OrderedList {...component} />
    case "paragraph":
      return (
        <BaseParagraph
          content={getTextAsHtml(component.content)}
          className="prose-body-base text-base-content"
        />
      )
    case "table":
      return <Table {...component} />
    case "unorderedList":
      return <UnorderedList {...component} />
  }
}

const Prose = ({ content }: ProseProps) => {
  if (!content) {
    return <></>
  }

  return (
    <>
      {content.map((component, index) => (
        <ProseComponent component={component} key={index} />
      ))}
    </>
  )
}

export default Prose
