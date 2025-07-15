import { Node } from "@tiptap/core";
import { Blockquote } from "@tiptap/extension-blockquote";
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
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableRow } from "@tiptap/extension-table-row";
import { Text } from "@tiptap/extension-text";
import { Underline } from "@tiptap/extension-underline";
import { generateJSON } from "@tiptap/html";
import * as jsdom from "jsdom";
import {
  Instagram,
  IsomerCard,
  IsomerCards,
  IsomerDetails,
  IsomerDetailsContent,
  IsomerDetailsGroup,
  IsomerDetailsSummary,
} from "./tiptap";
import {
  PLACEHOLDER_ALT_TEXT,
  PLACEHOLDER_CARD_LINK_TEXT,
  PLACEHOLDER_GOOGLE_SLIDES_TEXT,
  PLACEHOLDER_IMAGE_IN_TABLE_TEXT,
} from "./constants";

const { JSDOM } = jsdom;
const dom = new JSDOM(
  `<html>
      <div class="element"></div>
    </html>`
);
const window = dom.window;
const document = window.document;
global.document = document;
global.window = window as unknown as Window & typeof globalThis;

export const getIsHtmlContainingRedundantDivs = (html: string) => {
  const dom = new JSDOM(html);
  const subDoc = dom.window.document;
  const divs = Array.from(subDoc.querySelectorAll("div"));

  if (divs.length === 0) {
    return true;
  }

  return divs.some((div) => {
    // Check if the div is empty or contains only whitespace
    if (!div.hasChildNodes() || div.textContent?.trim() === "") {
      return true;
    }

    // Check if the div has no attributes
    if (div.attributes.length === 0) {
      return true;
    }

    // Check for specific attributes that might affect rendering
    const impactAttributes = [
      "style",
      "class",
      "onclick",
      "onmouseover",
      "onmouseout",
    ];

    for (let attr of div.attributes) {
      if (impactAttributes.includes(attr.name)) {
        return false;
      }
    }

    // If none of the checks above indicated an impact, the div is redundant
    return true;
  });
};

