---
title: Drive modals with useDisclosure, renamed on destructure
category: React
type: best-practice
---

## Pattern

Manage modal/dialog open state with Chakra's `useDisclosure` hook, not a
hand-rolled `useState` boolean. Destructure it immediately and alias the
generic `isOpen` / `onOpen` / `onClose` to names that say which modal they
drive (e.g. `isDeleteModalOpen`, `onDeleteModalOpen`, `onDeleteModalClose`).

## Why

`useDisclosure` already gives you the exact open/close API Chakra modals
expect, so re-implementing it with `useState` is redundant and easy to get
subtly wrong. When a component owns more than one modal, the bare `isOpen` /
`onOpen` names collide — aliasing on destructure keeps each disclosure
unambiguous at every call site.

## Bad

```tsx
const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
// ...
<Button onClick={() => setIsDeleteModalOpen(true)}>Delete</Button>
<DeleteModal
  isOpen={isDeleteModalOpen}
  onClose={() => setIsDeleteModalOpen(false)}
/>
```

## Good

```tsx
const {
  isOpen: isDeleteModalOpen,
  onOpen: onDeleteModalOpen,
  onClose: onDeleteModalClose,
} = useDisclosure()
// ...
<Button onClick={onDeleteModalOpen}>Delete</Button>
<DeleteModal isOpen={isDeleteModalOpen} onClose={onDeleteModalClose} />
```

## How to detect

Look for `useState(false)` paired with a `setX(true)` / `setX(false)` that
only toggles a modal/dialog — that should be `useDisclosure`. Also flag
`useDisclosure()` destructured to the bare `isOpen` / `onOpen` / `onClose`
when the component renders a modal (especially with more than one), since the
names should be aliased. Good reference:
`apps/studio/src/pages/sites/[siteId]/index.tsx:79`.
