# Table Cell Background Colour Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let Studio editors apply a provisional 6-swatch background colour to selected body table cells from `TableBubbleMenu`, persist via semantic tokens through TipTap JSON, and render on published sites via `packages/components`.

**Architecture:** Shared token→hex map exported from `@opengovsg/isomer-components`. Optional `backgroundColor` on `tableCell` attrs (schema + TipTap). Bubble menu swaps into an in-panel colour submenu. Apply command paints only `tableCell` nodes (skips headers).

**Tech Stack:** TipTap / prosemirror-tables, Chakra + design-system-react, TypeBox schemas, Storybook, Vitest (unit + browser).

**Spec:** `docs/superpowers/specs/2026-07-16-table-cell-background-colour-design.md`

## Global Constraints

- Tokens only: `"grey" | "blue" | "purple" | "red" | "green"` (never raw hex in JSON).
- Provisional hexes (shared map): grey `#F8F9F9`, blue `#E6EFFE`, purple `#EFE7FF`, red `#FBE9E9`, green `#E2EEED`.
- Never write `backgroundColor` onto `tableHeader` cells from the editor command.
- Hide “Background colour” when the selection has zero body (`tableCell`) nodes.
- Show the control for multi-cell, body row, and body column selections that include ≥1 body cell; not for header-row / header-column / ordinary single-cell / merged-cell-only menus.
- Submenu replaces bubble panel content (back + swatches); stay on submenu after apply; `mousedown` preventDefault to keep `CellSelection`.
- One Graphite branch/PR on top of current TableBubbleMenu branch (`gt create`).
- No new npm dependencies; no open colour picker.
- Follow area `CLAUDE.md` files (`apps/studio/src/features/CLAUDE.md`, `packages/components/CLAUDE.md`).

## File structure

| File | Responsibility |
| --- | --- |
| `packages/components/src/constants/tableCellBackgroundColor.ts` | Token type, hex map, token list |
| `packages/components/src/constants/index.ts` | Re-export |
| `packages/components/src/interfaces/native/Table.ts` | Optional enum attr on cell base schema |
| `packages/components/src/templates/next/components/native/Table/Table.tsx` | Apply background on body cells |
| `packages/components/src/templates/next/components/native/Table/Table.stories.tsx` | Story with each token |
| `apps/studio/.../hooks/useTextEditor/constants.ts` | TipTap `backgroundColor` on `IsomerTableCell` |
| `apps/studio/.../TableBubbleMenu/tableCellBackgroundColor.ts` | Apply/clear + “has body cell” helpers |
| `apps/studio/.../TableBubbleMenu/tableCellBackgroundColor.test.ts` | Unit tests for helpers |
| `apps/studio/.../TableBubbleMenu/TableBubbleMenu.tsx` | Colour entry + submenu UI |
| `apps/studio/.../TableBubbleMenu/TableBubbleMenu.browser.test.tsx` | Browser coverage for colour UX |

---

### Task 1: packages/components — palette, schema, renderer, Storybook

**Files:**
- Create: `packages/components/src/constants/tableCellBackgroundColor.ts`
- Modify: `packages/components/src/constants/index.ts`
- Modify: `packages/components/src/interfaces/native/Table.ts`
- Modify: `packages/components/src/templates/next/components/native/Table/Table.tsx`
- Modify: `packages/components/src/templates/next/components/native/Table/Table.stories.tsx`

**Interfaces:**
- Produces:
  ```ts
  export type TableCellBackgroundColorToken =
    | "grey"
    | "blue"
    | "purple"
    | "red"
    | "green"

  export const TABLE_CELL_BACKGROUND_COLOR_TOKENS: readonly TableCellBackgroundColorToken[]

  export const TABLE_CELL_BACKGROUND_COLORS: Record<
    TableCellBackgroundColorToken,
    string // hex including "#"
  >
  ```
- Schema: `attrs.backgroundColor` optional `Type.Union` of `Type.Literal` for each token on `TableBaseCellSchema`.
- Renderer: body cells with a token get `style={{ backgroundColor: TABLE_CELL_BACKGROUND_COLORS[token] }}` (or equivalent) in addition to existing `tableCellStyles` classes. Header cells ignore the attr even if present.

- [ ] **Step 1: Add the constant module + export**

