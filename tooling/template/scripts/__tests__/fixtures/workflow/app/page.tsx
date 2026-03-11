// Minimal template for workflow regression test (all cases so update-pages can prune)
const STATIC_ROUTE_PERMALINK: string[] = []

const renderNextLayout = (props: { layout: string }) => {
  switch (props.layout) {
    case "article":
      return null
    case "content":
      return null
    case "homepage":
      return null
    case "index":
      return null
    case "notfound":
      return null
    case "file":
    case "link":
      return null
    default:
      return null
  }
}

const renderComponent = (component: { type: string }) => {
  switch (component.type) {
    case "hero":
      return null
    case "prose":
      return null
    case "image":
      return null
    case "childrenpages":
      return null
    default:
      return null
  }
}

export { renderNextLayout, renderComponent }
