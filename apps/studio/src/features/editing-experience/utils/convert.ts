import { type ParagraphProps } from '@opengovsg/isomer-components/dist/cjs/interfaces'
import { type JSONContent } from '@tiptap/react'
import _, { mapValues } from 'lodash'
import { type ZodType, z } from 'zod'

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

const convertFromTiptapRecursive = (value: JSONContent): any => {
  if (value.content) {
    const { content, ...rest } = value

    const { attrs, ...last } = rest
    const newAttrs = mapValues(attrs, (a) => {
      return a === null ? '' : a
    })

    return {
      ...last,
      ...newAttrs,
      content: content.map((node: any) => convertFromTiptapRecursive(node)),
    }
  }

  // no content, have attrs
  if (value.attrs) {
    const newAttrs = mapValues(value.attrs, (a) => {
      return a === null ? '' : a
    })

    return { ...value, ...newAttrs }
  }

  // no content and no attrs
  return value
}

const baseSchema: ZodType<{
  type: string
  content?: unknown[]
}> = z.object({
  type: z.string(),
  content: z.array(z.lazy(() => baseSchema)).optional(),
})

const docSchema = z.object({
  type: z.literal('doc'),
  content: z.array(baseSchema),
})

// NOTE: Precondition: this must be the output of `editor.getJSON`
// and must have only 1 node with type === "doc"
export const convertFromTiptap = (value: JSONContent): ParagraphProps[] => {
  docSchema.parse(value)

  return value.content?.map(convertFromTiptapRecursive) ?? []
}