```ts
// packages/components/src/constants/tableCellBackgroundColor.ts
export type TableCellBackgroundColorToken =
  | "grey"
  | "blue"
  | "purple"
  | "red"
  | "green"

export const TABLE_CELL_BACKGROUND_COLOR_TOKENS = [
  "grey",
  "blue",
  "purple",
  "red",
  "green",
] as const satisfies readonly TableCellBackgroundColorToken[]

export const TABLE_CELL_BACKGROUND_COLORS: Record<
  TableCellBackgroundColorToken,
  string
> = {
  grey: "#F8F9F9",
  blue: "#E6EFFE",
  purple: "#EFE7FF",
  red: "#FBE9E9",
  green: "#E2EEED",
}
```

Re-export from `packages/components/src/constants/index.ts`.

- [ ] **Step 2: Extend `TableBaseCellSchema`**

In `Table.ts`, extend the base object with:

```ts
backgroundColor: Type.Optional(
  Type.Union(
    [
      Type.Literal("grey"),
      Type.Literal("blue"),
      Type.Literal("purple"),
      Type.Literal("red"),
      Type.Literal("green"),
    ],
    {
      title: "Table cell background colour",
      description:
        "Semantic background colour token for a body cell. Header cells should not use this.",
    },
  ),
),
```

Keep it optional for backward compatibility.

- [ ] **Step 3: Render background in `Table.tsx`**

Import `TABLE_CELL_BACKGROUND_COLORS` and a type guard / lookup. On each cell, if `cell.type === "tableCell"` and `cell.attrs?.backgroundColor` is a known token, set `style={{ backgroundColor: TABLE_CELL_BACKGROUND_COLORS[token] }}` on the cell tag. Do not apply for `tableHeader`.

- [ ] **Step 4: Add Storybook story `WithBackgroundColours`**

One body row (or cells) demonstrating each token + one uncoloured cell. Reuse existing story `site` / caption patterns from `Simple`.

- [ ] **Step 5: Verify**

From `packages/components`: typecheck or story build as used in this repo (`pnpm typecheck` from root scoped, or package script). Confirm exports resolve.

- [ ] **Step 6: Commit** (on the feature branch created via `gt create` at plan start)

```bash
git add packages/components/src/constants/tableCellBackgroundColor.ts \
  packages/components/src/constants/index.ts \
  packages/components/src/interfaces/native/Table.ts \
  packages/components/src/templates/next/components/native/Table/Table.tsx \
  packages/components/src/templates/next/components/native/Table/Table.stories.tsx
git commit -m "$(cat <<'EOF'
feat(components): add table cell background colour tokens

Optional schema attr plus shared token→hex map and published-table rendering for provisional palette swatches.

EOF
)"
```

---

### Task 2: TipTap attribute + apply/clear helpers

**Files:**
- Modify: `apps/studio/src/features/editing-experience/hooks/useTextEditor/constants.ts`
- Create: `apps/studio/src/features/editing-experience/components/TableBubbleMenu/tableCellBackgroundColor.ts`
- Create: `apps/studio/src/features/editing-experience/components/TableBubbleMenu/tableCellBackgroundColor.test.ts`

**Interfaces:**
- Consumes: `TABLE_CELL_BACKGROUND_COLORS`, `TableCellBackgroundColorToken` from `@opengovsg/isomer-components`
- Produces:
  ```ts
  export const selectionHasBodyCell = (selection: CellSelection): boolean

  export const getUniformBodyCellBackgroundColor = (
    selection: CellSelection,
  ): TableCellBackgroundColorToken | null | "mixed"
  // null = all body cells cleared; token = uniform; "mixed" = disagree

  export const setSelectedBodyCellsBackgroundColor = (
    editor: Editor,
    color: TableCellBackgroundColorToken | null,
  ): void
  // null clears; skips tableHeader nodes
  ```

- [ ] **Step 1: Write failing unit tests** for `selectionHasBodyCell`, `getUniformBodyCellBackgroundColor`, and that `setSelectedBodyCellsBackgroundColor` only updates `tableCell` nodes.

