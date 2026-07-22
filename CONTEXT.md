# Isomer Studio

A government CMS and site builder for Singapore public agencies. Editors create and publish pages within collections; admins control the structure and taxonomy of those collections.

## Language

### Collection structure

**Collection Item**: An article (CollectionPage) or link (CollectionLink) that lives inside a collection. Both support category assignment and tag assignment.
_Avoid_: article (when referring to both types), page (ambiguous)

**Collection Index**: The parent page of a collection. Stores the admin-defined taxonomy — Category Options and Tag Categories — in its blob.
_Avoid_: collection page, index page (ambiguous across layouts)

### Taxonomy — categories

**Category Option**: A single-select classification option defined by an Isomer Admin on a Collection Index. Each option has a UUID and a label. Editors assign exactly one Category Option per Collection Item.
_Avoid_: category (the legacy free-text field), filter option

**Category ID** (`categoryId`): The UUID of the selected Category Option stored on a Collection Item. References a Category Option on the parent Collection Index.
_Avoid_: category (which refers to the legacy free-text `category` field)

**Legacy Category** (`category`): The deprecated free-text string field on Collection Items, replaced by Category ID + Category Options. Preserved in blobs for backward compatibility during migration.
_Avoid_: category (now ambiguous — prefer "legacy category" or "category string" when the distinction matters)

### Taxonomy — tags

**Tag Category**: A named filter group defined by an Isomer Admin on a Collection Index. Contains ordered Tag Options. Can be marked required, meaning editors must select at least one option before publishing.
_Avoid_: filter category, tag group, tag type

**Tag Option**: A selectable value within a Tag Category, identified by a UUID and a label. Editors pick from Tag Options when tagging a Collection Item.
_Avoid_: tag, filter option, tag value

**Tagged** (`tagged`): The array of Tag Option UUIDs stored on a Collection Item representing the editor's selections across all Tag Categories.
_Avoid_: tags (the legacy resolved format using string labels), selected tags

### Page editing survey

**Content Edit**: Any change an editor makes to a page's content blocks in the page editor — adding, deleting, reordering, or modifying a block (including hero and prose). Counts the moment the change is made, whether or not it is later saved or discarded. Excludes changes made via raw JSON mode, and excludes page metadata, siderail ordering, database configuration, and collection settings — those edit page properties, not content blocks.
_Avoid_: edit (ambiguous — could mean any interaction), saved edit (a Content Edit need not be saved)

**Measuring Point**: The moment a user who has made at least one Content Edit ends that editing burst by either (a) successfully publishing or scheduling the page for publication, or (b) navigating anywhere else within Studio. Each burst of Content Edits produces exactly one Measuring Point — reaching one re-arms only after a fresh Content Edit. Closing the window or tab is not a Measuring Point.
_Avoid_: trigger point (overloaded), exit (window close is not a Measuring Point)

**Measuring Period**: The recurrence window within which a given user is shown the editing survey at most once. Defined and enforced in the survey tool's frequency settings, not by Studio.
_Avoid_: survey cooldown, quarter (the period is configurable, not fixed)

### Roles and surfaces

**Isomer Admin**: A user with the Core or Migrator role. The only role that can manage taxonomy (create, edit, delete Tag Categories, Tag Options, and Category Options) via the Manage Filters panel.
_Avoid_: admin, site admin (different concept — refers to site-level admin permissions)

**Site Admin**: A user holding the `Admin` role on a specific site (`ResourcePermission.role = Admin`). Can manage that site's users and permissions. Distinct from Isomer Admin.
_Avoid_: admin (ambiguous), Isomer Admin (a different, platform-level role)

### Audit and access logging

**Audit Log** (`AuditLog`): The append-only record of site events — resource create/update/delete, publish, login/logout, permission and config changes — each carrying a `delta` (before/after) and `metadata`, scoped by `siteId` and `createdAt`.
_Avoid_: access log (a derived view, not the raw record), history

**Audit Log Export**: The Site-Admin-initiated, asynchronous workflow that produces a downloadable report of a site's audit/access data for a selected month and emails the requester a link. Comprises one or both report types below.
_Avoid_: audit log (the underlying record, not the export), download

**Access report** (`type: "users"`): The export view answering *who has access* to a site — derived from `ResourcePermission` joined with `User` (email, role, date added, last login).
_Avoid_: user list, access log

**Activity report** (`type: "events"`): The export view answering *what happened* on a site during the selected month — derived from `AuditLog` events.
_Avoid_: event log (ambiguous with the table), audit report
