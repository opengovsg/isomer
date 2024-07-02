// NOTE: Taken as is from
// https://github.com/isomerpages/isomer-next-playground/blob/4462aeb9c762ffe6d828ced4b0e95527302f9469/src/components/NewEditor/MainTiptapEditor.tsx#L32
export const convertToTiptap: any = (value: any) => {
  const keys = Object.keys(value)

  if (!keys.includes('content')) {
    const { type, ...rest } = value

    if (type === 'text' && keys.includes('text')) {
      const { text, ...last } = rest
      return { type, attrs: { ...last }, text }
    }

    return { type, attrs: { ...rest } }
  }

  const { type, content, ...rest } = value
  return {
    type,
    content: content.map((node: any) => convertToTiptap(node)),
    attrs: { ...rest },
  }
}

export const convertFromTiptap: any = (value: any) => {
  const keys = Object.keys(value)

  if (!keys.includes('content')) {
    if (keys.includes('attrs')) {
      const { attrs, ...rest } = value
      return {
        ...rest,
        ...Object.fromEntries(
          Object.keys(attrs).map((key) => {
            if (attrs[key] === null) {
              return [key, '']
            }

            return [key, attrs[key]]
          }),
        ),
      }
    }
    return { ...value }
  }

  const { content, ...rest } = value

  if (keys.includes('attrs')) {
    const { attrs, ...last } = rest
    return {
      ...last,
      ...Object.fromEntries(
        Object.keys(attrs).map((key) => {
          if (attrs[key] === null) {
            return [key, '']
          }

          return [key, attrs[key]]
        }),
      ),
      content: content.map((node: any) => convertFromTiptap(node)),
    }
  }
  return {
    ...rest,
    content: value.content.map((node: any) => convertFromTiptap(node)),
  }
}
