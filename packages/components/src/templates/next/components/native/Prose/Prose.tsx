import type { ProseProps } from "~/interfaces"
import { getTextAsHtml } from "~/utils/getTextAsHtml"
import BaseParagraph from "../../internal/BaseParagraph"
import Divider from "../Divider"
import Heading from "../Heading"
import OrderedList from "../OrderedList"
import Table from "../Table"
import UnorderedList from "../UnorderedList"

const Prose = ({ content }: ProseProps) => {
  return (
    <>
      {content.map((component, index) => {
        if (component.type === "divider") {
          return <Divider key={index} {...component} />
        } else if (component.type === "heading") {
          return <Heading key={index} {...component} />
        } else if (component.type === "orderedList") {
          return <OrderedList key={index} {...component} />
        } else if (component.type === "paragraph") {
          return (
            <BaseParagraph
              key={index}
              content={getTextAsHtml(component.content)}
              className="text-paragraph-01 text-content"
            />
          )
        } else if (component.type === "table") {
          return <Table key={index} {...component} />
        } else if (component.type === "unorderedList") {
          return <UnorderedList key={index} {...component} />
        } else {
          const _: never = component
          return <></>
        }
      })}
    </>
  )
}

export default Prose
