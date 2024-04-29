import { TextProps } from "~/interfaces/native/Text"

export const getTextAsHtml = (content: TextProps[]) => {
  return content.map((node) => node.text).join("")
}
