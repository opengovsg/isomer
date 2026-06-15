# Backfill blockquote `style`

The Blockquote block gained a `Style` control ("With image" / "Without image"),
modelled as a discriminated union with a required `style` discriminator. Existing
blockquotes were stored without `style`, so this script backfills it:

- Blockquotes with an `imageSrc` become `style: "image"`.
- Blockquotes without an image become `style: "imageless"`, and any dangling
  `imageSrc`/`imageAlt` (e.g. a leftover placeholder alt text) is stripped.

The script is idempotent and dry-runnable.

## Running

See the parent [`README.md`](../README.md) for the jump-host setup. Then:

```bash
# Dry run (default) — only logs what would change
source .env && pnpm exec tsx prisma/scripts/backfill-blockquote-style/backfillBlockquoteStyle.ts

# Apply the changes
source .env && pnpm exec tsx prisma/scripts/backfill-blockquote-style/backfillBlockquoteStyle.ts --apply
```
