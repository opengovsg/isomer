---
status: accepted
---

# Historical page versions are rendered with the site's _current_ context, not a point-in-time snapshot

A `Version` (`packages/db/prisma/schema.prisma`) snapshots only the page's own content blob. Everything else needed to render the page is read live at view time: the sitemap (`trpc.site.getLocalisedSitemap`), the site config, navbar and footer (`PreviewWithCustomSitemap`), the theme (`useSiteThemeCssVars`), and the page's current `permalink`. The page history diff view (`PageDiffModal`) renders both the "before" and "after" versions against this same live context. We accept this, so a historical version is **not** an exact reproduction of how the page looked when it was published. Only its own content is accurate.

## Considered options

- **Snapshot the surrounding context per version** (sitemap, site config, navbar, footer, theme). Rejected: storing a sitemap per page publish would mean large, mostly duplicated data on every publish. It would also need a schema change plus a backfill that can't be done accurately for versions that already exist.
- **Reconstruct the context at `publishedAt` from the audit log or the site's other versions.** Rejected: it's complex and fragile, and the audit log doesn't cover every change that affects the sitemap.
- **Render against the current context (chosen).** It needs no new storage and no schema change. Both diff panes also share the same context, so the diff highlights only show changes to the page's own content. If each pane used its own snapshot, every site-wide change in between (a navbar edit, a renamed sibling page) would show up as a page change.

## Consequences

- **Breadcrumbs can be wrong.** Breadcrumbs come from the sitemap. If a page lived at `a/b/c` when a version was published and has since moved to `a/e/f`, both diff panes show `a/e/f`.
- **Anything else derived from the sitemap also drifts:** the side rail, index-page child listings, collection listings and internal links all reflect the site as it is today. Links to pages that have since been deleted or renamed may look different from how they did at publish time.
- **Site-wide chrome drifts:** the navbar, footer, logo, theme colours and site config all show their current values.
- **The history view answers "what changed in this page's content", not "what did visitors see on date X".** Don't build features that depend on historical rendering being exact (for example, legal or compliance evidence of what was published) without revisiting this decision. That would need one of the snapshotting options above.
