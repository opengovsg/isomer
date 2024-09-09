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
}: {
  component: NonNullable<ProseProps["content"]>[number]
} & Pick<ProseProps, "LinkComponent">): JSX.Element => {
  switch (component.type) {
    case "divider":
      return <Divider {...component} />
    case "heading":
      return <Heading {...component} />
    case "orderedList":
      return <OrderedList {...component} LinkComponent={LinkComponent} />
    case "paragraph":
      return (
        <BaseParagraph
          content={getTextAsHtml(component.content)}
          className="prose-body-base text-base-content"
          LinkComponent={LinkComponent}
        />
      )
    case "table":
      return <Table {...component} LinkComponent={LinkComponent} />
    case "unorderedList":
      return <UnorderedList {...component} LinkComponent={LinkComponent} />
  }
}

const Prose = ({ content, LinkComponent }: ProseProps) => {
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
        />
      ))}
    </>
  )
}

export default Prose
