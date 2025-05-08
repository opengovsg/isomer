import React from "react"

export const getReactNodeText = (node: React.ReactNode): string => {
  let text = ""

  React.Children.forEach(node, (child) => {
    if (child === null) return
    if (typeof child === "boolean") return
    if (typeof child === "undefined") return

    if (typeof child === "string" || typeof child === "number") {
      text += child.toString()
    } else if (React.isValidElement(child)) {
      if (child.props && "children" in child.props) {
        text += getReactNodeText(child.props.children)
      }
    }
  })

  return text
}
