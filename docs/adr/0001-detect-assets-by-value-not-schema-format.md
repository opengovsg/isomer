# Detect duplicable assets by value convention, not schema format

When duplicating a Resource we must find which strings in its blob are
[Asset references](../../CONTEXT.md) (site-owned uploaded files that need a
deep copy) versus things to share verbatim (external URLs, page references,
mailto links). We decided to recognize Asset references by the **value's**
conventional shape — the `{siteId}/{uuid}/{file}` asset-path pattern, owned as a
single predicate in the components package — rather than by the schema `format`
annotation of the field the string sits in. Studio does a blind generic walk
over the whole blob (page + content + meta) and asks the components predicate
about each string.

## Why not schema/format-driven

It was tempting to drive the decision off the TypeBox `format` the components
package already declares (`image`, `ref`, `link`). We rejected this because
format is structurally incapable of deciding here:

- **Polymorphic fields.** A single `format: "ref"` field holds a FileRef (PDF
  asset → copy) *or* a LinkRef (external URL → share). Every `format: "link"`
  field (Infopic, Button, InfoCols, Infobar, KeyStatistics, ContactInformation,
  …) likewise holds a File link, an external URL, or a page ref — chosen per
  instance. The format is fixed; only the value reveals the kind.
- **Assets in unformatted fields.** File-links embedded in prose body text live
  in plain `href` strings with no asset format at all. A format-driven walk
  would silently fail to copy them.
- **Freeform subtrees.** A blind value walk handles prose/TipTap (and any future
  freeform content) for free; a schema-guided walk would need to resolve unions,
  `$ref`s, and discriminants.

Value detection is therefore both necessary (only it catches polymorphic and
prose file-links) and sufficient (image/FileRef/prose file-links match the
convention; URLs/page-refs/mailto do not). The asset-path convention was already
duplicated in studio's `tryParseSiteAssetFileKey` and the editor's
`getLinkHrefType`; centralizing it in components makes one source of truth.

## Consequence

A future reader will see a "blind string walk" and may assume the `format`
annotations should be used instead. They should not: format cannot distinguish a
copied file from a shared URL in the same field. Keep the convention in one
place in the components package.
