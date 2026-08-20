# Spec: E2E coverage for site dashboard navigation and search (ISOM-2457)

Status: **planned, not yet implemented**. This captures the decisions reached before writing any test code so implementation can pick up cold.

Branch: `feature/isom-2457-add-e2e-tests-for-site-dashboard-navigation-and-search`, based off `cursor/e2e-improve-flakiness`.

## Background / facts established

- No existing test file owns "dashboard nav / sidebar / search" as a topic — coverage today is scattered (`resource/search.test.ts`, `site/list.test.ts`, `collection/collection-table-permissions.test.ts`, `godmode/access.test.ts`).
- `DirectorySidebar` (`src/features/dashboard/components/DirectorySidebar/`), breadcrumbs (`DashboardLayout.tsx:21-123`), and the folder `ResourceTable`'s sort/pagination/empty-state (`src/features/dashboard/components/ResourceTable/`) have **zero** E2E or component test coverage today.
- Test users are a fixed, shared pool (`TEST_EMAIL_BY_ROLE` in `fixtures/site/provision.ts`) reused across every parallel test file — there is no way to assert an exhaustive "sees exactly these sites" against the full DB.
- Missing-site and unauthorized-site both render the same client-side `PermissionsErrorPage` (via `PermissionsBoundary` in `src/pages/sites/[siteId]/index.tsx`) — no 404, no server redirect. The "Back to My Sites" button is `router.back()`, not a route to `/sites`.
- Search (`resource.router.ts` `search` procedure) authorizes at the **site** level only (`validateUserPermissionsForSite`) and its query is scoped by `siteId` — there is no subtree/resource-level ACL to leak through. `USER_VIEWABLE_RESOURCE_TYPES` = `[Page, Folder, Collection, CollectionLink, CollectionPage]`.
- Search's no-query "initial state" (`SearchModalBodyContentStates.tsx`) has two independent sections:
  - **"Pages recently edited on your site"** — server-driven (`getSearchRecentlyEdited`), global to the site.
  - **"Pages you've recently opened"** — client-driven, backed by `localStorage` key `localViewHistory-${siteId}` via `useResourceLocalViewHistory` (`src/hooks/useResourceLocalViewHistory.ts`).
- No-results copy: "We've looked everywhere, but we're getting nothing." (`NoSearchResultSvgr` state).
- Search keyboard shortcut: Cmd+K (Mac) / Ctrl+K (other) via `Searchbar.tsx:70-87`. Existing `DashboardPO.openSearch()` only exercises the click path, not the shortcut.
- Sort options for the folder `ResourceTable` (`ResourceSortMenu` / `RESOURCE_TABLE_SORT_OPTIONS`): `"updated-desc"` ("Recently edited", default), `"title-asc"` ("Alphabetical"), `"permalink-asc"` ("URL"). Server-side sort, dropdown-based (not clickable column headers).
- `provisionE2ESite({ roles })` can be called multiple times to grant the _same_ fixed role-mapped user access to multiple distinct sites (it never creates new users, only new sites + grants).

## Decisions

