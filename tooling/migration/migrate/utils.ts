import { generateJSON } from "@tiptap/html";
import path from "path";
import { mkdir } from "fs/promises";
import { Readable } from "stream";
import { finished } from "stream/promises";
import { Image } from "@tiptap/extension-image";
import { AnyExtension, Extensions, Node as TiptapNode } from "@tiptap/core";
import { TableRow } from "@tiptap/extension-table-row";
import fs from "fs";
import {
  FILES_PATH_PREFIX,
  IMAGES_PATH_PREFIX,
  SITE_BASE_URL,
} from "./constants";
import {
  ProseProps,
  HeadingProps,
  ProseContent,
} from "@opengovsg/isomer-components";
import {
  BASE_EXTENSIONS,
  IsomerHeading,
  IsomerTable,
  IsomerTableCell,
  IsomerTableHeader,
} from "~editor/constants";

import { JSDOM } from "jsdom";

const dom = new JSDOM(
  `<html>
      <div class="element"></div>
    </html>`,
);
const window = dom.window;
const document = window.document;
global.document = document;
global.window = window as any;

let PERMALINK = "";
const IMAGE_DOWNLOADS: Record<string, string> = {};
const FILE_DOWNLOADS: Record<string, string> = {};

export const fixTipTapContent = (html: string) => {
  let container = document.createElement("div");
  container.innerHTML = html;

  let el;
  // Move all images out of anchors, and set replacement text for the anchors.
  while ((el = container.querySelector("a > img"))) {
    if (el.parentNode)
      unwrapLink(el.parentNode, el.getAttribute("alt") || "Image link");
  }

  // Move all images out of paragraphs.
  while ((el = container.querySelector("p > img"))) {
    if (el.parentNode) unwrap(el.parentNode);
  }

  // Wrap all non-paragraph-wrapped anchors in paragraphs.
  while ((el = container.querySelector("a:not(p a)"))) {
    wrap(el, document.createElement("p"));
  }

  // Move youtube iframes out of paragraphs.
  while ((el = container.querySelector('p > iframe[src*="youtube.com"]'))) {
    if (el.parentNode) unwrap(el.parentNode);
  }

  // Wrap youtube iframes in the proper tiptap-element.
  while (
    (el = container.querySelector(
      ':not([data-youtube-video]) > iframe[src*="youtube.com"]',
    ))
  ) {
    let wrapper = document.createElement("div");
    wrapper.dataset.youtubeVideo = "true";
    wrap(el, wrapper);
  }

  return container.innerHTML;
};

/**
 * Wrap a dom node with another node.
 */
const wrap = (el: Node, wrapper: Node) => {
  el.parentNode?.insertBefore(wrapper, el);
  wrapper.appendChild(el);
};

/**
 * Move all chldren out of an element, and remove the element.
 */
const unwrap = (el: Node) => {
  let parent = el.parentNode;

  // Move all children to the parent element.
  while (el.firstChild) parent?.insertBefore(el.firstChild, el);

  // Remove the empty element.
  parent?.removeChild(el);
};

/**
 * Move all chldren out of an anchor, and set a replacement text.
 */
const unwrapLink = (el: Node, replacementText: string) => {
  let parent = el.parentNode;

  // Move all children to the parent element.
  while (el.firstChild) parent?.insertBefore(el.firstChild, el);

  // Keep the anchor in the dom but since it's empty we'll
  // set a replacement text.
  el.textContent = replacementText;
};

