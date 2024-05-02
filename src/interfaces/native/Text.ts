interface BoldMark {
  type: "bold"
}

interface CodeMark {
  type: "code"
}

interface ItalicMark {
  type: "italic"
}

interface LinkMark {
  type: "link"
  href: string
}

interface StrikeMark {
  type: "strike"
}

interface SubscriptMark {
  type: "subscript"
}

interface SuperscriptMark {
  type: "superscript"
}

interface UnderlineMark {
  type: "underline"
}

export type Marks =
  | BoldMark
  | CodeMark
  | ItalicMark
  | LinkMark
  | StrikeMark
  | SubscriptMark
  | SuperscriptMark
  | UnderlineMark

export interface TextProps {
  type: "text"
  marks: Marks[]
  text: string
}
