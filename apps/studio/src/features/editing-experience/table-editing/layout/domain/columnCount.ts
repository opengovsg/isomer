import type { Node as ProseMirrorNode } from "@tiptap/pm/model"
import { TableMap } from "@tiptap/pm/tables"

export const getColumnCount = (node: ProseMirrorNode): number =>
  node.firstChild ? TableMap.get(node).width : 0
