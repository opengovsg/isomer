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

### Roles and surfaces

**Isomer Admin**: A user with the Core or Migrator role. The only role that can manage taxonomy (create, edit, delete Tag Categories, Tag Options, and Category Options) via the Manage Filters panel.
_Avoid_: admin, site admin (different concept — refers to site-level admin permissions)
