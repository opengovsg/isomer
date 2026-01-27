import { Node } from "@tiptap/core";
import { mergeAttributes } from "@tiptap/react";

export const IsomerDetailsContent = Node.create({
  name: "detailsContent",
  content: "block+",
  defining: true,
  selectable: false,

  addOptions: () => ({ HTMLAttributes: {} }),
  parseHTML() {
    return [{ tag: `div[data-type="${this.name}"]` }, { tag: `div` }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(
        { HTMLAttributes: "isomer-details-content" },
        HTMLAttributes,
        {
          "data-type": this.name,
        }
      ),
      0,
    ];
  },
});

export const IsomerDetailsSummary = Node.create({
  name: "detailsSummary",
  content: "text*",
  defining: true,
  selectable: false,
  isolating: true,
  priority: 200,

  addOptions: () => ({ HTMLAttributes: {} }),
  parseHTML: () => [{ tag: "summary" }, { tag: "label[for]" }],
  renderHTML({ HTMLAttributes }) {
    return [
      "summary",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ];
  },
});

export const IsomerDetails = Node.create({
  name: "details",
  content: "detailsSummary detailsContent",
  group: "block",
  defining: true,
  isolating: true,
  allowGapCursor: false,
  priority: 200,

  addAttributes() {
    return this.options.persist
      ? {
          open: {
            default: false,
            parseHTML: (t) => t.hasAttribute("open"),
            renderHTML: ({ open }) => (open ? { open: "" } : {}),
          },
        }
      : [];
  },

  parseHTML: () => [{ tag: "details" }, { tag: "li:has(> label)" }],
  renderHTML({ HTMLAttributes }) {
    return [
      "details",
      mergeAttributes({ HTMLAttributes: "isomer-details" }, HTMLAttributes),
      0,
    ];
  },
});

export interface IsomerDetailGroupOptions {
  allowFullscreen: boolean;
  HTMLAttributes: Record<string, string>;
}

export const IsomerDetailsGroup = Node.create<IsomerDetailGroupOptions>({
  name: "detailGroup",
  group: "block",
  atom: true,
  draggable: true,
  content: "details+",
  isolating: true,
  allowGapCursor: false,
  priority: 200,

  addAttributes() {
    return {
      backgroundColor: {
        default: "white",
      },
      class: {
        default: "isomer-accordion",
      },
      "data-type": {
        default: "details",
      },
    };
  },

  parseHTML() {
    return [
      { tag: "div.isomer-accordion" },
      { tag: "ul.jekyllcodex_accordion" },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const variant =
      node.attrs.backgroundColor === "gray"
        ? "isomer-accordion-gray"
        : "isomer-accordion-white";

    delete HTMLAttributes.backgroundColor;
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": this.name,
        class: `isomer-accordion ${variant}`,
      }),
      0,
    ];
  },
});
