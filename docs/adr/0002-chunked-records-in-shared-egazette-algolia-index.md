# Chunked gazette records in the shared egazette Algolia index

We push gazette contents into the **same Algolia app/index the legacy egazette system uses**, following its record parameters. Each gazette's extracted PDF text is split into ~7000-byte chunks and **each chunk becomes its own Algolia record** (`objectID = ${objectGroup}-text-${idx}`). `objectGroup` is the gazette's S3 object key (`year/category/subcategory/filename.pdf`), identical to egazette's `objectKey`, so re-indexing the same gazette overwrites cleanly and never collides with egazette's existing records.

## Considered Options

- **A new isomer-owned index** — full control over schema and facets, but we would have to recreate egazette's searchable-attributes / facet / ranking config to match its search behaviour, and lose continuity with already-indexed gazettes.
- **One record per gazette (current SearchSG shape)** — simpler deletion (one id), but diverges from egazette's parameters and either truncates long PDFs or exceeds Algolia's ~10 KB record limit.
- **Reuse egazette's index, chunked, egazette-style (chosen)** — matches the existing index's configured behaviour field-for-field and indexes full PDF text.

## Consequences

- **The record schema is fixed by egazette.** Fields (`title`, `category`, `subCategory`, `notificationNum?`, `lexiNotificationNum?`, `publishDate`, `publishYear/Month/Day`, `publishTimestamp`, `fileUrl`, `objectGroup`, `text`) must match egazette exactly. Date fields are derived in **Asia/Singapore** (`toZonedTime`), and `lexiNotificationNum` is the notification number left-padded with zeroes to width 10.
- **Deletion is by `objectGroup`, not by record id.** The human delete flow calls `index.deleteBy({ filters: 'objectGroup:"<key>"' })` to remove all of a gazette's chunks in one call (count unknown at delete time).
- **Manual rollout prerequisite.** `deleteBy` needs `objectGroup` registered as `filterOnly(objectGroup)` in `attributesForFaceting`. This is added **manually in the Algolia dashboard, per environment**. Until it is set, `deleteBy` silently matches nothing — deletes must not be enabled before the facet exists.
- **The cron push path is add-only** — it never deletes. Because a `PushDocumentJob` row is processed once and then dropped, each gazette is pushed exactly once, so there is no automatic re-push to orphan stale chunks.
