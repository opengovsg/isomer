import * as fs from "fs";
import * as path from "path";
import { randomUUID } from "crypto";
import { Client } from "pg";
import { Octokit } from "@octokit/rest";
import { input, number, select } from "@inquirer/prompts";

import { getFileContents } from "./classic-migration/github";
import { getIsomerSchemaFromJekyll } from "./classic-migration/page";
import {
  getCollectionFolderName,
  getLegalPermalink,
} from "./classic-migration/utils";
import { studioifyContent } from "./classic-migration/studiofier";
import { GET_ALL_RESOURCES_WITH_FULL_PERMALINKS } from "./classic-migration/studiofier/constants";
import type { Resource } from "./classic-migration/studiofier/types";
import { EXTRACTED_ASSETS_DIR } from "./classic-migration/converters/google-slides";
import type { ReportRow } from "./classic-migration/types";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// The classic-migration directory holds the shared conversion assets, notably
// the extracted-assets folder that Google Slides downloads are written to.
const CLASSIC_MIGRATION_DIR = path.join(__dirname, "classic-migration");
const OUTPUT_ROOT = path.join(CLASSIC_MIGRATION_DIR, "page-conversion-output");

interface ConvertedPage {
  permalink: string; // Output permalink (legalised)
  content: any; // Isomer Next schema object
  report: ReportRow;
}

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

