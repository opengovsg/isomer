import TiptapTable from "@tiptap/extension-table";

export const Table = TiptapTable.extend({
  draggable: true,
  addNodeView() {
    return () => {
      const dom = document.createElement("div");
      const contentDOM = document.createElement("table");

      // NOTE: Append to `dom` as this should not be editable.
      const dragWrapper = document.createElement("div");
      const blockWrapper = document.createElement("div");
      blockWrapper.setAttribute("data-group", "true");
      blockWrapper.className = "table-block-wrapper";

      const borderWrapper = document.createElement("div");
      borderWrapper.className = "table-block-border";
      const dragHandle = document.createElement("div");
      dragHandle.className = "drag-handle";
      dragHandle.draggable = true;
      dragHandle.contentEditable = "false";
      dragHandle.setAttribute("data-drag-handle", "");

      dom.appendChild(dragWrapper);
      dragWrapper.appendChild(blockWrapper);
      blockWrapper.appendChild(borderWrapper);
      blockWrapper.appendChild(dragHandle);
      borderWrapper.append(contentDOM);
      contentDOM.appendChild(document.createElement("tbody"));

      return { dom, contentDOM };
    };
  },
}).configure({
  allowTableNodeSelection: true,
});