// Converts a Tiptap-based schema to an Isomer Next schema
// tiptapSchema: The schema object from Tiptap
const convertFromTiptap = (schema: any) => {
  // Iterate through all the items in the content key of the schema and group
  // them into a prose block. If a "type": "iframe" is found, do not add to the
  // current prose block, keep it separate and continue the process for the
  // remaining blocks
  const outputContent = [];

  let proseBlock = {
    type: "prose",
    content: [] as any[],
  };

  const updatedSchema = schema.flatMap((component: any) => {
    // Break out all the accordions
    if (component.type === "detailGroup") {
      const expandedAccordions = component.content.flatMap((detail: any) => {
        const detailSummary = detail.content.find(
          (block: any) => block.type === "detailsSummary"
        );
        const detailContent = detail.content.find(
          (block: any) => block.type === "detailsContent"
        );

        return [
          {
            type: "heading",
            attrs: {
              level: 3,
            },
            content: detailSummary.content || [
              {
                type: "text",
                text: "Missing heading from accordion",
              },
            ],
          },
          ...(detailContent.content || []),
        ];
      });

      return [...proseBlock.content, ...expandedAccordions];
    } else if (component.type === "details") {
      const detailSummary = component.content.find(
        (block: any) => block.type === "detailsSummary"
      );
      const detailContent = component.content.find(
        (block: any) => block.type === "detailsContent"
      );

      return [
        {
          type: "heading",
          attrs: {
            level: 3,
          },
          content: detailSummary.content || [
            {
              type: "text",
              text: "Missing heading from accordion",
            },
          ],
        },
        ...(detailContent.content || []),
      ];
    }

    return [component];
  });

  updatedSchema.forEach((component: any) => {
    if (component.type === "iframe") {
      outputContent.push(proseBlock);

      if (component.content) {
        const elem = document.createElement("div");
        elem.innerHTML = component.content;
        const iframe = elem.querySelector("iframe");
        const src = iframe?.getAttribute("src");
        const srcUrl = new URL(src || "");

        if (srcUrl.host.includes("youtube.com")) {
          const title = iframe?.getAttribute("title") || "YouTube video";

          outputContent.push({
            type: "video",
            title,
            url: src,
          });
        } else if (
          srcUrl.host.includes("google.com") &&
          srcUrl.pathname.startsWith("/maps")
        ) {
          const title = iframe?.getAttribute("title") || "Google Maps";

          outputContent.push({
            type: "map",
            title,
            url: src,
          });
        } else if (srcUrl.host.includes("docs.google.com")) {
          outputContent.push({
            type: "prose",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    marks: [
                      {
                        type: "link",
                        attrs: {
                          href: src,
                        },
                      },
                    ],
                    text: PLACEHOLDER_GOOGLE_SLIDES_TEXT,
                  },
                  {
                    type: "text",
                    text: ".",
                  },
                ],
              },
            ],
          });
        } else {
          // NOTE: We are not converting all types of iframe components, so this
          // will be flagged for manual review
          outputContent.push(component);
        }
      }

      proseBlock = {
        type: "prose",
        content: [],
      };
    } else if (component.type === "image") {
      outputContent.push(proseBlock);
      const { attrs, ...rest } = component;
      const { alt, src } = attrs;

      outputContent.push({
        src,
        alt: alt || PLACEHOLDER_ALT_TEXT,
        ...rest,
      });
      proseBlock = {
        type: "prose",
        content: [],
      };
    } else if (component.type === "blockquote") {
      proseBlock.content = [
        ...proseBlock.content,
        ...component.content
          .filter((block: any) => block.type === "paragraph")
          .map((block: any) => {
            // Ensure the paragraph block has marks italics
            return {
              ...block,
              content: block.content.map((text: any) => {
                return {
                  ...text,
                  marks: [
                    ...(text.marks || []),
                    {
                      type: "italic",
                    },
                  ],
                };
              }),
            };
          }),
      ];
    } else if (component.type === "infobar") {
      outputContent.push(proseBlock);
      const { attrs, ...rest } = component;
      outputContent.push({
        ...attrs,
        ...rest,
      });
      proseBlock = {
        type: "prose",
        content: [],
      };
    } else if (component.type === "contentpic") {
      outputContent.push(proseBlock);
      const { attrs, content, ...rest } = component;
      const { imageAlt, imageSrc } = attrs;

      outputContent.push({
        imageSrc,
        imageAlt,
        ...rest,
        content: {
          type: "prose",
          content,
        },
      });
      proseBlock = {
        type: "prose",
        content: [],
      };
    } else if (component.type === "isomercards") {
      outputContent.push(proseBlock);

      const { content: cards } = component;
      const newCards = cards
        .map((card: any) => {
          const {
            attrs: {
              imageSrc,
              imageAlt,
              title,
              description,
              linkText,
              linkHref,
            },
          } = card;

          return {
            title: title || "Card missing a title",
            description: description || undefined,
            url: linkHref || undefined,
            label: linkHref
              ? linkText || PLACEHOLDER_CARD_LINK_TEXT
              : undefined,
            imageUrl: imageSrc || undefined,
            imageAlt: imageSrc ? imageAlt || PLACEHOLDER_ALT_TEXT : undefined,
            imageFit: imageSrc ? "cover" : undefined,
          };
        })
        .filter((card: any) => card !== null);

      const isCardsWithImages = newCards.every(
        (card: any) => card.imageUrl !== undefined
      );

      const newCardBlock = {
        type: "infocards",
        title: "This is an title of the Infocards component",
        subtitle: "This is an optional subtitle for the Infocards component",
        variant: isCardsWithImages ? "cardsWithImages" : "cardsWithoutImages",
        maxColumns: "3",
        cards: newCards,
      };

      outputContent.push(newCardBlock);
      proseBlock = {
        type: "prose",
        content: [],
      };
    } else if (component.type === "instagram") {
      outputContent.push(proseBlock);
      const {
        attrs: { permalink },
      } = component;

      outputContent.push({
        type: "prose",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                marks: [
                  {
                    type: "link",
                    attrs: {
                      href: permalink,
                    },
                  },
                ],
                text: "View post on Instagram.",
              },
            ],
          },
        ],
      });
      proseBlock = {
        type: "prose",
        content: [],
      };
    } else if (component.type === "heading") {
      const updatedHeading = {
        type: "heading",
        attrs: {
          level: component.attrs.level,
        },
        content: component.content.map((text: any) => {
          return {
            ...text,
            marks: [],
          };
        }),
      };

      proseBlock.content.push(updatedHeading);
    } else if (
      component.type === "paragraph" &&
      component.content &&
      component.content.length === 1 &&
      component.content[0].type === "text" &&
      component.content[0].marks &&
      component.content[0].marks.some((mark: any) => mark.type === "link") &&
      (component.content[0].text.toLocaleLowerCase() ===
        "share your feedback" ||
        component.content[0].text.toLocaleLowerCase() === "share your views")
    ) {
      outputContent.push(proseBlock);

      outputContent.push({
        type: "infobar",
        title: "Have any thoughts and views on this?",
        buttonLabel: "Share your feedback",
        buttonUrl: component.content[0].marks[0].attrs.href,
      });

      proseBlock = {
        type: "prose",
        content: [],
      };
    } else if (component.type === "paragraph") {
      const { attrs, ...rest } = component;
      const newComponent = {
        ...rest,
      };

      if (
        attrs &&
        attrs.class &&
        attrs.class.length === 2 &&
        attrs.class[0] === "h"
      ) {
        proseBlock.content.push({
          type: "heading",
          attrs: {
            level: parseInt(attrs.class[1]),
          },
          content: newComponent.content,
        });
      } else {
        proseBlock.content.push(newComponent);
      }
    } else if (
      component.type === "orderedList" ||
      component.type === "unorderedList"
    ) {
      // Extract out all images in list items, and put different paragraphs in
      // the same list item to become two hard breaks
      let newListItems: any[] = [];

      component.content.forEach((listItem: any) => {
        let newListItemParagraphContent: any[] = [];
        listItem.content.forEach((listItemContent: any) => {
          if (listItemContent.type === "image") {
            if (newListItems.length > 0) {
              proseBlock.content.push({
                ...component,
                content: newListItems,
              });
              newListItems = [];
            }

            if (proseBlock.content.length > 0) {
              outputContent.push(proseBlock);
              proseBlock = {
                type: "prose",
                content: [],
              };
            }

            const { attrs, ...rest } = listItemContent;

            outputContent.push({
              ...rest,
              ...listItemContent.attrs,
              alt: listItemContent.attrs.alt || PLACEHOLDER_ALT_TEXT,
            });
          } else if (listItemContent.type === "paragraph") {
            if (newListItemParagraphContent.length > 0) {
              // Add two hard breaks to separate paragraphs
              newListItemParagraphContent.push({
                type: "hardBreak",
              });
              newListItemParagraphContent.push({
                type: "hardBreak",
              });
            }

            newListItemParagraphContent = newListItemParagraphContent.concat(
              listItemContent.content
            );
          }
        });

        if (newListItemParagraphContent.length > 0) {
          newListItems.push({
            type: "listItem",
            content: [
              {
                type: "paragraph",
                content: newListItemParagraphContent,
              },
            ],
          });

          newListItemParagraphContent = [];
        }
      });

      if (newListItems.length > 0) {
        proseBlock.content.push({
          ...component,
          content: newListItems,
        });

        newListItems = [];
      }
    } else {
      proseBlock.content.push(component);
    }
  });

  if (proseBlock.content.length > 0) {
    outputContent.push(proseBlock);
  }

  const finalContent: any[] = [];

  outputContent.forEach((block) => {
    if (block.type === "prose" && block.content.length > 0) {
      const newProseContent: any[] = [];
      block.content.forEach((component: any, index: any) => {
        if (
          component.type === "paragraph" &&
          component.content.length === 1 &&
          component.content[0].type === "hardBreak" &&
          index < block.content.length - 1 &&
          block.content[index + 1].type === "heading"
        ) {
          // Skip the hardBreak if it is followed by a heading
        } else if (
          component.type === "divider" &&
          index < block.content.length - 1 &&
          block.content[index + 1].type === "heading"
        ) {
          // Skip the divider if it is followed by a heading
        } else if (
          component.type === "heading" &&
          component.attrs.level === 4
        ) {
          newProseContent.push({
            ...component,
            attrs: {
              level: 2,
            },
          });
        } else {
          newProseContent.push(component);
        }
      });

      finalContent.push({
        ...block,
        content: newProseContent,
      });
    } else if (block.type === "prose" && block.content.length === 0) {
      // Skip empty prose blocks
    } else {
      finalContent.push(block);
    }
  });

  return finalContent;
};