const parsePagePaths = (raw: string): string[] =>
  raw
    .split(/[\s,]+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    // Normalise away any accidental leading "./" or "/"
    .map((p) => p.replace(/^\.?\//, ""));

// ---------------------------------------------------------------------------
// Conversion
// ---------------------------------------------------------------------------

const convertPage = async ({
  site,
  domain,
  pagePath,
  useStagingBranch,
}: {
  site: string;
  domain: string;
  pagePath: string;
  useStagingBranch: boolean;
}): Promise<ConvertedPage | null> => {
  console.log(`\nConverting ${pagePath}`);
  const fileContents = await getFileContents({
    site,
    path: pagePath,
    octokit,
    useStagingBranch,
  });

  // Arbitrary length check to avoid empty files
  if (!fileContents || fileContents.length < 5) {
    console.error(`Error reading file contents at ${pagePath}`);
    return null;
  }

  // Pages that live inside a Jekyll "_posts" folder are resource room articles.
  const isResourceRoomPage = /(^|\/)_posts\//.test(pagePath);

  const response = await getIsomerSchemaFromJekyll({
    content: fileContents,
    path: pagePath,
    isResourceRoomPage,
    site,
    domain,
    useStagingBranch,
  });

  if (response.status === "not_converted") {
    console.warn(`  Skipped (not converted): ${pagePath}`);
    const permalink = getLegalPermalink(
      response.permalink ?? pathToPermalink(pagePath),
    );
    return {
      permalink,
      content: null,
      report: {
        status: response.status,
        title: response.title,
        permalink: response.permalink ?? `/${permalink}`,
      },
    };
  }

  // Resource room articles inherit their collection folder name as category.
  if (isResourceRoomPage && response.content?.page) {
    response.content.page.category = await getCollectionFolderName({
      site,
      octokit,
      path: pagePath,
      useStagingBranch,
    });
  }

  const permalink = getLegalPermalink(
    response.permalink ?? pathToPermalink(pagePath),
  );

  return {
    permalink,
    content: response.content,
    report: {
      status: response.status,
      title: response.title,
      permalink: response.permalink ?? `/${permalink}`,
      reviewItems: "reviewItems" in response ? response.reviewItems : undefined,
    },
  };
};

const pathToPermalink = (pagePath: string): string => {
  const base = pagePath.split("/").pop() ?? pagePath;
  return base.replace(/\.(md|html)$/i, "");
};

// ---------------------------------------------------------------------------
// Asset collection + download
// ---------------------------------------------------------------------------

// Matches site-relative asset references to the Classic images/ and files/
// folders. Stops at the closing quote of the JSON string value.
const ASSET_REFERENCE_REGEX = /\/(?:images|files)\/[^"'\\]+/g;

const decodePath = (assetPath: string): string => {
  try {
    return decodeURIComponent(assetPath);
  } catch {
    return assetPath;
  }
};

// Collects every distinct asset path referenced across the converted pages.
// Keys are canonicalised to their decoded (spaces, not %20) form so that
// studioifyContent's replacements cover both encoded and decoded occurrences.
const collectAssetReferences = (pages: ConvertedPage[]): Set<string> => {
  const assets = new Set<string>();
  for (const page of pages) {
    if (!page.content) continue;
    const stringified = JSON.stringify(page.content);
    for (const match of stringified.matchAll(ASSET_REFERENCE_REGEX)) {
      assets.add(decodePath(match[0]));
    }
  }
  return assets;
};

const buildAssetsMap = (
  assets: Set<string>,
  siteId: number,
): Record<string, string> => {
  const assetsMap: Record<string, string> = {};
  for (const asset of assets) {
    const fileName = path.basename(asset);
    assetsMap[asset] = path.posix.join("/", String(siteId), randomUUID(), fileName);
  }
  return assetsMap;
};

// Resolves the bytes for a single asset and writes it to its mapped location.
// Returns true on success, false if the asset could not be resolved.
const downloadAsset = async ({
  assetPath,
  mappedPath,
  site,
  useStagingBranch,
  assetsDir,
}: {
  assetPath: string;
  mappedPath: string;
  site: string;
  useStagingBranch: boolean;
  assetsDir: string;
}): Promise<boolean> => {
  // mappedPath is "/<siteId>/<uuid>/<filename>"; write under assetsDir.
  const destination = path.join(assetsDir, mappedPath.replace(/^\//, ""));
  await fs.promises.mkdir(path.dirname(destination), { recursive: true });

  // Google Slides images are downloaded locally during conversion.
  if (assetPath.startsWith("/images/google-slides/")) {
    const localPath = path.join(
      CLASSIC_MIGRATION_DIR,
      EXTRACTED_ASSETS_DIR,
      site,
      assetPath.replace(/^\//, ""),
    );
    if (fs.existsSync(localPath)) {
      await fs.promises.copyFile(localPath, destination);
      return true;
    }
    console.warn(`  Missing extracted Google Slides asset: ${assetPath}`);
    return false;
  }

  // Everything else is fetched from the Classic repo on GitHub.
  const branch = useStagingBranch ? "staging" : "master";
  const encoded = assetPath
    .replace(/^\//, "")
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  const url = `https://raw.githubusercontent.com/isomerpages/${site}/${branch}/${encoded}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`  Failed to download ${assetPath} (HTTP ${response.status})`);
      return false;
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.promises.writeFile(destination, buffer);
    return true;
  } catch (error) {
    console.warn(`  Error downloading ${assetPath}:`, error);
    return false;
  }
};

// ---------------------------------------------------------------------------
// Resource mapping (DB)
// ---------------------------------------------------------------------------

const getResourceMapping = async (
  client: Client,
  siteId: number,
): Promise<Record<string, Resource>> => {
  const result = await client.query<Resource>(
    GET_ALL_RESOURCES_WITH_FULL_PERMALINKS,
    [siteId],
  );
  const resourcesMap: Record<string, Resource> = {};
  for (const resource of result.rows) {
    resourcesMap[path.posix.join("/", resource.fullPermalink)] = resource;
  }
  return resourcesMap;
};

// ---------------------------------------------------------------------------
// Output writers
// ---------------------------------------------------------------------------

const savePageJson = async (
  pagesDir: string,
  permalink: string,
  content: any,
) => {
  const relative = permalink === "" || permalink === "/" ? "index" : permalink;
  const filePath = path.join(pagesDir, relative);
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });

  let finalPath = `${filePath}.json`;
  let counter = 1;
  while (fs.existsSync(finalPath)) {
    finalPath = `${filePath}-${counter}.json`;
    counter += 1;
  }

  await fs.promises.writeFile(finalPath, JSON.stringify(content, null, 2));
};

const getStatusName = (
  status: "converted" | "manual_review" | "not_converted",
) => (status === "not_converted" ? "Not Converted" : "Converted");

const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;

const writeMigrationReport = async (
  reportPath: string,
  rows: ReportRow[],
  extraNotes: Record<string, string[]>,
) => {
  const headers =
    "Permalink,Title,Status,Priority,Review items,Recommended actions\n";
  const body = rows
    .filter((row) => row.permalink !== undefined)
    .sort((a, b) => (a.permalink ?? "").localeCompare(b.permalink ?? ""))
    .map((row) => {
      const notes = extraNotes[row.permalink ?? ""] ?? [];
      const reviewItems = row.reviewItems ?? [];
      const priority = reviewItems.some((ri) => ri.type === "must-fix")
        ? "Must fix"
        : reviewItems.length > 0
          ? "Review"
          : row.status === "not_converted"
            ? "Must fix"
            : "Review";
      const messages = [
        ...reviewItems
          .filter((ri) => ri.message.trim() !== "")
          .map((ri) => ri.message),
        ...notes,
      ];
      const actions = [
        ...new Set(reviewItems.map((ri) => ri.action).filter(Boolean)),
      ];
      if (row.status === "not_converted") {
        messages.unshift("Recreate page from scratch");
      }
      return [
        row.permalink,
        escapeCsv(row.title),
        getStatusName(row.status),
        priority,
        escapeCsv(messages.join(", ")),
        escapeCsv(actions.join(", ")),
      ].join(",");
    });
  await fs.promises.writeFile(reportPath, headers + body.join("\n") + "\n");
};

const writeAssetMappingReport = async (
  reportPath: string,
  assetsMap: Record<string, string>,
  brokenAssets: Set<string>,
) => {
  const headers = "Original Path,Assets Path,Status\n";
  const body = Object.entries(assetsMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([original, mapped]) =>
        `${original},${mapped},${brokenAssets.has(original) ? "BROKEN" : "OK"}`,
    );
  await fs.promises.writeFile(reportPath, headers + body.join("\n") + "\n");
};

// Extracts internal link targets (href/url/ref values pointing to site-relative
// paths that are not assets) so we can report which ones had no matching Studio
// resource and were therefore left unrewritten.
const INTERNAL_LINK_REGEX = /"(?:href|url|ref)":"(\/[^"]*)"/g;

const findUnresolvedInternalLinks = (
  content: any,
  resourcesMap: Record<string, Resource>,
): string[] => {
  const stringified = JSON.stringify(content);
  const unresolved = new Set<string>();
  for (const match of stringified.matchAll(INTERNAL_LINK_REGEX)) {
    const link = match[1]!;
    if (/^\/(?:images|files)\//.test(link)) continue; // asset, not a page link
    const normalised = link.replace(/\/$/, "");
    if (!resourcesMap[normalised] && !resourcesMap[`${normalised}/`]) {
      unresolved.add(link);
    }
  }
  return [...unresolved];
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export const migrateIndividualPages = async () => {
  console.log("Convert individual Classic pages to Isomer Next Studio format.");

  const site = await input({
    message: "Classic GitHub repo name (under isomerpages):",
    required: true,
    validate: (v) => v.trim().length > 0 || "Required",
  });

  const siteId = await number({
    message: "Studio site ID (Site.id):",
    required: true,
    validate: (v) => (v !== undefined && v > 0) || "Must be a positive integer",
  });

  const branch = await select<"master" | "staging">({
    message: "Which branch to read from?",
    choices: [
      { name: "master (default)", value: "master" },
      { name: "staging", value: "staging" },
    ],
    default: "master",
  });
  const useStagingBranch = branch === "staging";

  const domainRaw = await input({
    message: "Target domain (e.g. www.example.gov.sg):",
    required: true,
    validate: (v) => v.trim().length > 0 || "Required",
  });
  const domain = domainRaw.startsWith("http")
    ? domainRaw.replace("http://", "https://")
    : `https://${domainRaw.trim()}`;

  const pagesRaw = await input({
    message:
      "Markdown paths (repo-relative, comma/space/newline separated):",
    required: true,
    validate: (v) => parsePagePaths(v).length > 0 || "Enter at least one path",
  });
  const pagePaths = parsePagePaths(pagesRaw);

  console.log(`\n${pagePaths.length} page(s) to convert for ${site}.`);

  // Prepare a clean output directory for this repo.
  const outputDir = path.join(OUTPUT_ROOT, site);
  if (fs.existsSync(outputDir)) {
    console.log("Removing previous output for this repo...");
    await fs.promises.rm(outputDir, { recursive: true, force: true });
  }
  const pagesDir = path.join(outputDir, "pages");
  const assetsDir = path.join(outputDir, "assets");
  await fs.promises.mkdir(pagesDir, { recursive: true });
  await fs.promises.mkdir(assetsDir, { recursive: true });

  // Step 1: Convert every requested page.
  const converted: ConvertedPage[] = [];
  for (const pagePath of pagePaths) {
    const result = await convertPage({
      site,
      domain,
      pagePath,
      useStagingBranch,
    });
    if (result) {
      converted.push(result);
    }
  }

  const convertedWithContent = converted.filter((page) => page.content);

  // Step 2: Fetch the Studio resource map for internal link resolution.
  console.log("\nFetching Studio resource map...");
  const client = new Client({
    connectionString: process.env.ISOMER_STUDIO_DATABASE_URL,
  });
  let resourcesMap: Record<string, Resource> = {};
  try {
    await client.connect();
    resourcesMap = await getResourceMapping(client, siteId!);
    console.log(
      `  Loaded ${Object.keys(resourcesMap).length} resources for site ${siteId}.`,
    );
  } catch (error) {
    console.error(
      "  Could not load resource map (is the SSH tunnel up?). Internal links will be left as-is.",
      error,
    );
  } finally {
    await client.end();
  }

  // Step 3: Collect and download the assets used by the converted pages.
  console.log("\nCollecting assets used by the converted pages...");
  const assetReferences = collectAssetReferences(convertedWithContent);
  const assetsMap = buildAssetsMap(assetReferences, siteId!);
  console.log(`  ${assetReferences.size} asset(s) referenced.`);

  const brokenAssets = new Set<string>();
  for (const [assetPath, mappedPath] of Object.entries(assetsMap)) {
    const ok = await downloadAsset({
      assetPath,
      mappedPath,
      site,
      useStagingBranch,
      assetsDir,
    });
    if (!ok) {
      brokenAssets.add(assetPath);
    }
  }

  // Step 4: Studiofy each page and write the final JSON.
  console.log("\nStudiofying pages and writing output...");
  const unresolvedNotes: Record<string, string[]> = {};
  for (const page of convertedWithContent) {
    const studiofied = JSON.parse(
      studioifyContent(
        JSON.stringify(page.content),
        siteId!,
        assetsMap,
        resourcesMap,
      ),
    );
    await savePageJson(pagesDir, page.permalink, studiofied);

    const unresolved = findUnresolvedInternalLinks(studiofied, resourcesMap);
    const notes: string[] = [];
    if (unresolved.length > 0) {
      notes.push(
        `Unresolved internal links (no matching Studio page): ${unresolved.join(" ")}`,
      );
    }
    // Flag any assets used by this page that failed to download.
    const pageAssets = collectAssetReferences([page]);
    const pageBroken = [...pageAssets].filter((a) => brokenAssets.has(a));
    if (pageBroken.length > 0) {
      notes.push(`Broken/missing assets: ${pageBroken.join(" ")}`);
    }
    if (notes.length > 0) {
      unresolvedNotes[page.report.permalink ?? ""] = notes;
    }
  }

  // Step 5: Write the reports.
  await writeMigrationReport(
    path.join(outputDir, `migrated-pages-${site}.csv`),
    converted.map((page) => page.report),
    unresolvedNotes,
  );
  await writeAssetMappingReport(
    path.join(outputDir, `asset-mappings-${site}.csv`),
    assetsMap,
    brokenAssets,
  );

  console.log("\nDone.");
  console.log(`  Pages:  ${pagesDir}`);
  console.log(
    `  Assets: ${assetsDir} (upload its contents to S3, preserving /<siteId>/<uuid>/<file>)`,
  );
  if (brokenAssets.size > 0) {
    console.log(
      `  WARNING: ${brokenAssets.size} asset(s) could not be downloaded — see asset-mappings-${site}.csv`,
    );
  }
};
