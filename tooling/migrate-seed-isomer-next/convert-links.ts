import * as dotenv from "dotenv";
import * as fs from "fs";
import { JSDOM } from "jsdom";
import * as path from "path";
import * as readLine from "readline";
import * as cheerio from "cheerio";
import { Client } from "pg";
import { randomUUID } from "crypto";
import { Readable } from "stream";
import { finished } from "stream/promises";
import { spawn } from "child_process";

const dom = new JSDOM(
  `<html>
      <div class="element"></div>
    </html>`,
);
const window = dom.window;
const document = window.document;
global.document = document;
// @ts-ignore
global.window = window;

dotenv.config();

const LINKS: Record<string, string> = {};
const RECORD: Record<string, string> = {};
const UUID_RECORDS: Record<string, string> = {};
const REPORT: string[] = [];
let COUNTER = 0;

const NEW_TO_OLD_PATHS: Record<string, string> = {};

const downloadFile = async (url: string, uuid: string, fileName: string) => {
  const res = await fetch(url);
  // Create UUID folder
  fs.mkdirSync(path.join("/Users/zhongjun/Downloads/moh", uuid), {
    recursive: true,
  });
  const destination = path.join(
    "/Users/zhongjun/Downloads/moh",
    `${uuid}/${fileName}`,
  );
  const fileStream = fs.createWriteStream(destination, { flags: "wx" });
  // @ts-ignore
  await finished(Readable.fromWeb(res.body).pipe(fileStream));
};

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

const recurseToTextContent = (node: Record<string, any>) => {
  // if (
  //   node.type === "text" &&
  //   node.text &&
  //   node.marks &&
  //   node.marks.length > 0 &&
  //   node.marks.some(
  //     (mark: Record<string, any>) =>
  //       mark.type === "link" &&
  //       mark.attrs &&
  //       mark.attrs.href.startsWith("[documents|")
  //   )
  // ) {
  //   const linkMark = node.marks.find(
  //     (mark: Record<string, any>) =>
  //       mark.type === "link" &&
  //       mark.attrs &&
  //       mark.attrs.href.startsWith("[documents|")
  //   );

  //   if (!Object.keys(LINKS).includes(linkMark.attrs.href)) {
  //     console.log("Link not found", linkMark.attrs.href);
  //     return node;
  //   }

  //   REPORT.push(linkMark.attrs.href);
  //   linkMark.attrs.href = LINKS[linkMark.attrs.href];

  //   return node;
  // }

  // if (
  //   node.type === "image" &&
  //   node.attrs &&
  //   node.attrs.src &&
  //   node.attrs.src.startsWith("[images|")
  // ) {
  //   const src = node.attrs.src;
  //   const newPath = LINKS[src];

  //   node.attrs.src = newPath;
  //   return node;
  // }

  if (node.type === "image" && node.attrs) {
    const { attrs, ...rest } = node;
    return {
      ...rest,
      ...node.attrs,
    };
  }

  if (node.type === "callout" || node.type === "contentpic") {
    return {
      ...node,
      content: {
        ...node.content,
        content: node.content.content.map(recurseToTextContent),
      },
    };
  }

  if (node.type === "accordion") {
    return {
      ...node,
      details: {
        ...node.details,
        content: node.details.content.map(recurseToTextContent),
      },
    };
  }

  if (!node.content || node.type === "iframe") {
    return node;
  }

  return {
    ...node,
    content: node.content.map(recurseToTextContent),
  };
};

