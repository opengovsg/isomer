---
title: Don't Storybook TipTap overlays in isolation
category: Testing
type: smell
---

## Pattern

Do not add a standalone Storybook story for TipTap/editor-contextual UI
(bubble menus, inline captions, selection-driven overlays, etc.). Cover the
behaviour with a `*.browser.test.tsx` that mounts a real editor, and — when
visual review is needed — story the parent editor surface once the overlay is
wired into it, not the overlay alone.

## Why

These components only make sense inside a live ProseMirror selection and
layout. An isolated harness still needs a full editor, fake CellSelections, and
play-function gymnastics, yet still fails to show how the overlay sits relative
to the toolbar, document chrome, and other menus. That cost buys weak
Chromatic signal and duplicates what the browser test already asserts.

## Bad

```tsx
// TableBubbleMenu.stories.tsx — harness + play functions that forge
// CellSelections just to snapshot a floating menu out of context
const TableBubbleMenuHarness = () => {
  const editor = useTextEditor({ data: SEED_CONTENT, handleChange: () => null })
  return (
    <Box>
      {editor && <TableBubbleMenu editor={editor} />}
      {editor && <EditorContent editor={editor} />}
    </Box>
  )
}
```

## Good

```tsx
// TableBubbleMenu.browser.test.tsx — real editor, assert action matrix
it("shows row actions when a body row is selected", async () => {
  // Arrange
  const { editor, getByText, queryByText } = renderHarness()
  // Act
  editor.commands.setCellSelection({ anchorCell, headCell })
  // Assert
  await waitFor(() => expect(getByText("Delete row")).toBeInTheDocument())
  expect(queryByText("Delete table")).not.toBeInTheDocument()
})
```

Once the overlay is mounted in `TiptapTextEditor` / friends, prefer a story of
that editor (with seeded table content) over a story of the overlay itself.

## How to detect

Flag new `*.stories.tsx` files whose component is a TipTap `BubbleMenu`, an
inline node view that depends on editor selection, or any harness that exists
only to host `EditorContent` + the overlay. Look for play functions that call
`setCellSelection` / `setTextSelection` to force the story into a state.
Existing offender this entry removes: `TableBubbleMenu.stories.tsx`. Prefer
`*.browser.test.tsx` next to the component instead (see
`TableBubbleMenu.browser.test.tsx`).
