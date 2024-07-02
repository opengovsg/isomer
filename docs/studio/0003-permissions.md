# 3. permissions

Date: 2024-06-27

## Status

Accepted

## Context

We need to implement a permissions model for our application. Specifically, the list of permissions required are:

1. publishing of pages
2. editing of pages
3. adding/deletion of users

Number 1/2 will only be enforced at the root folders of the site, and all sub-folders/pages will instead inherit their permissions from their root-level folder.
For example, the site has the structure (A -> B -> C), such that A is the root level folder. Both B and C will not have permissions tied to them and will instead use the permissions linked to A.

## Decision

We will use role-based access control for our permissions model, and we will use [casl](https://casl.js.org/v6/en/) for the implementation of the library

## Consequences

Adding finer grained roles will involve creating new roles but this is a trade-off we're ok with because we don't see roles changing often or the actual list of permissions changing often