// This is for updating GitHub repos
const main = async () => {
  const REPO = "../migrate-isomer-next/output";
  process.chdir(REPO);

  const allFiles = fs
    .readdirSync(".", { withFileTypes: true, recursive: true })
    .filter((dirent) => dirent.isFile() && dirent.name.endsWith(".json"));

  for (const jsonFile of allFiles) {
    const filePath = path.join(jsonFile.parentPath, jsonFile.name);
    // console.log("Processing file", filePath);

    try {
      const rawHtml = fs.readFileSync(filePath, "utf-8");

      if (!rawHtml.includes("[documents|")) {
        continue;
      }

      console.log("Processing page", jsonFile.name);
      COUNTER += 1;

      const path = Object.keys(NEW_TO_OLD_PATHS).includes(
        jsonFile.name.replace(".json", ""),
      )
        ? NEW_TO_OLD_PATHS[jsonFile.name.replace(".json", "")]
        : jsonFile.name.replace(".json", "");

      // Find all links in the original page
      const originalUrl = `https://www.moh.gov.sg/news-highlights/details/${path}`;
      const originalHtml = await (await fetch(originalUrl)).text();
      const $ = cheerio.load(originalHtml);
      // Get all links on the page and store them in the LINKS object
      // The key is inside the "sfref" attribute and the value is the href
      $("a").each((index, element) => {
        const sfref = $(element).attr("sfref");
        const href = $(element).attr("href");

        if (sfref && href) {
          // URL is https://www.moh.gov.sg/docs/librariesprovider5/pressroom/press-releases/annex-a-(28-may-2020).pdf?sfvrsn=d30916fd_0
          // Get the file name only without the query params
          const fileName = href.split("/").pop()?.split("?")[0];
          const newPath = `/files/newsroom/${fileName}`;

          RECORD[sfref] = href;
          LINKS[sfref] = newPath;
        } else if (
          href?.startsWith("https://www.moh.gov.sg/docs/librariesprovider")
        ) {
          console.log("Link has no sfref", href);
        }
      });
      const html = JSON.parse(rawHtml);
      const schema = {
        ...html,
        content: html.content.flatMap(recurseToTextContent),
      };

      // if (
      //   schema.layout === "article" &&
      //   schema.page?.contentPageHeader?.summary !== undefined &&
      //   schema.page?.contentPageHeader?.summary.length > 0
      // ) {
      //   const { contentPageHeader, ...rest } = schema.page;
      //   schema.page = {
      //     ...rest,
      //     articlePageHeader: {
      //       summary: contentPageHeader.summary,
      //     },
      //   };
      // }

      // if (
      //   schema.page?.articlePageHeader?.summary &&
      //   Array.isArray(schema.page.articlePageHeader.summary)
      // ) {
      //   schema.page.articlePageHeader.summary =
      //     schema.page.articlePageHeader.summary.join(" ");
      // }

      // if (JSON.stringify(schema) === JSON.stringify(html)) {
      //   continue;
      // }

      // Save the updated schema to the file
      fs.writeFileSync(filePath, JSON.stringify(schema, null, 2));
    } catch (err) {
      console.log("Error processing file", filePath);
      console.error(err);
    }
  }

  console.log("Total files processed", COUNTER);

  // Save all links to a file
  fs.writeFileSync(
    path.join(REPO, "links.json"),
    JSON.stringify(
      REPORT.map((item) => RECORD[item]),
      null,
      2,
    ),
  );
};

// This is for updating contents after they have been imported into the database
// const main = async () => {
//   const client = new Client({
//     connectionString: process.env.DATABASE_URL,
//   });

//   try {
//     await client.connect();

//     // Get all eligible resources
//     const allResources =
//       await client.query(`WITH RECURSIVE "resourcePath" (id, title, permalink, parentId, type, content, "fullPermalink", "publishedVersionId", blobid) AS (
//     -- Base case for all resources
//     SELECT
//         r.id,
//         r.title,
//         r.permalink,
//         r."parentId",
//         r.type,
//         CASE
//             WHEN r.type IN ('Page', 'CollectionPage', 'CollectionLink', 'IndexPage', 'RootPage') THEN b."content"
//             ELSE NULL
//         END AS content,
//         r.permalink AS "fullPermalink",
//         r."publishedVersionId",
//         b.id AS blobid
//     FROM
//         public."Resource" r
//     LEFT JOIN public."Version" v ON v."id" = r."publishedVersionId"
//     LEFT JOIN public."Blob" b ON v."blobId" = b.id
//     WHERE
//         r."siteId" = 3 AND r."parentId" IS NULL

//     UNION ALL

//     -- Recursive case
//     SELECT
//         r.id,
//         r.title,
//         r.permalink,
//         r."parentId",
//         r.type,
//         CASE
//             WHEN r.type IN ('Page', 'CollectionPage', 'CollectionLink', 'IndexPage', 'RootPage') THEN b."content"
//             ELSE NULL
//         END AS content,
//         CONCAT(path."fullPermalink", '/', r.permalink) AS "fullPermalink",
//         r."publishedVersionId",
//         b.id AS blobid
//     FROM
//         public."Resource" r
//     LEFT JOIN public."Version" v ON v."id" = r."publishedVersionId"
//     LEFT JOIN public."Blob" b ON v."blobId" = b.id
//     -- This join determines if the recursion continues if there are more rows
//     INNER JOIN "resourcePath" path ON r."parentId" = path.id
//     WHERE
//         r."siteId" = 3
// )
// SELECT blobid, permalink, content FROM "resourcePath"
// WHERE blobid IS NOT NULL;`);

