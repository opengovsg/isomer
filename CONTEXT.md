# Isomer Studio — Context

Studio is the CMS/site-builder where editors manage a site's content tree. This
glossary fixes the language used when talking about that tree and the operations
on it.

## Language

**Resource**:
Any node in a site's content tree — a Page, Folder, Collection, CollectionPage,
CollectionLink, IndexPage, RootPage, etc. The umbrella entity; everything an
editor sees in a resource list is a Resource.

**Duplicate**:
Creating an independent copy of a Resource's current content as a new Draft
sibling under the same parent. "Independent" means the copy shares no mutable
state with the original — including its own copies of any embedded assets.
_Avoid_: Copy, Clone (use these only for the lower-level S3/object sense).

**Duplicable Resource**:
The subset of Resources that the Duplicate operation accepts: Page,
CollectionPage, and CollectionLink. (Folders, Collections, and the various
index/meta resources are out of scope.)

**Current content**:
The blob a Resource resolves to for editing — its Draft blob if one exists,
otherwise the blob of its published Version. Duplicate copies the Current
content, never specifically the published-only state.

**Asset reference**:
A string inside a blob that points at a site-owned uploaded file (image, PDF,
etc.) living in the site's asset store. Whether a string is an Asset reference
is judged from its **value** (the conventional shape of an asset path), not from
the schema field it sits in — the same `ref`/`link` field can hold an Asset
reference, an external URL, a page reference, or a mailto, and only the value
tells them apart. The components package owns this judgement as the single
source of truth. Only Asset references are deep-copied on Duplicate; everything
else is shared verbatim.
_Avoid_: link, src, path (these describe fields, not the asset-vs-not judgement).
