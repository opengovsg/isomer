# Publishing Tooling Scripts

Note: This is a NPM project which is executed at build time of end sites.

To start, clone `.env.template` to `.env` and populate with the respective values.

`pnpm run generate-rss` writes collection feeds after the template build. It
reads `SITEMAP_JSON` and `CONFIG_JSON` and writes to `OUT_DIR`.
