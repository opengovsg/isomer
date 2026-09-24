# Gazette

The gazette feature lets authorised users (Toppan, core Isomer admins) publish government gazette PDFs as a searchable collection. Published gazettes are pushed into an external full-text **document index** so members of the public can search their contents.

## Language

**Gazette**:
A single published government document (a PDF) that lives as a CollectionLink resource under a gazette collection. One gazette has one PDF and one S3 object.
_Avoid_: Document (overloaded — see Search record), file, notice.

**Document index**:
The external full-text search index that holds the contents of published gazettes for public search. There are two possible backends — Algolia (default) and SearchSG — but only one is the live destination at a time.
_Avoid_: Algolia (the backend, not the index), search engine.

**Search record**:
One indexed unit inside the document index. A single gazette produces **many** search records — its extracted PDF text is split into chunks and each chunk becomes one record. All records for a gazette share an `objectGroup`.
_Avoid_: Document (a gazette is the document; a record is a chunk of it), entry, row.

**objectGroup**:
The stable identifier shared by every search record belonging to one gazette. It is the gazette's S3 object key (`year/category/subcategory/filename.pdf`). Used to find and remove all of a gazette's records together.
_Avoid_: documentId, group id.

**Notification number**:
The official reference number a gazette is published under. Optional — advertisements are published without one.
_Avoid_: Reference number, gazette number.

**Lexi notification number**:
The notification number left-padded with zeroes to a fixed width, used so notification numbers sort and match correctly in the document index. Derived from the notification number; absent when there is none.
_Avoid_: Padded number.
