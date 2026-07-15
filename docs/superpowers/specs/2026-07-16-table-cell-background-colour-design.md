# Table cell background colour — design

Date: 2026-07-16  
Source decisions: `rte-table-ux/issues/12-grilling-background-colour-palette-rules.md`, content matrix from ticket 06  
Branch base: `07-15-feat_rte-table_add_contextual_tablebubblemenu_for_table_actions`

## Goal

Let editors apply a contrast-safe background colour to selected **body** table cells from the contextual table bubble menu, with colour persisting through publish via `packages/components`.

## Decisions locked

| Topic | Decision |
| --- | --- |
| Persistence scope | Full stack: Studio TipTap + `packages/components` schema/render |
| Storage format | Semantic tokens (`grey`, `blue`, `purple`, `red`, `green`); clear = omit/`null` |
| Shared palette | Single map exported from `packages/components`; Studio imports it for swatches |
| Apply scope | Per-cell on every selected `tableCell`; **never** write colour onto `tableHeader` |
| Header-only selection | Hide “Background colour” when the selection has no body cells |
| Mixed selection (headers + body) | Control still available; paint body cells only |
| When control appears | Any bubble-menu selection that includes ≥1 body cell: multi-cell, body row, body column (not header-row / header-column / all-header; not ordinary single-cell; not merged-cell-only split menu) |
| Palette (provisional) | None + Grey `#F8F9F9`, Blue `#E6EFFE`, Purple `#EFE7FF`, Red `#FBE9E9`, Green `#E2EEED` |
| Delivery | **One Graphite PR** stacked on the existing TableBubbleMenu branch (schema + TipTap + UI combined for now) |

## Architecture

### Data model

- Add optional `backgroundColor` to `TableBaseCellSchema` / cell attrs in `packages/components/src/interfaces/native/Table.ts`, constrained to the token enum (or absent).
- Attribute applies meaningfully only on `tableCell`. Header cells ignore / never receive it from the editor command.
- Export e.g. `TABLE_CELL_BACKGROUND_COLORS: Record<Token, hex>` (plus token union type) from the package public surface so Studio does not duplicate hexes.

### Published renderer

- `Table.tsx` reads `cell.attrs?.backgroundColor`, looks up the shared map, and applies `background-color` on body `<td>`s (inline style or `tv` variant). Header styling (ticket 05 grey fill) is unchanged and is not overridden by this attr.

### Studio TipTap

- `IsomerTableCell.addAttributes()` adds `backgroundColor` mirroring the schema (parse from DOM / render for editor canvas so colours are visible while editing).
- Command: given current `CellSelection`, for each selected cell node that is `tableCell`, set or clear `backgroundColor`. Skip `tableHeader` nodes.

### Bubble menu UI

- Root action: “Background colour” (icon / current-swatch affordance) when the control should show.
- Submenu lives **inside the same bubble panel** (replace content, not a nested popover):
  - Back control → root actions
  - Six swatches: None + five tokens (accessible names)
  - Active state when all painted body cells in the selection share one token; otherwise no single swatch marked active
- Swatch click applies colour and **stays on the submenu**.
- `mousedown` `preventDefault` on controls so `CellSelection` is preserved (same pattern as header toggle).

## Testing

- **packages/components**: Storybook coverage for each token (+ none); schema accepts optional enum / rejects unknown values if covered by existing engine tests patterns.
- **Studio**: unit test that set/clear skips header cells; browser test that opens the colour submenu from a multi-cell (and optionally body-row) selection, applies a swatch, and asserts visible background / attr; asserts control hidden for header-row selection.

## Out of scope

- Open / custom colour picker and live contrast-checking against arbitrary hex
- Final designer palette (replace shared map hexes later without changing JSON token keys)
- Allowing `tableHeader` cells to carry background colour
- Column-width, drag-handle, and other RTE table UX tickets

## Graphite landing

Single `gt create` on top of the current TableBubbleMenu branch, one PR covering components schema/map/render + TipTap attr/command + bubble submenu UI + tests. Can be split later if review prefers.
