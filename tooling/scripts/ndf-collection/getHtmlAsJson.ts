import { Bold } from "@tiptap/extension-bold";
import { BulletList } from "@tiptap/extension-bullet-list";
import { Document } from "@tiptap/extension-document";
import { Dropcursor } from "@tiptap/extension-dropcursor";
import { Gapcursor } from "@tiptap/extension-gapcursor";
import { HardBreak } from "@tiptap/extension-hard-break";
import { Heading } from "@tiptap/extension-heading";
import { History } from "@tiptap/extension-history";
import { HorizontalRule } from "@tiptap/extension-horizontal-rule";
import { Image } from "@tiptap/extension-image";
import { Italic } from "@tiptap/extension-italic";
import { Link } from "@tiptap/extension-link";
import { ListItem } from "@tiptap/extension-list-item";
import { OrderedList } from "@tiptap/extension-ordered-list";
import { Paragraph } from "@tiptap/extension-paragraph";
import { Strike } from "@tiptap/extension-strike";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Text } from "@tiptap/extension-text";
import { Underline } from "@tiptap/extension-underline";
import { generateJSON } from "@tiptap/html";
import jsdom from "jsdom";
import { extractImagesFromLists } from "./utils";

const { JSDOM } = jsdom;
const dom = new JSDOM(
  `<html>
      <div class="element"></div>
    </html>`
);
const window = dom.window;
const document = window.document;
global.document = document;
global.window = window as any;

export const getHtmlAsJson = (html: string) => {
  const initialSchema = generateJSON(html, [
    Bold.extend({
      parseHTML() {
        return [
          {
            tag: "strong",
          },
          {
            tag: "dt",
          },
          {
            tag: "b",
            getAttrs: (node) => node.style.fontWeight !== "normal" && null,
          },
          {
            style: "font-weight=400",
            clearMark: (mark) => mark.type.name === this.name,
          },
          {
            style: "font-weight",
            getAttrs: (value) =>
              /^(bold(er)?|[5-9]\d{2,})$/.test(value) && null,
          },
        ];
      },
    }),
    BulletList.extend({
      name: "unorderedList",
    }).configure({
      HTMLAttributes: {
        class: "list-disc",
      },
    }),
    Document,
    Dropcursor,
    Gapcursor,
    HardBreak,
    Heading.extend({
      content: "text*",
      marks: "",
    }).configure({
      levels: [2, 3, 4, 5],
    }),
    History,
    HorizontalRule.extend({
      name: "divider",
    }),
    Image,
    Italic,
    Link,
    ListItem,
    OrderedList.extend({
      name: "orderedList",
    }).configure({
      HTMLAttributes: {
        class: "list-decimal",
      },
    }),
    Paragraph.extend({
      addAttributes() {
        return {
          class: {
            default: undefined,
          },
        };
      },
      parseHTML() {
        return [{ tag: "p" }, { tag: "dd" }];
      },
    }),
    Strike,
    Superscript,
    Subscript,
    Table.extend({
      addAttributes() {
        return {
          caption: {
            default: "Table caption",
          },
        };
      },
    }).configure({
      resizable: false,
    }),
    TableRow,
    TableHeader.extend({
      content: "paragraph+",
    }),
    TableCell,
    Text,
    Underline.extend({
      parseHTML() {
        return [
          {
            tag: "u",
          },
          {
            style: "text-decoration",
            consuming: false,
            getAttrs: (style) => (style.includes("underline") ? {} : false),
          },
          {
            tag: 'span[style*="text-decoration: underline"]',
            consuming: false,
          },
        ];
      },
    }),
  ]);

  const validSchemaContent = [];
  let holdingProseContent: any[] = [];

  for (const component of initialSchema.content) {
    if (component.type === "image") {
      if (holdingProseContent.length > 0) {
        validSchemaContent.push({
          type: "prose",
          content: holdingProseContent,
        });
        holdingProseContent = [];
      }

      validSchemaContent.push({
        type: "image",
        src: component.attrs.src.split("?")[0].split("/").pop(),
        alt: component.attrs.alt,
      });
    } else if (
      component.type === "orderedList" ||
      component.type === "unorderedList"
    ) {
      // Extract out all images in list items
      const newContentItems = extractImagesFromLists(component);

      for (const item of newContentItems) {
        if (item.type === "image") {
          if (holdingProseContent.length > 0) {
            validSchemaContent.push({
              type: "prose",
              content: holdingProseContent,
            });
            holdingProseContent = [];
          }

          validSchemaContent.push(item);
        } else {
          holdingProseContent.push(item);
        }
      }
    } else {
      holdingProseContent.push(component);
    }
  }

  if (holdingProseContent.length > 0) {
    validSchemaContent.push({
      type: "prose",
      content: holdingProseContent,
    });
  }

  initialSchema.content = validSchemaContent.map((component) => {
    if (component.type === "image") {
      return {
        ...component,
        src: `/images/product-info/${component.src}`,
      };
    } else {
      return component;
    }
  });
  return initialSchema;
};
