// content-disposition does not ship its own TypeScript declarations.
// This minimal stub covers the subset used in gazette.ts.
declare module "content-disposition" {
  interface Options {
    type?: "attachment" | "inline"
    fallback?: string | boolean
  }
  function contentDisposition(filename?: string, options?: Options): string
  export = contentDisposition
}
