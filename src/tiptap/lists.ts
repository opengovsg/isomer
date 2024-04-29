import TiptapListItem from "@tiptap/extension-list-item"
import TiptapOrderedList from "@tiptap/extension-ordered-list"
import TiptapBulletList from "@tiptap/extension-bullet-list"

export const ListItem = TiptapListItem.extend({
  addOptions() {
    return {
      HTMLAttributes: {},
      bulletListTypeName: "unorderedlist",
      orderedListTypeName: "orderedlist",
    }
  },
})

export const OrderedList = TiptapOrderedList.extend({
  name: "orderedlist",
})

export const UnorderedList = TiptapBulletList.extend({
  name: "unorderedlist",
})