// Performs some cleaning up of the Tiptap schema due to poor usage of HTML
const getCleanedSchema = (schema: any) => {
  // Recursively find components with "type": "table" and add a new key "caption"
  // then return the schema
  const findTable = (schema: any) => {
    schema.forEach((component: any) => {
      if (component.type === "table") {
        component.caption = "";

        // Remove any empty tableRow
        component.content = component.content.filter(
          (row: any) => row.content && row.content.length > 0
        );
      } else if (component.content) {
        findTable(component.content);
      }
    });

    return schema;
  };

  // Recursively find components with "type": "tableHeader" or "type": "tableCell"
  // and replace any images inside with a placeholder text, then return the schema
  const replaceTableImages = (schema: any) => {
    schema.forEach((component: any) => {
      if (component.type === "tableHeader" || component.type === "tableCell") {
        component.content = component.content.map((node: any) => {
          if (node.type === "image") {
            return {
              type: "paragraph",
              attrs: {
                dir: "ltr",
              },
              content: [
                {
                  text: `${PLACEHOLDER_IMAGE_IN_TABLE_TEXT} ${node.attrs.src}`,
                  type: "text",
                },
              ],
            };
          }

          return node;
        });
      } else if (component.content) {
        replaceTableImages(component.content);
      }
    });

    return schema;
  };

  // Recursively find components with "type": "hardBreak" and remove all other attributes
  // then return the schema
  const findHardBreak = (schema: any) => {
    schema.forEach((component: any) => {
      if (component.type === "hardBreak") {
        delete component.marks;
      } else if (component.content) {
        findHardBreak(component.content);
      }
    });

    return schema;
  };

  // Recursively find table components and ensure that the first row contains
  // cells that are of type tableHeader, then return the schema
  const findTableHeader = (schema: any) => {
    schema.forEach((component: any) => {
      if (component.type === "table") {
        const tableHeader = component.content[0].content;

        if (!tableHeader) {
          return;
        }

        tableHeader.forEach((cell: any) => {
          cell.type = "tableHeader";
        });
      } else if (component.content) {
        findTableHeader(component.content);
      }
    });

    return schema;
  };

  // Recursively find for double hard breaks in a paragraph node and remove them
  const findParagraphHardBreak = (schema: any) => {
    schema.forEach((component: any, index: number) => {
      if (component.type === "paragraph" && component.content) {
        const paragraph = component.content;
        const hardBreakIndex = paragraph.findIndex(
          (node: any, i: number) =>
            node.type === "hardBreak" && paragraph[i + 1]?.type === "hardBreak"
        );

        if (hardBreakIndex !== -1) {
          const firstParagraph = paragraph.slice(0, hardBreakIndex);
          const secondParagraph = paragraph.slice(hardBreakIndex + 2);

          schema[index].content = firstParagraph;
          schema.splice(index + 1, 0, {
            type: "paragraph",
            content: secondParagraph,
          });

          findParagraphHardBreak(schema);
        }
      } else if (component.content) {
        findParagraphHardBreak(component.content);
      }
    });

    return schema;
  };

  // Recursively find for "type": "paragraph" with no content key, then remove
  // the component from the schema
  const removeEmptyParagraphs = (schema: any) => {
    return schema.filter((component: any) => {
      if (
        (component.type === "paragraph" ||
          component.type === "heading" ||
          component.type === "tableHeader") &&
        (!component.content ||
          component.content.length === 0 ||
          component.content.every((c: any) => c.type === "hardBreak"))
      ) {
        return false;
      }

      if (component.content) {
        component.content = removeEmptyParagraphs(component.content);
      }

      return true;
    });
  };

  // Recursively find for "type": "iframe" and convert the attributes into the HTML string,
  // then put the HTML string into the "content" key. Also add the "title" key with an empty string.
  const findIframe = (schema: any) => {
    schema.forEach((component: any) => {
      if (component.type === "iframe") {
        const attributes = Object.entries(component.attrs).reduce(
          (acc, [key, value]) => {
            if (value === null) {
              return acc;
            }

            return `${acc} ${key}="${value}"`;
          },
          ""
        );

        delete component.attrs;
        component.content = `<iframe${attributes}></iframe>`;
        component.title = "";
      } else if (component.content) {
        findIframe(component.content);
      }
    });

    return schema;
  };

  // Recursively find for "type": "link" and keep only the relevant attributes
  // among all the existing attributes stored in the attrs key
  const findLink = (schema: any) => {
    schema.forEach((component: any) => {
      if (
        component.type === "text" &&
        component.marks &&
        component.marks.some((mark: any) => mark.type === "link")
      ) {
        const newMarks = component.marks.map((mark: any) => {
          // YT - Add file size
          if (mark.type === "link" && mark.attrs) {
            const newAttrs: any = {
              href: mark.attrs.href,
            };

            if (
              mark.attrs.target === "_blank" &&
              mark.attrs.href &&
              !mark.attrs.href.startsWith("/")
            ) {
              newAttrs.target = "_blank";
            }

            return {
              ...mark,
              attrs: newAttrs,
            };
          } else {
            return mark;
          }
        });

        component.marks = [...newMarks];
      } else if (component.content) {
        findLink(component.content);
      }
    });

    return schema;
  };

  return findIframe(
    findLink(
      removeEmptyParagraphs(
        findTableHeader(
          findHardBreak(findParagraphHardBreak(findTable(schema)))
        )
      )
    )
  );
};

