# 4. database schema

Date: 2024-06-27

## Status

Accepted

## Context

We need to implement a database schema to store both our pages and folders in our db

## Decision

1. We will combine both page/folders into 1 schema and use a json blob to represent the content of the page instead of separating.
2. We will use an adjacency list method (via `parentId` inside our db) for our pages/folder to refer to their parents

## Consequences

1. no need to think about separation of pages/folders in our db. this will be done on code-level using `!!blobId`, which makes code changes easier going forward as there's less need to rerun migrations
2. using adjacency list means we don't need to acquire a lock on root + child when moving/renaming folders and files. for example, if we use a label tree method, a page with structure: A/B/C (c is the name of the page) has to lock the entire path
   when renaming. This is to prevent concurrent edits and thus, ending up with an inconsistent view of the file structure.

   for example, if i rename B to D (no lock now) whilst someone is renaming C to E, the end result could either be A/D and A/B/C (both go through)
   or A/C/E and A/D.
