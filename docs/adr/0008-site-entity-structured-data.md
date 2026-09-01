# 0008: Represent site-level entities with linked Schema.org JSON-LD

## Status

Accepted

## Context

Isomer sites already publish a Schema.org `WebSite` JSON-LD object. That object
identifies the website, but it does not describe the organisation responsible
for the site. Site configuration already contains the site name, agency name,
canonical URL, logo, and government status. The footer separately contains the
contact-page link and official social-media profiles.

Editors also need a structured way to provide metadata that cannot be derived:
the organisation subtype, description, postal address, and contact details.

## Decision

The base template will publish one JSON-LD document with an `@graph` containing:

- a `WebSite` node with a stable `#website` identifier; and
- an organisation node with a stable `#organization` identifier, linked from
  `WebSite.publisher`.

Each rendered page will also publish a `WebPage` node. It reuses the page title,
the same derived or explicitly configured description used by HTML metadata, the
canonical URL, language, and last-modified date. Stable `isPartOf` and
`publisher` references connect it to the site-wide `WebSite` and organisation
nodes. This page metadata does not introduce additional editor configuration.

The supported organisation types are `Organization`,
`GovernmentOrganization`, `EducationalOrganization`, and `NGO`. If an editor
does not select a type, government sites use `GovernmentOrganization` and
non-government sites use `Organization`.

The organisation node reuses these existing settings:

- `agencyName` (falling back to `siteName`) for `name`;
- `url` for `url` and the stable node identifiers;
- `logoUrl` for `logo`;
- footer `socialMediaLinks` for `sameAs`; and
- footer `contactUsLink` for `contactPoint.url` when it is a resolvable URL.

The optional `siteEntity` site setting provides `description`, a
`PostalAddress`, and a `ContactPoint` containing contact type, telephone, and
email. Empty optional values are omitted from the serialized JSON-LD. Relative
logo URLs are resolved against the generated site's asset base URL when one is
configured, falling back to the site URL; relative contact URLs are resolved
against the site URL. Studio exposes these fields under **Settings → Name and
agency**.

## Consequences

Existing site configurations remain valid because `siteEntity` is optional.
All generated sites receive consistent linked website and organisation nodes,
plus a linked entity describing each page. Richer organisation properties
appear only when an editor has configured them. Footer social and contact
settings remain the single source of truth for their corresponding
structured-data properties, while page HTML metadata and page JSON-LD share the
same source fields and fallback logic.
