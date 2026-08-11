import type { BoxProps } from "@chakra-ui/react"
import type { EditorContentProps, Editor as TiptapEditor } from "@tiptap/react"
import type { PropsWithChildren } from "react"
import type { EditorMenuBar } from "~/components/PageEditor/MenuBar/MenuBar"
import { Box, VStack } from "@chakra-ui/react"
import { EditorContent } from "@tiptap/react"
import { useMemo } from "react"
import { useOptionalEditorDrawerSiteId } from "~/contexts/EditorDrawerContext"
import {
  DEFAULT_BRAND_CANVAS_INVERSE_COLOR,
  TableBubbleMenu,
} from "~/features/editing-experience/components/TableBubbleMenu/TableBubbleMenu"
import { useSiteThemeCssVars } from "~/features/preview/hooks/useSiteThemeCssVars"

const EditorContainer = ({
  children,
  isNested,
}: PropsWithChildren<{ isNested?: boolean }>) => {
  const containerProps: Partial<BoxProps> = useMemo(() => {
    if (isNested) {
      return {
        height: "22.5rem",
        borderRadius: "4px",
        overflow: "hidden",
        border: "1px solid",
        borderColor: "base.divider.strong",
        _groupFocusWithin: {
          borderColor: "utility.focus-default",
          boxShadow: `0 0 0 1px #1361F0`,
        },
      }
    }
    return {}
  }, [isNested])

  return (
    <Box
      wordBreak="break-word"
      h="100%"
      transitionProperty="common"
      transitionDuration="normal"
      {...containerProps}
    >
      <VStack h="100%" w="100%" gap="0">
        {children}
      </VStack>
    </Box>
  )
}

const EditorContentWrapper = ({
  editor,
}: Pick<EditorContentProps, "editor">) => {
  return (
    <Box
      as={EditorContent}
      editor={editor}
      w="100%"
      p="1rem"
      flex="1 1 auto"
      overflowX="hidden"
      overflowY="auto"
      backgroundColor="white"
      onClick={() => editor?.chain().focus().run()}
      cursor="text"
    />
  )
}

const TableBubbleMenuThemed = ({
  editor,
  siteId,
}: {
  editor: TiptapEditor
  siteId: number
}) => {
  const themeCssVars = useSiteThemeCssVars({ siteId })
  const cssVars = themeCssVars as Record<string, string> | undefined
  const brandCanvasInverseColor =
    cssVars?.["--color-brand-canvas-inverse"] ??
    DEFAULT_BRAND_CANVAS_INVERSE_COLOR

  return (
    <TableBubbleMenu
      editor={editor}
      brandCanvasInverseColor={brandCanvasInverseColor}
    />
  )
}

interface EditorProps {
  menubar: EditorMenuBar
  editor: TiptapEditor
  isNested?: boolean
}

export const Editor = ({ editor, menubar, isNested }: EditorProps) => {
  const siteId = useOptionalEditorDrawerSiteId()
  const isTableEditor = editor.extensionManager.extensions.some(
    (ext) => ext.name === "table",
  )

  return (
    <EditorContainer isNested={isNested}>
      {menubar({ editor })}
      {isTableEditor &&
        (siteId !== undefined ? (
          <TableBubbleMenuThemed editor={editor} siteId={siteId} />
        ) : (
          <TableBubbleMenu editor={editor} />
        ))}
      <EditorContentWrapper editor={editor} />
    </EditorContainer>
  )
}
