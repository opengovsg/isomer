# Isomer Studio

A government CMS and site builder for Singapore public agencies. Editors create and publish pages within collections; admins control the structure and taxonomy of those collections.

## Language

### Collection structure

**Collection Item**: An article (CollectionPage) or link (CollectionLink) that lives inside a collection. Both support tag assignment, including the migrated "Category" tag group (see below).
_Avoid_: article (when referring to both types), page (ambiguous)

**Collection Index**: The parent page of a collection. Stores the admin-defined taxonomy — Tag Categories — in its blob.
_Avoid_: collection page, index page (ambiguous across layouts)

### Taxonomy — categories

Category is no longer a distinct concept — it has been merged into an ordinary **Tag Category** group labelled `"Category"`, with multi-select replacing the old single-select constraint (see ADR 0003).

**Legacy Category** (`category`): The deprecated free-text string field on Collection Items. Preserved in blobs, and read only as a fallback when a Collection Item hasn't yet been migrated to the "Category" tag group.
_Avoid_: category (now ambiguous — prefer "legacy category" or "category string" when the distinction matters), Category Option, Category ID (an earlier, unshipped single-select replacement that this merge superseded)

### Taxonomy — tags

**Tag Category**: A named filter group defined by an Isomer Admin on a Collection Index. Contains ordered Tag Options. Can be marked required, meaning editors must select at least one option before publishing.
_Avoid_: filter category, tag group, tag type

**Tag Option**: A selectable value within a Tag Category, identified by a UUID and a label. Editors pick from Tag Options when tagging a Collection Item.
_Avoid_: tag, filter option, tag value

**Tagged** (`tagged`): The array of Tag Option UUIDs stored on a Collection Item representing the editor's selections across all Tag Categories.
_Avoid_: tags (the legacy resolved format using string labels), selected tags

### Roles and surfaces

**Isomer Admin**: A user with the Core or Migrator role. The only role that can manage taxonomy (create, edit, delete Tag Categories and Tag Options) via the Manage Filters panel.
_Avoid_: admin, site admin (different concept — refers to site-level admin permissions)
