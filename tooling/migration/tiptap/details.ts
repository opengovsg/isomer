import { Node } from "@tiptap/core";
import { mergeAttributes } from "@tiptap/react";

export const IsomerDetailsContent = Node.create({
  name: "detailsContent",
  content: "block+",
  defining: true,
  selectable: false,
  addOptions: () => ({ HTMLAttributes: {} }),
  parseHTML() {
    return [{ tag: `div[data-type="${this.name}"]` }];
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
  addOptions: () => ({ HTMLAttributes: {} }),
  parseHTML: () => [{ tag: "summary" }],
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
  parseHTML: () => [{ tag: "details" }],
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
  HTMLAttributes: {
    [key: string]: string;
  };
}

export const IsomerDetailsGroup = Node.create<IsomerDetailGroupOptions>({
  name: "detailGroup",
  group: "block",
  atom: true,
  draggable: true,
  content: "details+",
  definingForContext: true,
  isolating: true,
  allowGapCursor: false,

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
    return [{ tag: `div.isomer-accordion` }];
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