/**
 * Move all chldren out of an element, and remove the element.
 */
const unwrap = (el: any) => {
  let parent = el.parentNode;

  // Move all children to the parent element.
  while (el.firstChild) parent.insertBefore(el.firstChild, el);

  // Remove the empty element.
  parent.removeChild(el);
};

/**
 * Move all chldren out of an anchor, and set a replacement text.
 */
const unwrapLink = (el: any, replacementText: string) => {
  let parent = el.parentNode;

  // Move all children to the parent element.
  while (el.firstChild) parent.insertBefore(el.firstChild, el);

  // Keep the anchor in the dom but since it's empty we'll
  // set a replacement text.
  el.textContent = replacementText;
};

/**
 * Wrap a dom node with another node.
 */
const wrap = (el: any, wrapper: any) => {
  el.parentNode!.insertBefore(wrapper, el);
  wrapper.appendChild(el);
};

const fixTipTapContent = (html: string) => {
  let container = document.createElement("div");
  container.innerHTML = html;

  let el;
  // Move all images out of anchors, and set replacement text for the anchors.
  while ((el = container.querySelector("a > img"))) {
    unwrapLink(el.parentNode!, el.getAttribute("alt") || "Image link");
  }

  // Move all images out of paragraphs.
  while ((el = container.querySelector("p > img"))) {
    unwrap(el.parentNode);
  }

  // Wrap all non-paragraph-wrapped anchors in paragraphs.
  while ((el = container.querySelector("a:not(p a)"))) {
    wrap(el, document.createElement("p"));
  }

  // Move youtube iframes out of paragraphs.
  while ((el = container.querySelector('p > iframe[src*="youtube.com"]'))) {
    unwrap(el.parentNode);
  }

  // Wrap youtube iframes in the proper tiptap-element.
  while (
    (el = container.querySelector(
      ':not([data-youtube-video]) > iframe[src*="youtube.com"]'
    ))
  ) {
    let wrapper = document.createElement("div");
    wrapper.dataset.youtubeVideo = "true";
    wrap(el, wrapper);
  }

  return container.innerHTML;
};

