export const normalizeUrl = (url: string) => {
  try {
    const u = new URL(url);
    // get pathname only, remove leading slash
    let path = u.pathname.replace(/^\//, "");

    // remove file extension
    path = path.replace(/\.[a-zA-Z0-9]+$/, "");

    // convert delimiters to spaces
    path = path.split(/[-_]/).join(" ");

    // collapse multiple spaces
    path = path.split(" ").filter(Boolean).join(" ");

    return path.toLowerCase();
  } catch {
    // fallback for invalid URLs
    return url
  }
}