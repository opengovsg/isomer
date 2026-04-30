import fs from "fs";
import path from "path";

export const EXTRACTED_ASSETS_DIR = "extracted-assets";

interface SlideInfo {
  presentationId: string;
  isPublished: boolean;
}

const parseSlidesUrl = (rawUrl: string): SlideInfo | null => {
  try {
    const parsed = new URL(rawUrl);
    if (!parsed.host.includes("docs.google.com")) return null;
    if (!parsed.pathname.includes("/presentation/")) return null;

    const publishedMatch = parsed.pathname.match(
      /\/presentation\/d\/e\/([^/]+)/,
    );
    if (publishedMatch && publishedMatch[1]) {
      return { presentationId: publishedMatch[1], isPublished: true };
    }

    const regularMatch = parsed.pathname.match(/\/presentation\/d\/([^/]+)/);
    if (regularMatch && regularMatch[1]) {
      return { presentationId: regularMatch[1], isPublished: false };
    }

    return null;
  } catch {
    return null;
  }
};

const getEmbedUrl = ({ presentationId, isPublished }: SlideInfo) =>
  isPublished
    ? `https://docs.google.com/presentation/d/e/${presentationId}/embed`
    : `https://docs.google.com/presentation/d/${presentationId}/embed`;

const fetchSlideThumbnailUrls = async (info: SlideInfo): Promise<string[]> => {
  const response = await fetch(getEmbedUrl(info), {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!response.ok) return [];

  const html = await response.text();

  // Each slide appears in the embed's docData JS literal as an entry of shape
  //   ["<slideId>",<index>,"<title>",[],[],[],[],[[],false,<n>],[],"",["<thumbUrl>"],...]
  // The entry prefix is distinctive enough to avoid false positives; once
  // matched we take the first /slidesz/ URL that follows. URLs contain JS
  // string escapes (= encoded as =), so we JSON.parse to decode.
  const entryRe =
    /\["[^"]+",(\d+),"[^"]*",\[\],\[\],\[\],\[\],\[\[\],false,\d+\]/g;
  const urlRe = /"(https:[^"]*\/slidesz\/[^"]+)"/;

  const entries: { index: number; url: string }[] = [];
  for (const m of html.matchAll(entryRe)) {
    const idx = Number(m[1]);
    const start = m.index ?? 0;
    const urlMatch = html.slice(start, start + 4000).match(urlRe);
    if (!urlMatch || !urlMatch[1]) continue;
    try {
      entries.push({ index: idx, url: JSON.parse(`"${urlMatch[1]}"`) });
    } catch {
      // Skip if the URL fails to decode.
    }
  }

  entries.sort((a, b) => a.index - b.index);
  return entries.map((e) => e.url);
};

const downloadSlide = async (
  thumbnailUrl: string,
  filePath: string,
): Promise<boolean> => {
  const response = await fetch(thumbnailUrl, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!response.ok) return false;

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    // Google returns an HTML error page (e.g. login wall) for private
    // presentations instead of the requested image.
    return false;
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.promises.writeFile(filePath, buffer);
  return true;
};

interface DownloadGoogleSlidesParams {
  url: string;
  site: string;
  baseDir: string;
}

export interface DownloadedSlide {
  publicPath: string;
  sourceUrl: string;
}

export const downloadGoogleSlides = async ({
  url,
  site,
  baseDir,
}: DownloadGoogleSlidesParams): Promise<{ slides: DownloadedSlide[] } | null> => {
  const info = parseSlidesUrl(url);
  if (!info) return null;

  const thumbnailUrls = await fetchSlideThumbnailUrls(info);
  if (thumbnailUrls.length === 0) {
    console.warn(
      `Could not extract slide thumbnails from Google Slides at ${url}`,
    );
    return null;
  }

  const relativeDir = path.join(
    "images",
    "google-slides",
    info.presentationId,
  );
  const outputDir = path.join(baseDir, EXTRACTED_ASSETS_DIR, site, relativeDir);
  await fs.promises.mkdir(outputDir, { recursive: true });

  const slides: DownloadedSlide[] = [];
  for (let i = 0; i < thumbnailUrls.length; i++) {
    const thumbnailUrl = thumbnailUrls[i];
    if (!thumbnailUrl) continue;
    const fileName = `slide-${i + 1}.jpg`;
    const filePath = path.join(outputDir, fileName);

    const ok = await downloadSlide(thumbnailUrl, filePath);
    if (ok) {
      slides.push({
        publicPath: path.posix.join("/", relativeDir, fileName),
        sourceUrl: thumbnailUrl,
      });
    } else {
      console.warn(
        `Failed to download slide ${i + 1} of ${thumbnailUrls.length} from ${url}`,
      );
    }
  }

  if (slides.length === 0) {
    console.warn(`No slides could be downloaded from ${url}`);
    return null;
  }

  return { slides };
};
