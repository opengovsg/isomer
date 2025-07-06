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
import { Node } from "@tiptap/core";
import { JSDOM } from "jsdom";
import { Client } from "pg";
import * as dotenv from "dotenv";
import * as readLine from "readline";
import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import dayjs from "dayjs";

import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

const LOOK_DATES = [
  "Jan",
  "January",
  "Feb",
  "February",
  "Mar",
  "March",
  "Apr",
  "April",
  "May",
  "Jun",
  "June",
  "Jul",
  "July",
  "Aug",
  "August",
  "Sep",
  "Sept",
  "September",
  "Oct",
  "October",
  "Nov",
  "November",
  "Dec",
  "December",
];

const dom = new JSDOM(
  `<html>
      <div class="element"></div>
    </html>`
);
const window = dom.window;
const document = window.document;
global.document = document;
// @ts-ignore
global.window = window;

dotenv.config();

const prompt = async () => {
  // Create an interface for input and output
  const rl = readLine.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Ask the user for confirmation
  return await new Promise<boolean>((resolve) => {
    rl.question("Do you want to proceed? (y/N) ", (answer) => {
      // Convert the answer to lowercase
      answer = answer.toLowerCase();
      let proceed = false;

      // Check if the user confirmed
      if (answer === "a" || answer === "y" || answer === "yes") {
        proceed = true;
        // Add the code to proceed with the operation here
      }

      // Close the readline interface
      rl.close();

      resolve(proceed);
    });
  });
};

const convertHtmlToSchema = (html: string) =>
  generateJSON(html, [
    // Blockquote,
    Bold,
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
      marks: "",
    }),
    History,
    HorizontalRule.extend({
      name: "divider",
    }),
    Image,
    Italic,
    Link.extend({
      addAttributes() {
        return {
          href: {
            default: null,
            parseHTML(element) {
              return element.getAttribute("href");
            },
          },
        };
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
    Paragraph,
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
          },
        ];
      },
    }),
  ]);

const recurseToTextContent = (node: Record<string, any>) => {
  if (node.type === "text" && node.text) {
    if (node.text.includes("<iframe ")) {
      console.log("Found iframe", node.text);
    }

    if (node.text.includes("<br") || node.text.includes("</br")) {
      // console.log("Found hard break", node.text);
      node.text = node.text.replace(/<\/br>/gi, "<br />");
    }

    if (!node.text.includes("<") && !node.text.includes(">")) {
      return [node];
    }

    const result = convertHtmlToSchema(node.text).content[0].content;
    const resultWithMarks = result.map((r: Record<string, any>) => {
      if (r.marks && node.marks) {
        return {
          ...r,
          marks: [...r.marks, ...node.marks],
        };
      } else if (node.marks) {
        return {
          ...r,
          marks: node.marks,
        };
      }

      return r;
    });

    return resultWithMarks;
  }

  if (node.type === "callout" || node.type === "contentpic") {
    return [
      {
        ...node,
        content: {
          ...node.content,
          content: node.content.content.flatMap(recurseToTextContent),
        },
      },
    ];
  }

  if (node.type === "accordion") {
    return [
      {
        ...node,
        details: {
          ...node.details,
          content: node.details.content.flatMap(recurseToTextContent),
        },
      },
    ];
  }

  if (!node.content || node.type === "iframe") {
    return [node];
  }

  return [
    {
      ...node,
      content: node.content.flatMap(recurseToTextContent),
    },
  ];
};

// This is for updating contents after they have been imported into the database
const main = async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();

    const allBlobs = await client.query(`SELECT * FROM public."Blob"`);

    // console.log(
    //   convertHtmlToSchema(
    //     "Ministry of Health, Singapore</br>16 College Road</br>College of Medicine Building</br>Singapore 169854"
    //   ).content[0].content
    // );

    for (const blob of allBlobs.rows) {
      console.log("Blob ID", blob.id);
      const html = blob.content;
      const schema = {
        ...html,
      };
      // const schema = {
      //   ...html,
      //   content: html.content.flatMap(recurseToTextContent),
      // };

      if (schema.layout === "link" && schema.page.date) {
        const { date, ...rest } = schema.page;
        if (!LOOK_DATES.some((lookDate) => date.includes(lookDate))) {
          continue;
        }

        console.log("Found date", date);
        const newDate = dayjs(date).format("DD/MM/YYYY");
        console.log("New date", newDate);

        if (newDate === "Invalid date") {
          await prompt();
        }

        schema.page = {
          ...rest,
          date: newDate,
        };
      }

      if (JSON.stringify(schema) === JSON.stringify(html)) {
        continue;
      }

      // spawn("pbcopy", []).stdin.end(JSON.stringify(html, null, 2));

      // await prompt();

      // spawn("pbcopy", []).stdin.end(JSON.stringify(schema, null, 2));

      const isConfirmed = true || (await prompt());

      if (!isConfirmed) {
        console.log("Skipping blob ID", blob.id);
        continue;
      }

      console.log("Converting blob ID", blob.id);

      await client.query(
        `UPDATE public."Blob" SET content = $1 WHERE id = $2`,
        [JSON.stringify(schema), blob.id]
      );
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
};

// This is for updating GitHub repos
// const main = async () => {
//   const REPO = "moh-healthwatch-next";
//   process.chdir(REPO);

//   const allFiles = fs
//     .readdirSync("schema", { withFileTypes: true, recursive: true })
//     .filter((dirent) => dirent.isFile() && dirent.name.endsWith(".json"));

//   for (const jsonFile of allFiles) {
//     const filePath = path.join(jsonFile.path, jsonFile.name);
//     // console.log("Processing file", filePath);

//     try {
//       const html = JSON.parse(fs.readFileSync(filePath, "utf-8"));
//       const schema = {
//         ...html,
//         content: html.content.flatMap(recurseToTextContent),
//       };

//       if (
//         schema.layout === "article" &&
//         schema.page?.contentPageHeader?.summary !== undefined &&
//         schema.page?.contentPageHeader?.summary.length > 0
//       ) {
//         const { contentPageHeader, ...rest } = schema.page;
//         schema.page = {
//           ...rest,
//           articlePageHeader: {
//             summary: contentPageHeader.summary,
//           },
//         };
//       }

//       if (
//         schema.page?.articlePageHeader?.summary &&
//         Array.isArray(schema.page.articlePageHeader.summary)
//       ) {
//         schema.page.articlePageHeader.summary =
//           schema.page.articlePageHeader.summary.join(" ");
//       }

//       if (JSON.stringify(schema) === JSON.stringify(html)) {
//         continue;
//       }

//       // Save the updated schema to the file
//       fs.writeFileSync(filePath, JSON.stringify(schema, null, 2));
//     } catch (err) {
//       console.log("Error processing file", filePath);
//       console.error(err);
//     }
//   }
// };

main();