Prefer testing pure helpers against a minimal ProseMirror/TipTap doc (follow patterns in `TableBubbleMenu.utils.test.ts`). If constructing `CellSelection` needs a live editor, use a small browser-free doc builders approach already used in the feature — otherwise keep apply logic testable by iterating a fake `forEachCell` callback extracted for testing. Target: at least (1) body-only selection returns true for `selectionHasBodyCell`, (2) header-only returns false, (3) set skips headers when mixed selection includes them.

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd apps/studio && pnpm test:unit -- src/features/editing-experience/components/TableBubbleMenu/tableCellBackgroundColor.test.ts
```

- [ ] **Step 3: Implement TipTap attribute on `IsomerTableCell`**

```ts
export const IsomerTableCell = TableCell.extend({
  content: "(paragraph|list)+",
  addAttributes() {
    return {
      backgroundColor: {
        default: null,
        parseHTML: (element) =>
          element.getAttribute("data-background-color") || null,
        renderHTML: (attributes) => {
          if (!attributes.backgroundColor) return {}
          const token = attributes.backgroundColor as TableCellBackgroundColorToken
          const hex = TABLE_CELL_BACKGROUND_COLORS[token]
          if (!hex) return {}
          return {
            "data-background-color": token,
            style: `background-color: ${hex}`,
          }
        },
      },
    }
  },
})
```

Do **not** add the attribute to `IsomerTableHeader`.

- [ ] **Step 4: Implement helpers in `tableCellBackgroundColor.ts`**

Use `CellSelection.forEachCell` + `editor.view.dispatch` / `tr.setNodeMarkup` (or TipTap `updateAttributes` per cell carefully — prefer a single transaction that updates each body cell). Clearing sets attr to `null`.

- [ ] **Step 5: Run unit tests — expect PASS**

- [ ] **Step 6: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(studio): tip tap table cell backgroundColor attr and helpers

Persist semantic colour tokens on body cells and skip headers when applying a selection colour.

EOF
)"
```

---

### Task 3: Bubble menu colour entry + submenu + browser tests

**Files:**
- Modify: `apps/studio/src/features/editing-experience/components/TableBubbleMenu/TableBubbleMenu.tsx`
- Modify: `apps/studio/src/features/editing-experience/components/TableBubbleMenu/TableBubbleMenu.browser.test.tsx`

**Interfaces:**
- Consumes helpers from Task 2 and token map from components.
- UI state: local `panel: "actions" | "colour"` reset when selection kind changes / menu hides.

- [ ] **Step 1: Write failing browser tests**

Add cases (reuse harness/`selectCells`):
1. Multi-cell body selection shows “Background colour”; click opens submenu with “Back” and swatch named “Blue” (or `aria-label`); click Blue; assert a selected body cell’s DOM has `data-background-color="blue"` (or matching background).
2. Header row selection does **not** show “Background colour”.
3. Body row selection shows “Background colour”.

- [ ] **Step 2: Run browser test file — expect new cases FAIL**

```bash
cd apps/studio && pnpm test:unit -- src/features/editing-experience/components/TableBubbleMenu/TableBubbleMenu.browser.test.tsx
```

- [ ] **Step 3: Implement UI in `TableBubbleMenu.tsx`**

- Detect `canSetBackgroundColour = selectionHasBodyCell(...)` when kind is `multi-cell` | `row` | `column` (not `header-row` | `header-column` | `table` | `merged-cell` | `single-cell`). For `row`/`column` that somehow are all headers, helper returns false → hide.
- Root: `ActionButton` “Background colour” when `canSetBackgroundColour`, placed with merge on multi-cell (merge first, divider, colour — or colour under merge).
- `panel === "colour"`: Back button + horizontal/grid of swatches:
  - None (clear) — label “None” / “Clear”
  - Each token — circular/square swatch with `aria-label` matching colour name; `backgroundColor` from map; outline when active via `getUniformBodyCellBackgroundColor === token` (or null for None).
- Stay on colour panel after click.
- `onMouseDown={(e) => e.preventDefault()}` on swatch buttons / back.

Keep `shouldShowTableBubbleMenu` as a stable module-level function.

- [ ] **Step 4: Run browser tests — expect PASS**

- [ ] **Step 5: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(studio): table bubble menu background colour submenu

Add in-panel swatch picker for multi-cell and body row/column selections.

EOF
)"
```

---

## Spec coverage checklist

| Spec requirement | Task |
| --- | --- |
| Shared token map export | 1 |
| Optional schema attr | 1 |
| Published render | 1 |
| Storybook | 1 |
| TipTap attr on cell only | 2 |
| Apply skips headers | 2 |
| Unit test skip headers | 2 |
| Bubble entry + submenu | 3 |
| Hide when no body cells / header-row | 3 |
| Browser tests | 3 |
| Single Graphite PR | branch created once before Task 1 |

## Execution

Before Task 1:

```bash
gt create -m "feat: table cell background colour"
```

(or equivalent stack create on current branch parent)
