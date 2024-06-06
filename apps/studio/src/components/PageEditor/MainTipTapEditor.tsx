import { Bold } from '@tiptap/extension-bold'
import { BulletList } from '@tiptap/extension-bullet-list'
import { Document } from '@tiptap/extension-document'
import { Dropcursor } from '@tiptap/extension-dropcursor'
import { Gapcursor } from '@tiptap/extension-gapcursor'
import { Heading } from '@tiptap/extension-heading'
import { History } from '@tiptap/extension-history'
import { HorizontalRule } from '@tiptap/extension-horizontal-rule'
import { Italic } from '@tiptap/extension-italic'
import { ListItem } from '@tiptap/extension-list-item'
import { OrderedList } from '@tiptap/extension-ordered-list'
import { Paragraph } from '@tiptap/extension-paragraph'
import { Strike } from '@tiptap/extension-strike'
import { Subscript } from '@tiptap/extension-subscript'
import { Superscript } from '@tiptap/extension-superscript'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { Text } from '@tiptap/extension-text'
import { Underline } from '@tiptap/extension-underline'
import { Extension, Node } from '@tiptap/core'

import {
  EditorContent,
  useEditor,
  NodeViewWrapper,
  ReactNodeViewRenderer,
} from '@tiptap/react'
import type { CustomRendererProps } from './types'
import MenuBar from './MenuBar'
import { Box } from '@chakra-ui/react'

const convertToTiptap: any = (value: any) => {
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

const convertFromTiptap: any = (value: any) => {
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

const CustomNode = ({ type }: any) => {
  return (
    <NodeViewWrapper>
      <Box
        px="0.5rem"
        py="0.25rem"
        background="slate-100"
        className="px-2 py-1 bg-slate-100"
      >
        {type}
      </Box>
    </NodeViewWrapper>
  )
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    isomer: {
      // Add a new complex component
      createComplexComponent: (component: string) => ReturnType
    }
  }
}

const MainTiptapEditor = ({
  data,
  rootSchema,
  handleChange,
  path,
}: CustomRendererProps) => {
  const complex = Object.keys(rootSchema.components.complex).map((component) =>
    Node.create({
      name: component,
      group: 'block',
      draggable: true,
      selectable: true,
      atom: true,
      addAttributes() {
        return Object.fromEntries(
          Object.keys(rootSchema.components.complex[component].properties)
            .filter((key) => key !== 'type')
            .map((key) => [key, { default: '' }]),
        )
      },

      renderHTML() {
        return [this.name, {}, 0]
      },
      addNodeView() {
        return ReactNodeViewRenderer((props: any) =>
          CustomNode({ type: component, ...props }),
        )
      },
    }),
  )

  const editor = useEditor({
    extensions: [
      // Blockquote,
      Bold,
      BulletList.extend({
        name: 'unorderedlist',
      }),
      // Code,
      // CodeBlock,
      Document,
      Dropcursor,
      Gapcursor,
      // HardBreak,
      Heading,
      History,
      HorizontalRule.extend({
        name: 'divider',
      }),
      Italic,
      ListItem,
      OrderedList.extend({
        name: 'orderedlist',
      }),
      Paragraph,
      Strike,
      Subscript,
      Superscript,
      Table,
      TableRow,
      TableCell,
      TableHeader,
      Text,
      Underline,
      ...complex,
      Extension.create({
        name: 'isomer',
        addCommands() {
          return {
            createComplexComponent:
              (component: string) =>
              ({ tr, dispatch, editor }) => {
                const { selection } = tr
                const parentNode = editor.schema.nodes[component]
                if (!parentNode) return false
                const node = parentNode.create({})

                if (dispatch) {
                  tr.replaceRangeWith(selection.from, selection.to, node)
                }

                return true
              },
          }
        },
      }),
    ],
    content: {
      type: 'doc',
      content:
        data !== undefined
          ? convertToTiptap(
              Object.fromEntries(
                Object.keys(data).map((key) => [key, data[key]]),
              ),
            )
          : [],
    },
    onUpdate({ editor }) {
      const newValue = convertFromTiptap(editor.getJSON())
      handleChange(path, newValue.content)
    },
  })

  return (
    <Box padding="0.5rem" borderWidth={'1px'} borderColor="gray.300">
      <MenuBar editor={editor!} schema={rootSchema} />
      <EditorContent
        editor={editor}
        className="p-2 border focus:[&>.tiptap]:outline-offset-8"
        style={{ padding: '0.5rem', borderStyle: 'solid' }}
      />
    </Box>
  )
}

export default MainTiptapEditor