export const convertHtmlToSchema = async (html: string, permalink: string) => {
  PERMALINK = permalink;
  const output = generateJSON(fixTipTapContent(html), [
    ...(BASE_EXTENSIONS as Extensions),
    Image,
    TableRow as AnyExtension,
    IsomerTable as AnyExtension,
    IsomerTableCell as AnyExtension,
    IsomerTableHeader as AnyExtension,
    IsomerHeading as AnyExtension,
    TiptapNode.create({
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
  ]);

  const schema = getCleanedSchema(output.content);
  const result = convertFromTiptap(schema);

  // Download all images
  // await Promise.all(
  //   Object.keys(IMAGE_DOWNLOADS).map((url) => {
  //     // NOTE: Guaranteed to exist since we map over the keys of the object
  //     const fileName = IMAGE_DOWNLOADS[url]!.split("/").pop();
  //     const path = url.replace(SITE_BASE_URL, "");
  //
  //     if (!path.startsWith("/")) {
  //       return;
  //     }
  //
  //     return downloadFile(`${SITE_BASE_URL}${path}`, "images", fileName!);
  //   }),
  // );

  console.log(FILE_DOWNLOADS);

  // Download all files
  // await Promise.all(
  //   Object.keys(FILE_DOWNLOADS).map((url) => {
  //     const fileName = FILE_DOWNLOADS[url]?.split("/").pop();
  //     const path = url.replace(SITE_BASE_URL, "");
  //
  //     if (!path.startsWith("/")) {
  //       console.log("Invalid file path:", path);
  //       return;
  //     }
  //
  //     return downloadFile(`${SITE_BASE_URL}${path}`, "files", fileName!);
  //   }),
  // );

  const filesMapping = {
    ...IMAGE_DOWNLOADS,
    ...FILE_DOWNLOADS,
  };

  console.log(filesMapping);

  return result;
};

type FindFunction = (schema: Record<string, any>[]) => Record<string, any>[];

const getCleanedSchema = (schema: Record<string, any>[]) => {
  // Recursively find components with "type": "table" and add a new key "caption"
  // then return the schema
  const findTable: FindFunction = (schema) => {
    schema.forEach((component) => {
      if (component.type === "table") {
        component.caption = "";
      } else if (component.content) {
        findTable(component.content);
      }
    });

    return schema;
  };

  // Recursively find components with "type": "hardBreak" and remove all other attributes
  // then return the schema
  const findHardBreak: FindFunction = (schema) => {
    schema.forEach((component: Record<string, any>) => {
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
  const findTableHeader: FindFunction = (schema) => {
    schema.forEach((component: Record<string, any>) => {
      if (component.type === "table") {
        const tableHeader = component.content[0].content;

        if (!tableHeader) {
          return;
        }

        tableHeader.forEach((cell: Record<string, any>) => {
          cell.type = "tableHeader";
        });
      } else if (component.content) {
        findTableHeader(component.content);
      }
    });

    return schema;
  };

  // Recursively find for double hard breaks in a paragraph node and remove them
  const findParagraphHardBreak: FindFunction = (schema) => {
    schema.forEach((component: Record<string, any>, index) => {
      if (component.type === "paragraph" && component.content) {
        const paragraph: Record<string, any>[] = component.content;
        const hardBreakIndex = paragraph.findIndex(
          (node, i) =>
            node.type === "hardBreak" && paragraph[i + 1]?.type === "hardBreak",
        );

        if (hardBreakIndex !== -1) {
          const firstParagraph = paragraph.slice(0, hardBreakIndex);
          const secondParagraph = paragraph.slice(hardBreakIndex + 2);

          // FIXME: double check this type assertion
          schema[index]!.content = firstParagraph;
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
  const removeEmptyParagraphs: FindFunction = (schema) => {
    return schema.filter((component) => {
      if (
        (component.type === "paragraph" ||
          component.type === "heading" ||
          component.type === "tableHeader") &&
        (!component.content ||
          component.content.length === 0 ||
          component.content.every(
            (c: Record<string, any>) => c.type === "hardBreak",
          ))
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
  const findIframe: FindFunction = (schema) => {
    schema.forEach((component) => {
      if (component.type === "iframe") {
        const attributes = Object.entries(component.attrs).reduce(
          (acc, [key, value]) => {
            if (value === null) {
              return acc;
            }

            return `${acc} ${key}="${value}"`;
          },
          "",
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
  const findLink: FindFunction = (schema) => {
    schema.forEach((component) => {
      if (
        component.type === "text" &&
        component.marks &&
        component.marks.some(
          (mark: Record<string, any>) => mark.type === "link",
        )
      ) {
        const newMarks = component.marks.map((mark: Record<string, any>) => {
          if (mark.type === "link" && mark.attrs) {
            const newAttrs: { href: string; target?: string } = {
              href: mark.attrs.href,
            };

            if (mark.attrs.href.startsWith("/docs")) {
              const fileName = mark.attrs.href.split("?")[0].split("/").pop();
              const newHref = `${FILES_PATH_PREFIX}/${PERMALINK}/${fileName}`;

              if (Object.keys(FILE_DOWNLOADS).includes(mark.attrs.href)) {
                // console.log("File already downloaded:", mark.attrs.href);
              }

              FILE_DOWNLOADS[mark.attrs.href] = newHref;
              console.log(FILE_DOWNLOADS);
              downloadFile(
                `${SITE_BASE_URL}${mark.attrs.href.replace(SITE_BASE_URL, "")}`,
                "files",
                fileName,
              );
              newAttrs.href = newHref;
            }

            if (
              mark.attrs.target === "_blank" &&
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
          findHardBreak(findParagraphHardBreak(findTable(schema))),
        ),
      ),
    ),
  );
};

const convertFromTiptap = (
  schema: Record<string, any>,
  headerBlock?: Record<string, any>,
) => {
  // Iterate through all the items in the content key of the schema and group
  // them into a prose block. If a "type": "iframe" is found, do not add to the
  // current prose block, keep it separate and continue the process for the
  // remaining blocks
  const outputContent = [];

  if (!!headerBlock) {
    outputContent.push(headerBlock);
  }

  let proseBlock: Pick<ProseProps, "type" | "content"> = {
    type: "prose",
    content: [],
  };

  schema.forEach(
    (component: {
      [x: string]: any;
      type?: any;
      content?: any;
      attrs?: any;
    }) => {
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
          } else {
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

        if (alt?.length > 120) {
          console.log("Image alt text is too long:", alt);
          console.log("Image source:", src);
        }

        const fileName = src.split("?")[0].split("/").pop();
        const newSrc = `${IMAGES_PATH_PREFIX}/${PERMALINK}/${fileName}`;
        if (Object.keys(IMAGE_DOWNLOADS).includes(src)) {
          console.log("Image already downloaded:", src);
        }

        IMAGE_DOWNLOADS[src] = newSrc;

        outputContent.push({
          src: newSrc,
          alt,
          ...rest,
        });
        proseBlock = {
          type: "prose",
          content: [],
        };
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
        // console.log(JSON.stringify(component));
        const { attrs, content, ...rest } = component;
        const { imageAlt, imageSrc } = attrs;

        if (!imageAlt) {
          console.log(
            "Contentpic image alt text is missing:",
            JSON.stringify(component),
          );
        } else if (imageAlt.length > 120) {
          console.log("Contentpic image alt text is too long:", imageAlt);
          console.log("Contentpic image source:", imageSrc);
        }

        const fileName = imageSrc.split("?")[0].split("/").pop();
        const newSrc = `${IMAGES_PATH_PREFIX}/${PERMALINK}/${fileName}`;
        if (Object.keys(IMAGE_DOWNLOADS).includes(imageSrc)) {
          console.log("Image already downloaded:", imageSrc);
        }

        IMAGE_DOWNLOADS[imageSrc] = newSrc;
        // const newContent = content
        //   .filter((c) => c.type !== "image")
        //   .map((c) => {
        //     if (c.type === "paragraph") {
        //       const { attrs, ...rest } = c;
        //       return {
        //         ...rest,
        //       };
        //     }

        //     if (c.type === "contentpic") {
        //       return c.content[0];
        //     }

        //     return c;
        //   });

        // outputContent.push({
        //   type: "prose",
        //   content: [
        //     {
        //       type: "heading",
        //       attrs: {
        //         level: 2,
        //       },
        //       content: newContent[1].content
        //         .filter((c) => c.type !== "hardBreak")
        //         .map((c) => {
        //           const { marks, ...rest } = c;
        //           return {
        //             ...rest,
        //           };
        //         }),
        //     },
        //   ],
        // });

        outputContent.push({
          imageSrc: newSrc,
          imageAlt,
          ...rest,
          content: {
            type: "prose",
            // content: [...newContent.slice(2), newContent[0]],
            content,
          },
        });
        proseBlock = {
          type: "prose",
          content: [],
        };
      } else if (
        component.type === "paragraph" &&
        component.content &&
        component.content.length === 1 &&
        component.content[0].type === "text" &&
        component.content[0].marks &&
        component.content[0].marks.some(
          (mark: Record<string, any>) => mark.type === "link",
        ) &&
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

        if (!proseBlock.content) {
          proseBlock.content = [];
        }

        if (
          attrs &&
          attrs.class &&
          attrs.class.length === 2 &&
          attrs.class[0] === "h"
        ) {
          proseBlock.content.push({
            type: "heading",
            attrs: {
              level: parseInt(attrs.class[1]) as HeadingProps["attrs"]["level"],
            },
            content: newComponent.content,
          });
        } else {
          // FIXME: fix this usage of any
          proseBlock.content.push(newComponent as any);
        }
      } else {
        // FIXME: fix this usage of any
        proseBlock.content!.push(component as any);
      }
    },
  );

  if (!!proseBlock.content && proseBlock.content.length > 0) {
    outputContent.push(proseBlock);
  }

  // FIXME: fix this usage of any
  const finalContent: any[] = [];

  outputContent.forEach((block) => {
    if (block.type === "prose" && block.content.length > 0) {
      const newProseContent: ProseContent = [];
      block.content.forEach((component: Record<string, any>, index: number) => {
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
            ...(component as HeadingProps),
            attrs: {
              level: 2,
            },
          });
        } else {
          // FIXME: fix this usage of any
          newProseContent.push(component as any);
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

const downloadFile = async (url: string, type: string, fileName: string) => {
  console.log("Downloading file:", url);
  const res = await fetchWithRetry(url);
  const destination = path.resolve("./downloads", type, PERMALINK, fileName);
  const folder = path.dirname(destination);
  if (!fs.existsSync(folder)) await mkdir(folder, { recursive: true });
  try {
    const fileStream = fs.createWriteStream(destination, { flags: "wx" });
    if (res.body)
      await finished(
        // TODO: Fix this - see comment on `fetchWithRetry`
        Readable.fromWeb(res.body as unknown as any).pipe(fileStream),
      );
  } catch (err: any) {
    if (err.code === "EEXIST") {
      // console.log("File already exists:", destination);
    } else {
      console.error(err);
    }
  }
};

// TODO: this is using a dom api to fetch but using a node api to write to disk
// we should refactor this to use `http.get`
const fetchWithRetry = async (url: string) => {
  while (true) {
    const res = await fetch(url);
    if (res.status === 403) {
      console.error("We are getting rate limited!");
      await new Promise((resolve) => setTimeout(resolve, 5000));
    } else {
      return res;
    }
  }
};
