import type { ProseProps } from "~/interfaces"
import { getTextAsHtml } from "~/utils/getTextAsHtml"
import { Paragraph as ParagraphStyles } from "../../../typography/Paragraph"
import BaseParagraph from "../../internal/BaseParagraph"
import Divider from "../Divider"
import Heading from "../Heading"
import Image from "../Image"
import ListItem from "../ListItem"
import OrderedList from "../OrderedList"
import Paragraph from "../Paragraph"
import Table from "../Table"
import UnorderedList from "../UnorderedList"

const Prose = ({ content, inline }: Omit<ProseProps, "type">) => {
  return (
    <>
      {content.map((component, index) => {
        if (component.type === "divider") {
          return <Divider key={index} {...component} />
        } else if (component.type === "heading") {
          return <Heading key={index} {...component} />
        } else if (component.type === "image") {
          return <Image key={index} {...component} />
        } else if (component.type === "listItem") {
          return <ListItem key={index} {...component} />
        } else if (component.type === "orderedlist") {
          return <OrderedList key={index} {...component} />
        } else if (component.type === "paragraph" && !inline) {
          return <Paragraph key={index} {...component} />
        } else if (component.type === "paragraph" && inline) {
          return (
            <BaseParagraph
              key={index}
              content={getTextAsHtml(component.content)}
              className={`text-content ${ParagraphStyles[1]}`}
            />
          )
        } else if (component.type === "table") {
          return <Table key={index} {...component} />
        } else if (component.type === "unorderedlist") {
          return <UnorderedList key={index} {...component} />
        } else {
          return <></>
        }
      })}
    </>
  )
}

export default Prose