| #   | Decision                                 | Chosen approach                                                                                                                                                                                                                                                             |
| --- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | File organization                        | New topic folder `tests/e2e/dashboard/`, since this ticket spans multiple resource types around one user-facing area rather than fitting one resource-type folder.                                                                                                          |
| 2   | Existing `resource/search.test.ts`       | Relocate into `dashboard/search.test.ts` and extend in place (not left as a separate/duplicate file).                                                                                                                                                                       |
| 3   | "Sees all and only their assigned sites" | Not an exhaustive-list assertion (impossible under the shared-user-pool architecture). Provision 2 sites for the role, assert both show; provision a 3rd site _without_ granting that role, assert it does not show.                                                        |
| 4   | Missing vs. unauthorized site            | Test current behavior as correct: both cases render the same inline `PermissionsErrorPage`. No product-bug follow-up filed for `router.back()` behavior.                                                                                                                    |
| 5   | Search "no leak" scenario                | Cross-site isolation regression test: seed a same/similar-titled resource in two different sites, search from site A, assert only site A's result appears.                                                                                                                  |
| 6   | Mobile / responsive nav (P2)             | **Dropped entirely.** Desktop is the actual use case; not implemented, not descoped-with-a-stub — simply out of scope. No `playwright.config.ts` changes.                                                                                                                   |
| 7   | Priority tagging (P0/P1/P2)              | Not encoded in test code (no new tagging convention, no config changes). Priority is planning/PR-description metadata only.                                                                                                                                                 |
| 8   | Sidebar/breadcrumb page-object home      | Extend the existing `DashboardPO` (`fixtures/po/dashboard.ts`) rather than introducing a new `SidebarPO`.                                                                                                                                                                   |
| 9   | "Collection item" in search coverage     | `CollectionPage` only (not `CollectionLink`).                                                                                                                                                                                                                               |
| 10  | Recently edited/viewed search sections   | Cover **both**: (a) edit/create a page then open search with no query → assert it's under "Pages recently edited on your site"; (b) visit a page (populates `localStorage` view history for that site) then open search → assert it's under "Pages you've recently opened". |
| 11  | E2E conventions doc                      | Add a short note to `.claude/skills/isomer-conventions/conventions/e2e-tests.md` documenting that a topic folder (like `dashboard/`) is allowed when tests span multiple resource types around one user-facing area.                                                        |

## Planned files

### `tests/e2e/dashboard/site-access.test.ts`

- **P0** — clicking a site (from "Your sites") opens the correct site's dashboard and content tree (sidebar shows that site's resources, not another site's).
- **P1** — a role granted access to two sites sees both in "Your sites"; a third site it was never granted does not appear.
- **P1** — direct navigation to a nonexistent `siteId` and to an existing-but-unauthorized `siteId` both render the same inline "you don't have access" error screen (current behavior, asserted as correct).

### `tests/e2e/dashboard/search.test.ts` (relocated + extended from `resource/search.test.ts`)

- Finds a Page, Folder, Collection, and CollectionPage by title (existing coverage, carried over).
- The system "Search" page itself never appears in results (existing coverage, carried over).
- Clicking a nested search result navigates to the correct resource (correct URL / editor state).
- Empty/no-match query renders the no-results state ("We've looked everywhere...").
- A same-titled resource seeded in a second site never appears when searching from the first site (no-leak regression).
- Cmd/Ctrl+K opens the search modal (not just the click path `openSearch()` already covers).
- Escape closes the modal and focus returns to the search trigger button.
- After clicking a result and navigating away, browser back returns to the prior dashboard page (search modal not reopened, no broken state).
- With no query typed: a just-edited page appears under "Pages recently edited on your site".
- With no query typed, after having visited a page: that page appears under "Pages you've recently opened".

### `tests/e2e/dashboard/sidebar-navigation.test.ts`

- `DirectorySidebar` expand/collapse for `Folder`/`Collection`/root nodes.
- Active-item highlighting (`aria-selected` / active style) matches the currently open resource, including auto-expand down to it.
- Breadcrumb segments (`DashboardLayout`) are clickable and navigate to the correct ancestor; the current (last) segment is not a link.
- Multi-level nested navigation (folder → subfolder → page) via sidebar and breadcrumbs both land on the correct resource.

### `tests/e2e/dashboard/resource-table.test.ts`

- Switching the sort dropdown between "Recently edited" / "Alphabetical" / "URL" reorders rows accordingly.
- Pagination works across multiple pages of a folder's contents.
- An empty folder renders the "This folder is empty. Create a new page or folder" placeholder.

## Explicitly out of scope

- Mobile sidebar / responsive dashboard navigation (P2) — dropped, no viewport/device testing infra introduced.
- `CollectionLink` search coverage (only `CollectionPage` tested as "Collection item").
- Formal P0/P1/P2 test tagging or `playwright.config.ts` changes.
- Filing a product-bug follow-up for the missing-vs-unauthorized-site error page's "Back to My Sites" button behavior.

## Not yet decided / to confirm at implementation time

- Exact new `DashboardPO` method names/signatures for sidebar/breadcrumb interactions.
- Whether pagination test needs a dedicated seed helper for "N+1 pages" (check `useTablePagination` default page size before seeding).
