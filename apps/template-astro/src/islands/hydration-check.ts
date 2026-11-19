// Development builds only. Preact's hydration keeps whatever the server rendered and only checks
// element types, so a first client render that differs in text or attributes goes unnoticed.
// This renders the island once more, off-page, and reports the first difference from the
// server HTML.
import type { ReactNode } from "react"
import { createRoot } from "react-dom/client"

import { whileHydrating } from "./react"

// react-dom/server separates adjacent text with comments; compare text as one node.
const childNodes = (node: Node) => {
  const copy = node.cloneNode(true)
  const walker = document.createTreeWalker(copy, NodeFilter.SHOW_COMMENT)
  const comments: Node[] = []
  while (walker.nextNode()) comments.push(walker.currentNode)
  comments.forEach((comment) => comment.parentNode?.removeChild(comment))
  copy.normalize()
  return [...copy.childNodes]
}

const describe = (node: Node | undefined) =>
  node instanceof Element
    ? `<${node.localName}>`
    : JSON.stringify(node?.textContent ?? "(nothing)")

// Compared as the browser reads them: for boolean attributes (inert, disabled…) only their presence
// counts, and form values are properties, which Preact sets instead of attributes.
const attributes = (element: Element) => {
  const read = (name: string, value: string) => {
    const property: unknown = element[name as keyof Element]
    if (name === "style" && element instanceof HTMLElement)
      return element.style.cssText
    return typeof property === "boolean" ? "(present)" : value
  }
  const map = new Map(
    [...element.attributes].map(({ name, value }) => [name, read(name, value)]),
  )
  if (element instanceof HTMLInputElement) {
    map.set("value", element.value)
    map.set("checked", String(element.checked))
  }
  return map
}

const firstDifference = (
  server: Node[],
  client: Node[],
  path: string,
): string | undefined => {
  for (let i = 0; i < Math.max(server.length, client.length); i++) {
    const s = server[i]
    const c = client[i]
    const at = `${path} > ${describe(s ?? c)}`
    if (!s || !c || s.nodeName !== c.nodeName)
      return `${path}: server has ${describe(s)}, client has ${describe(c)}`
    if (!(s instanceof Element && c instanceof Element)) {
      if (s.textContent !== c.textContent)
        return `${path}: server text ${describe(s)}, client text ${describe(c)}`
      continue
    }
    const serverAttributes = attributes(s)
    const clientAttributes = attributes(c)
    for (const name of new Set([
      ...serverAttributes.keys(),
      ...clientAttributes.keys(),
    ]))
      if (serverAttributes.get(name) !== clientAttributes.get(name))
        return `${at} [${name}]: server "${serverAttributes.get(name)}", client "${clientAttributes.get(name)}"`
    const inner = firstDifference(childNodes(s), childNodes(c), at)
    if (inner) return inner
  }
}

export const checkHydration = (
  name: string,
  island: HTMLElement,
  tree: ReactNode,
) => {
  const probe = document.createElement("div")
  const root = createRoot(probe)
  whileHydrating(() => root.render(tree))
  const difference = firstDifference(
    childNodes(island),
    childNodes(probe),
    name,
  )
  root.unmount()
  if (difference)
    console.error(`[isomer-islands] hydration mismatch in ${difference}`)
}