export const convertHtmlToSchema = async (html: string) => {
  const output = generateJSON(fixTipTapContent(html), [
    Blockquote.extend({
      content: "paragraph+",
    }),
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
    // Code,
    // CodeBlock,
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
    Link.extend({
      priority: 100,
      parseHTML() {
        return [{ tag: "a:not(.isomer-card)" }];
      },
    }),
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
    // Iframe
    Node.create({
      name: "iframe",
      group: "block",
      atom: true,
      draggable: true,
      defining: true,

      addOptions() {
        return {
          allowFullscreen: true,
        };
      },

      addAttributes() {
        return {
          src: {
            default: null,
          },
          title: {
            default: "",
          },
          frameborder: {
            default: 0,
          },
          allowfullscreen: {
            default: this.options.allowFullscreen,
            parseHTML: () => this.options.allowFullscreen,
          },
          width: {
            default: null,
          },
          height: {
            default: null,
          },
          style: {
            default: null,
          },
        };
      },

      parseHTML() {
        return [
          {
            tag: "iframe",
            priority: 10000,
          },
        ];
      },
    }),
    // Parsers for Isomer Classic specific components
    IsomerCards,
    IsomerCard,
    IsomerDetailsContent,
    IsomerDetailsSummary,
    IsomerDetails,
    IsomerDetailsGroup,
    Instagram,
  ]);

  const schema = getCleanedSchema(output.content);
  const result = convertFromTiptap(schema);
  return result;
};