//     for (const resource of allResources.rows) {
//       try {
//         // const rawHtml = JSON.stringify(resource.content);

//         console.log("Processing blob ID", resource.blobid);
//         COUNTER += 1;

//         // Find all links in the original page
//         // const originalUrl = `https://t768-p857-blue-admin.prd.cwp2.sg/news-highlights/details/${resource.permalink}`;
//         // const originalHtml = await (await fetch(originalUrl)).text();
//         // const $ = cheerio.load(originalHtml);
//         // // Get all links on the page and store them in the LINKS object
//         // // The key is inside the "sfref" attribute and the value is the href
//         // $("img").each((index, element) => {
//         //   const sfref = $(element).attr("sfref");
//         //   const src = $(element).attr("src");
//         //   const uuid = randomUUID();

//         //   if (sfref && src) {
//         //     // URL is https://www.moh.gov.sg/docs/librariesprovider5/pressroom/press-releases/annex-a-(28-may-2020).pdf?sfvrsn=d30916fd_0
//         //     // Get the file name only without the query params
//         //     const fileName = src.split("/").pop()?.split("?")[0];
//         //     const newPath = `/3/${uuid}/${fileName}`;

//         //     RECORD[sfref] = src;
//         //     LINKS[sfref] = newPath;

//         //     // Save the UUID and the original path
//         //     UUID_RECORDS[uuid] = src;
//         //   } else if (
//         //     src?.includes(
//         //       "https://t768-p857-blue-admin.prd.cwp2.sg/images/librariesprovider"
//         //     )
//         //   ) {
//         //     console.log("Image has no sfref", src);
//         //   }
//         // });
//         const html = resource.content;
//         const schema = {
//           ...html,
//           content: html.content.flatMap(recurseToTextContent),
//         };

//         if (JSON.stringify(schema) === JSON.stringify(html)) {
//           continue;
//         }

//         // spawn("pbcopy", []).stdin.end(JSON.stringify(schema, null, 2));

//         // await prompt();

//         // if (
//         //   schema.layout === "article" &&
//         //   schema.page?.contentPageHeader?.summary !== undefined &&
//         //   schema.page?.contentPageHeader?.summary.length > 0
//         // ) {
//         //   const { contentPageHeader, ...rest } = schema.page;
//         //   schema.page = {
//         //     ...rest,
//         //     articlePageHeader: {
//         //       summary: contentPageHeader.summary,
//         //     },
//         //   };
//         // }

//         // if (
//         //   schema.page?.articlePageHeader?.summary &&
//         //   Array.isArray(schema.page.articlePageHeader.summary)
//         // ) {
//         //   schema.page.articlePageHeader.summary =
//         //     schema.page.articlePageHeader.summary.join(" ");
//         // }

//         // if (JSON.stringify(schema) === JSON.stringify(html)) {
//         //   continue;
//         // }

//         // Update the content into the database
//         await client.query(
//           `UPDATE public."Blob" SET content = $1 WHERE id = $2`,
//           [JSON.stringify(schema), resource.blobid]
//         );
//       } catch (err) {
//         console.log("Error processing blob", resource.blobid);
//         console.error(err);
//       }
//     }
//   } catch (err) {
//     console.error(err);
//   } finally {
//     await client.end();
//   }

//   // Download all images
//   // for (const [uuid, src] of Object.entries(UUID_RECORDS)) {
//   //   try {
//   //     console.log("Downloading image", src);
//   //     const fileName = src.split("/").pop()?.split("?")[0];
//   //     await downloadFile(src, uuid, fileName!);
//   //   } catch (err) {
//   //     console.log("Error downloading image", src);
//   //     console.error(err);
//   //   }
//   // }

//   console.log("Total files processed", COUNTER);

//   // Save all links to a file
//   fs.writeFileSync(
//     path.join("/Users/zhongjun/Downloads", "links.json"),
//     JSON.stringify(
//       REPORT.map((item) => RECORD[item]),
//       null,
//       2
//     )
//   );
// };

main();
