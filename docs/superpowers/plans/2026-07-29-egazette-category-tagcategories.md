# Egazette category → tagCategories Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate egazette's `category` field from a plain string (`content.page.category`) onto the tagCategories model, so both `category` and `subcategory` selections live as uuids in `content.page.tagged`, matching the spec at `docs/superpowers/specs/2026-07-29-egazette-category-tagcategories-migration-design.md`.

**Architecture:** A new `"Category"` tagCategory (label matched via `GAZETTE_CATEGORY_LABEL`) sits alongside the existing `"Sub-category"` one. `content.page.tagged` holds two uuids per egazette item (order-independent, matched by membership against each tagCategory's `options`). The write path threads `categoryId` (uuid) and a transient `categoryLabel` (string, resolved client-side, used only for the `isGovernmentGazette` business rule and never persisted) separately through create/update, merging into one `tagged` array only at the point of blob construction — this avoids adding any new DB round-trip to the write path. Read paths (list sort, dedup query) match by jsonb containment on `tagged` instead of string equality on the old `category` column. The cron ingestion job resolves both labels via a new `resolveGazetteTagLabels` helper.

**Tech Stack:** Next.js 15, tRPC, Zod, Kysely (Postgres/jsonb), React Hook Form, Vitest (unit + integration), MSW (Storybook mocks).

## Global Constraints

- No data backfill or migration script in this branch — assumes `feat/category-tagcategories-migration-script` has already seeded a `"Category"` tagCategory and backfilled existing egazette resources' `tagged` arrays before this branch is merged/deployed (hard cutover, no fallback to the legacy `content.page.category` string).
- New tag category label convention: `GAZETTE_CATEGORY_LABEL = "Category"`, mirroring the existing `GAZETTE_SUBCATEGORY_LABEL = "Sub-category"`.
- Every step that changes code must show the exact code — no "similar to above" placeholders.
- Run `pnpm typecheck` and the affected test files after each task; do not move to the next task with a red suite.

---

### Task 1: Shared label resolver + `GAZETTE_CATEGORY_LABEL` constant

**Files:**
- Modify: `apps/studio/src/features/gazettes/constants.ts`
- Modify: `apps/studio/src/server/modules/gazette/gazette.service.ts`
- Test: `apps/studio/src/server/modules/gazette/__tests__/gazette.service.test.ts`

**Interfaces:**
- Produces: `GAZETTE_CATEGORY_LABEL: string` (exported from `constants.ts`), `resolveGazetteTagLabels(input: { tagged: string[]; tagCategories: { label: string; options: { id: string; label: string }[] }[] }): { categoryLabel?: string; subcategoryLabel?: string }` (exported from `gazette.service.ts`)

- [ ] **Step 1: Add the `GAZETTE_CATEGORY_LABEL` constant**

In `apps/studio/src/features/gazettes/constants.ts`, add directly above the existing `GAZETTE_SUBCATEGORY_LABEL`:

```ts
export const GAZETTE_CATEGORY_LABEL = "Category"

export const GAZETTE_SUBCATEGORY_LABEL = "Sub-category"
```

- [ ] **Step 2: Write the failing test for `resolveGazetteTagLabels`**

Add to `apps/studio/src/server/modules/gazette/__tests__/gazette.service.test.ts`, inside the top-level `describe("gazette.service", ...)` block (after the `assertGazetteAccess` describe block):

```ts
  describe("resolveGazetteTagLabels", () => {
    const TAG_CATEGORIES = [
      {
        label: GAZETTE_CATEGORY_LABEL,
        options: [
          { id: "cat-gov", label: "Government Gazette" },
          { id: "cat-leg", label: "Legislative Supplements" },
        ],
      },
      {
        label: GAZETTE_SUBCATEGORY_LABEL,
        options: [
          { id: "sub-notices", label: "Notices under other Acts" },
          { id: "sub-appointments", label: "Appointments" },
        ],
      },
    ]

    it("resolves both labels when tagged contains one uuid from each tagCategory", () => {
      const result = resolveGazetteTagLabels({
        tagged: ["sub-appointments", "cat-gov"],
        tagCategories: TAG_CATEGORIES,
      })

      expect(result).toEqual({
        categoryLabel: "Government Gazette",
        subcategoryLabel: "Appointments",
      })
    })

    it("leaves categoryLabel undefined when tagged has no matching category option", () => {
      const result = resolveGazetteTagLabels({
        tagged: ["sub-notices"],
        tagCategories: TAG_CATEGORIES,
      })

      expect(result).toEqual({
        categoryLabel: undefined,
        subcategoryLabel: "Notices under other Acts",
      })
    })

    it("returns both undefined when tagCategories has no matching labels", () => {
      const result = resolveGazetteTagLabels({
        tagged: ["cat-gov", "sub-notices"],
        tagCategories: [],
      })

      expect(result).toEqual({
        categoryLabel: undefined,
        subcategoryLabel: undefined,
      })
    })
  })
```

Add the two new imports at the top of the test file:

```ts
import {
  GAZETTE_CATEGORY_LABEL,
  GAZETTE_SUBCATEGORY_LABEL,
} from "~/features/gazettes/constants"
```

and add `resolveGazetteTagLabels` to the existing import from `../gazette.service`:

```ts
import {
  assertGazetteAccess,
  buildGazetteSearchRecords,
  copyFileWithNewName,
  getPresignedPutUrl,
  removeGazetteFromAlgolia,
  resolveGazetteTagLabels,
} from "../gazette.service"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter studio test:unit -- src/server/modules/gazette/__tests__/gazette.service.test.ts -t "resolveGazetteTagLabels"`
Expected: FAIL with "resolveGazetteTagLabels is not a function" or a TypeScript error that the export doesn't exist.

- [ ] **Step 3: Implement `resolveGazetteTagLabels`**

In `apps/studio/src/server/modules/gazette/gazette.service.ts`, add the import (extend the existing constants import):

```ts
import {
  GAZETTE_CATEGORY_LABEL,
  GAZETTE_SUBCATEGORY_LABEL,
  GazetteCategories,
} from "~/features/gazettes/constants"
```

Add this new exported function and type near the top of the file (after imports, before `createCollectionLinkJson`/other exports — place it right above `hasDuplicateNotificationNumber` since they're related):

```ts
export interface GazetteTagCategoryOption {
  id: string
  label: string
}

export interface GazetteTagCategory {
  label: string
  options: GazetteTagCategoryOption[]
}

/**
 * Resolves the human-readable category and subcategory labels for a gazette
 * item's `tagged` uuids by matching each against the tagCategory whose
 * `label` is `GAZETTE_CATEGORY_LABEL` / `GAZETTE_SUBCATEGORY_LABEL`.
 * Matches by option-uuid membership, not by array position, since `tagged`
 * holds one uuid per tagCategory in no particular order.
 */
export const resolveGazetteTagLabels = ({
  tagged,
  tagCategories,
}: {
  tagged: string[]
  tagCategories: GazetteTagCategory[]
}): { categoryLabel?: string; subcategoryLabel?: string } => {
  const categoryTagCategory = tagCategories.find(
    (tagCategory) => tagCategory.label === GAZETTE_CATEGORY_LABEL,
  )
  const subcategoryTagCategory = tagCategories.find(
    (tagCategory) => tagCategory.label === GAZETTE_SUBCATEGORY_LABEL,
  )

  const categoryLabel = categoryTagCategory?.options.find((option) =>
    tagged.includes(option.id),
  )?.label
  const subcategoryLabel = subcategoryTagCategory?.options.find((option) =>
    tagged.includes(option.id),
  )?.label

  return { categoryLabel, subcategoryLabel }
}
```

Note: `GazetteCategories` is added to the import here because Task 6 (dedup query) will need it in this same file — if it's already imported lower in the file from a previous version, do not duplicate the import; merge into the single existing `~/features/gazettes/constants` import statement.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter studio test:unit -- src/server/modules/gazette/__tests__/gazette.service.test.ts -t "resolveGazetteTagLabels"`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/studio/src/features/gazettes/constants.ts apps/studio/src/server/modules/gazette/gazette.service.ts apps/studio/src/server/modules/gazette/__tests__/gazette.service.test.ts
git commit -m "feat(gazette): add GAZETTE_CATEGORY_LABEL and resolveGazetteTagLabels"
```

---

### Task 2: Extend `GazetteSubcategoriesContext` with categories/categoryMap

**Files:**
- Modify: `apps/studio/src/features/gazettes/contexts/GazetteSubcategoriesContext.tsx`

**Interfaces:**
- Consumes: `GAZETTE_CATEGORY_LABEL` from Task 1.
- Produces: `GazetteSubcategoriesContextValue` gains `categories: { label: string; value: string }[]` and `categoryMap: Record<string, string>`. Existing `subcategories`, `subcategoryMap`, `getSubcategoriesForCategory` are unchanged in shape.

- [ ] **Step 1: Extend the context value and provider**

Replace the full contents of `apps/studio/src/features/gazettes/contexts/GazetteSubcategoriesContext.tsx` with:

```tsx
import type { PropsWithChildren } from "react"
import { filter } from "lodash-es"
import { createContext, useContext, useMemo } from "react"
import { trpc } from "~/utils/trpc"

import type { GazettesCategory } from "../types"
import {
  GAZETTE_CATEGORY_LABEL,
  GAZETTE_SUBCATEGORY_LABEL,
  governmentGazetteSubcategoriesKeys,
  legislativeSupplementsSubcategoriesKeys,
  otherSupplementsSubcategoriesKeys,
} from "../constants"

interface GazetteSubcategoriesContextValue {
  categories: { label: string; value: string }[]
  categoryMap: Record<string, string>
  subcategories: { label: string; value: string }[]
  subcategoryMap: Record<string, string>
  getSubcategoriesForCategory: (category: GazettesCategory) => {
    label: string
    value: string
  }[]
}

const GazetteSubcategoriesContext =
  createContext<GazetteSubcategoriesContextValue | null>(null)

interface GazetteSubcategoriesProviderProps {
  siteId: number
  gazettesCollectionId: number
}

export const GazetteSubcategoriesProvider = ({
  children,
  siteId,
  gazettesCollectionId,
}: PropsWithChildren<GazetteSubcategoriesProviderProps>) => {
  const [tagCategories] = trpc.collection.getCollectionTags.useSuspenseQuery({
    siteId,
    collectionId: gazettesCollectionId,
  })

  const value = useMemo(() => {
    const categoryCategory = tagCategories?.find(
      (cat) => cat.label === GAZETTE_CATEGORY_LABEL,
    )
    const subcategoryCategory = tagCategories?.find(
      (cat) => cat.label === GAZETTE_SUBCATEGORY_LABEL,
    )

    const categories =
      categoryCategory?.options?.map((option) => ({
        label: option.label,
        value: option.id,
      })) ?? []

    const categoryMap = Object.fromEntries(
      categories.map(({ value, label }) => [value, label]),
    ) as Record<string, string>

    const subcategories =
      subcategoryCategory?.options?.map((option) => ({
        label: option.label,
        value: option.id,
      })) ?? []

    const subcategoryMap = Object.fromEntries(
      subcategories.map(({ value, label }) => [value, label]),
    ) as Record<string, string>

    const getSubcategoriesForCategory = (category: GazettesCategory) => {
      switch (category) {
        case "Government Gazette": {
          return filter(subcategories, ({ label }) => {
            return governmentGazetteSubcategoriesKeys.some(
              (key) => key === label,
            )
          })
        }
        case "Other Supplements": {
          return filter(subcategories, ({ label }) => {
            return otherSupplementsSubcategoriesKeys.some(
              (key) => key === label,
            )
          })
        }

        case "Legislative Supplements": {
          return filter(subcategories, ({ label }) => {
            return legislativeSupplementsSubcategoriesKeys.some(
              (key) => key === label,
            )
          })
        }
      }
    }
    return {
      categories,
      categoryMap,
      subcategories,
      subcategoryMap,
      getSubcategoriesForCategory,
    }
  }, [tagCategories])

  return (
    <GazetteSubcategoriesContext.Provider value={value}>
      {children}
    </GazetteSubcategoriesContext.Provider>
  )
}

export const useGazetteSubcategoriesContext =
  (): GazetteSubcategoriesContextValue => {
    const context = useContext(GazetteSubcategoriesContext)
    if (!context) {
      throw new Error(
        "useGazetteSubcategoriesContext must be used within GazetteSubcategoriesProvider",
      )
    }
    return context
  }
```

- [ ] **Step 2: Update the MSW fixture so the context has a "Category" tagCategory to resolve**

In `apps/studio/tests/msw/handlers/gazette.ts`, add the import and a second tagCategory entry. Change:

```ts
import {
  GAZETTE_SUBCATEGORY_LABEL,
  governmentGazetteSubcategories,
} from "~/features/gazettes/constants"
```

to:

```ts
import {
  GAZETTE_CATEGORY_LABEL,
  GAZETTE_SUBCATEGORY_LABEL,
  GazetteCategories,
  governmentGazetteSubcategories,
} from "~/features/gazettes/constants"
```

and change the `GAZETTE_TAG_CATEGORIES` array to:

```ts
const GAZETTE_TAG_CATEGORIES = [
  {
    label: GAZETTE_CATEGORY_LABEL,
    id: "1e02b2c3-58cc-4372-a567-f47ac10b3d46",
    display: DEFAULT_TAG_CATEGORY_DISPLAY,
    options: Object.values(GazetteCategories).map((label, index) => ({
      label,
      id: `6ba7b810-9dad-11d1-80b4-00c04fd4310${String(index).padStart(2, "0")}`,
    })),
  },
  {
    label: GAZETTE_SUBCATEGORY_LABEL,
    id: "0e02b2c3-58cc-4372-a567-f47ac10b3d47",
    display: DEFAULT_TAG_CATEGORY_DISPLAY,
    options: Object.values(governmentGazetteSubcategories).map(
      (label, index) => ({
        label,
        id: `6ba7b810-9dad-11d1-80b4-00c04fd430${String(index).padStart(2, "0")}`,
      }),
    ),
  },
]
```

- [ ] **Step 3: Verify in Storybook**

Run: `pnpm --filter studio storybook`
Open the `CreateGazetteModal` and `ModifyGazetteModal` stories. Expected: they render without throwing (the context still resolves `subcategories`/`subcategoryMap` correctly — nothing consumes `categories`/`categoryMap` yet, so behavior is unchanged at this point). This is a manual visual check, not an automated assertion — confirm no console errors.

- [ ] **Step 4: Run the full gazette test suite to confirm nothing broke**

Run: `pnpm --filter studio test:unit -- src/features/gazettes`
Expected: PASS (no gazette feature unit tests exist yet beyond what Task 1 added, but this confirms no import/type errors)

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/studio/src/features/gazettes/contexts/GazetteSubcategoriesContext.tsx apps/studio/tests/msw/handlers/gazette.ts
git commit -m "feat(gazette): resolve Category tagCategory in GazetteSubcategoriesContext"
```

---

### Task 3: Studio Create/Modify UI — category becomes tag-driven

**Files:**
- Modify: `apps/studio/src/features/gazettes/components/GazetteModal/GazetteFormFields.tsx`
- Modify: `apps/studio/src/features/gazettes/components/CreateGazetteModal/CreateGazetteModal.tsx`
- Modify: `apps/studio/src/features/gazettes/components/ModifyGazetteModal/ModifyGazetteModal.tsx`

**Interfaces:**
- Consumes: `useGazetteSubcategoriesContext()` now returning `categories`/`categoryMap` (Task 2).
- Produces: form's `category` field now holds a tag-option **uuid** instead of a label string. `createGazette`/`updateGazette` mutation calls now send `categoryId`/`categoryLabel` instead of `category` (server side change lands in Task 5/6 — this task's mutation calls will not type-check until Task 5 lands; that's expected and called out below).

- [ ] **Step 1: Update `GazetteFormFields.tsx` to source Category options from context**

In `apps/studio/src/features/gazettes/components/GazetteModal/GazetteFormFields.tsx`, remove the static import:

```ts
import { GAZETTE_CATEGORIES } from "../../constants"
```

and change:

```ts
  const { getSubcategoriesForCategory } = useGazetteSubcategoriesContext()
  const category = useWatch({ control, name: "category" })
```

to:

```ts
  const { categories, categoryMap, getSubcategoriesForCategory } =
    useGazetteSubcategoriesContext()
  const category = useWatch({ control, name: "category" })
  const categoryLabel = categoryMap[category] ?? category
```

and change the Category `SingleSelect`'s `items` prop from:

```tsx
              items={GAZETTE_CATEGORIES}
```

to:

```tsx
              items={categories}
```

and change the Subcategory `SingleSelect`'s `items` prop from:

```tsx
              items={getSubcategoriesForCategory(category as GazettesCategory)}
```

to:

```tsx
              items={getSubcategoriesForCategory(
                categoryLabel as GazettesCategory,
              )}
```

- [ ] **Step 2: Update `CreateGazetteModal.tsx` to submit uuids and resolve labels**

In `apps/studio/src/features/gazettes/components/CreateGazetteModal/CreateGazetteModal.tsx`, change:

```ts
  const { subcategoryMap } = useGazetteSubcategoriesContext()
```

to:

```ts
  const { categories, categoryMap, subcategoryMap } =
    useGazetteSubcategoriesContext()
```

Change the `defaultValues.category` default from the hardcoded label to the resolved default option's uuid — replace:

```ts
    defaultValues: {
      title: "",
      category: "Government Gazette",
      subcategory: "",
```

with:

```ts
    defaultValues: {
      title: "",
      category:
        categories.find(
          ({ label }) => label === GazetteCategories.GovernmentGazettes,
        )?.value ?? "",
      subcategory: "",
```

Add the import:

```ts
import { GazetteCategories } from "~/features/gazettes/constants"
```

Change the `onSubmit` body — replace:

```ts
      const { path: ref } = await uploadFile({
        file,
        fileName: data.fileId,
        scheduledAt,
        year: data.publishDate.getFullYear(),
        category: data.category,
        subcategory: subcategoryMap[data.subcategory] ?? data.subcategory,
      })

      await createGazette({
        siteId,
        collectionId,
        title: data.title,
        permalink: crypto.randomUUID(),
        ref,
        category: data.category,
        date: format(data.publishDate, "dd/MM/yyyy"),
        description: data.notificationNumber,
        tagged: [data.subcategory],
        scheduledAt,
      })
```

with:

```ts
      const categoryLabel = categoryMap[data.category] ?? data.category

      const { path: ref } = await uploadFile({
        file,
        fileName: data.fileId,
        scheduledAt,
        year: data.publishDate.getFullYear(),
        category: categoryLabel,
        subcategory: subcategoryMap[data.subcategory] ?? data.subcategory,
      })

      await createGazette({
        siteId,
        collectionId,
        title: data.title,
        permalink: crypto.randomUUID(),
        ref,
        categoryId: data.category,
        categoryLabel,
        date: format(data.publishDate, "dd/MM/yyyy"),
        description: data.notificationNumber,
        tagged: [data.subcategory],
        scheduledAt,
      })
```

- [ ] **Step 3: Update `ModifyGazetteModal.tsx` the same way**

In `apps/studio/src/features/gazettes/components/ModifyGazetteModal/ModifyGazetteModal.tsx`, change:

```ts
  const { subcategoryMap } = useGazetteSubcategoriesContext()
```

to:

```ts
  const { categoryMap, subcategoryMap } = useGazetteSubcategoriesContext()
```

Replace the upload + update calls — change:

```ts
      if (newFile) {
        const { path } = await uploadFile({
          file: newFile,
          fileName: data.fileId,
          scheduledAt,
          year: data.publishDate.getFullYear(),
          category: data.category,
          subcategory: subcategoryMap[data.subcategory] ?? data.subcategory,
        })
        newRef = path
      } else if (initialData.fileKey && initialData.fileId !== data.fileId) {
        desiredFileName = data.fileId
      }

      await updateGazette({
        siteId,
        gazetteId: Number(gazetteId),
        title: data.title,
        newRef,
        desiredFileName,
        category: data.category,
        date: format(data.publishDate, "dd/MM/yyyy"),
        description: data.notificationNumber,
        tagged: [data.subcategory],
        scheduledAt,
      })
```

with:

```ts
      const categoryLabel = categoryMap[data.category] ?? data.category

      if (newFile) {
        const { path } = await uploadFile({
          file: newFile,
          fileName: data.fileId,
          scheduledAt,
          year: data.publishDate.getFullYear(),
          category: categoryLabel,
          subcategory: subcategoryMap[data.subcategory] ?? data.subcategory,
        })
        newRef = path
      } else if (initialData.fileKey && initialData.fileId !== data.fileId) {
        desiredFileName = data.fileId
      }

      await updateGazette({
        siteId,
        gazetteId: Number(gazetteId),
        title: data.title,
        newRef,
        desiredFileName,
        categoryId: data.category,
        categoryLabel,
        date: format(data.publishDate, "dd/MM/yyyy"),
        description: data.notificationNumber,
        tagged: [data.subcategory],
        scheduledAt,
      })
```

Note: `initialData.category` (used in `defaultValues`, unchanged) must now be the category **uuid**, not the label — Task 4 updates the call site in `GazetteTable.tsx` that constructs `initialData` to pass the resolved uuid.

- [ ] **Step 4: Confirm expected type errors**

Run: `pnpm typecheck`
Expected: FAIL — `createGazette`/`updateGazette` calls now pass `categoryId`/`categoryLabel`, which don't exist yet on `createGazetteServerSchema`/`updateGazetteServerSchema` (that's Task 5). This is expected; do not attempt to fix it here. Record the exact error count so Task 5's completion can be checked against it.

- [ ] **Step 5: Commit**

```bash
git add apps/studio/src/features/gazettes/components/GazetteModal/GazetteFormFields.tsx apps/studio/src/features/gazettes/components/CreateGazetteModal/CreateGazetteModal.tsx apps/studio/src/features/gazettes/components/ModifyGazetteModal/ModifyGazetteModal.tsx
git commit -m "feat(gazette): make Category field tag-driven in Create/Modify modals"
```

---

### Task 4: Studio display — GazetteTable, CategoryCell, ViewGazetteModal

**Files:**
- Modify: `apps/studio/src/features/gazettes/components/GazetteTable/GazetteTable.tsx`
- Modify: `apps/studio/src/features/gazettes/components/GazetteTable/CategoryCell.tsx`
- Modify: `apps/studio/src/features/gazettes/components/ViewGazetteModal/ViewGazetteModal.tsx`

**Interfaces:**
- Consumes: `useGazetteSubcategoriesContext()` `categories`/`categoryMap` (Task 2).
- Produces: `GazetteTableData.category` now holds the category **uuid** extracted from `page.tagged` (previously the plain-string label read from `page.category`). Shape of `GazetteTableData` itself is unchanged (still `category: string`).

- [ ] **Step 1: Update `GazetteTable.tsx` to derive the category uuid from `tagged`**

In `apps/studio/src/features/gazettes/components/GazetteTable/GazetteTable.tsx`, add the import and destructure `categories` from context inside the component:

```ts
import { useGazetteSubcategoriesContext } from "../../contexts/GazetteSubcategoriesContext"
```

Inside `GazetteTable`, right after `const columns = useMemo(...)`, add:

```ts
  const { categories } = useGazetteSubcategoriesContext()
  const categoryIds = useMemo(
    () => new Set(categories.map(({ value }) => value)),
    [categories],
  )
```

Change the row-mapping block — replace:

```ts
      resources?.map((resource) => {
        const page = resource.content?.page as {
          category?: string
          description?: string
          ref?: string
          tagged?: string[]
        }

        return {
          id: resource.id,
          title: resource.title,
          notificationNo: page?.description ?? null,
          category: page?.category ?? "",
          subcategory: page?.tagged?.[0] ?? "",
```

with:

```ts
      resources?.map((resource) => {
        const page = resource.content?.page as {
          description?: string
          ref?: string
          tagged?: string[]
        }
        const tagged = page?.tagged ?? []
        const categoryId = tagged.find((id) => categoryIds.has(id)) ?? ""
        const subcategoryId = tagged.find((id) => id !== categoryId) ?? ""

        return {
          id: resource.id,
          title: resource.title,
          notificationNo: page?.description ?? null,
          category: categoryId,
          subcategory: subcategoryId,
```

Add `categoryIds` to the `useMemo` dependency array for `data` (the `tableInstance`'s `data` field is itself computed inline inside `useReactTable`'s `data:` prop via `resources?.map(...)` — it is NOT already memoized separately, so no dependency array changes are needed beyond what's shown above).

- [ ] **Step 2: Update `CategoryCell.tsx` to resolve the category label**

Replace the full contents of `apps/studio/src/features/gazettes/components/GazetteTable/CategoryCell.tsx` with:

```tsx
import { Text, VStack } from "@chakra-ui/react"

import { useGazetteSubcategoriesContext } from "../../contexts/GazetteSubcategoriesContext"

interface CategoryCellProps {
  category: string
  subcategory: string
}

export const CategoryCell = ({
  category,
  subcategory,
}: CategoryCellProps): JSX.Element => {
  const { categoryMap, subcategoryMap } = useGazetteSubcategoriesContext()

  return (
    <VStack spacing="0.25rem" align="start">
      <Text textStyle="subhead-2" color="base.content.strong">
        {categoryMap[category] ?? category}
      </Text>
      <Text textStyle="caption-2" color="base.content.medium" fontSize="sm">
        {subcategoryMap[subcategory] ?? subcategory}
      </Text>
    </VStack>
  )
}
```

- [ ] **Step 3: Update `ViewGazetteModal.tsx` to resolve the category label**

In `apps/studio/src/features/gazettes/components/ViewGazetteModal/ViewGazetteModal.tsx`, change:

```ts
  const { subcategoryMap } = useGazetteSubcategoriesContext()
```

to:

```ts
  const { categoryMap, subcategoryMap } = useGazetteSubcategoriesContext()
```

and add, right after the existing `subcategoryLabel` line:

```ts
  const subcategoryLabel = subcategoryMap[data.subcategory] ?? data.subcategory
  const categoryLabel = categoryMap[data.category] ?? data.category
```

Change the two render sites that use `data.category` directly — replace:

```tsx
                  <DataField label="Category" value={data.category} />
```

with:

```tsx
                  <DataField label="Category" value={categoryLabel} />
```

and replace:

```tsx
                    value={`${data.category} / ${subcategoryLabel}`}
```

with:

```tsx
                    value={`${categoryLabel} / ${subcategoryLabel}`}
```

- [ ] **Step 4: Run typecheck and confirm no new errors in these three files**

Run: `pnpm typecheck 2>&1 | grep -E "GazetteTable|CategoryCell|ViewGazetteModal"`
Expected: no output (no errors in these three files specifically; the Task-3-introduced `categoryId`/`categoryLabel` errors on the mutation calls are unrelated and still pending until Task 5).

- [ ] **Step 5: Commit**

```bash
git add apps/studio/src/features/gazettes/components/GazetteTable/GazetteTable.tsx apps/studio/src/features/gazettes/components/GazetteTable/CategoryCell.tsx apps/studio/src/features/gazettes/components/ViewGazetteModal/ViewGazetteModal.tsx
git commit -m "feat(gazette): resolve category label from tagged in table/cell/view display"
```

---

### Task 5: Server schemas — split `category` into `categoryId` + `categoryLabel`

**Files:**
- Modify: `apps/studio/src/schemas/gazette.ts`

**Interfaces:**
- Produces: `gazetteMetadataSchema` gains `categoryId: z.string().min(1)` and `categoryLabel: z.string().min(1)`, loses `category`. `createGazetteServerSchema`/`updateGazetteServerSchema` (both `.extend()` off `gazetteMetadataSchema`) inherit the change automatically. `createGazetteSchema` (client form schema) and `getPresignedPutUrlSchema` are unchanged — they already only ever carried label strings for `category`/`subcategory` for the S3 path, which is out of scope per the design's non-goals.

- [ ] **Step 1: Update `gazetteMetadataSchema`**

In `apps/studio/src/schemas/gazette.ts`, change:

```ts
const gazetteMetadataSchema = z.object({
  title: z.string().min(1).max(255),
  category: z.string().min(1),
  date: z
    .string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, { message: "Date must be dd/MM/yyyy" }),
  description: z.string().optional(),
  tagged: z.array(z.string()).min(1),
  scheduledAt: z.date(),
})
```

to:

```ts
const gazetteMetadataSchema = z.object({
  title: z.string().min(1).max(255),
  categoryId: z.string().min(1, { message: "Category is required" }),
  categoryLabel: z.string().min(1, { message: "Category is required" }),
  date: z
    .string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, { message: "Date must be dd/MM/yyyy" }),
  description: z.string().optional(),
  tagged: z.array(z.string()).min(1),
  scheduledAt: z.date(),
})
```

- [ ] **Step 2: Run typecheck to confirm the router now surfaces the expected errors**

Run: `pnpm typecheck 2>&1 | grep -E "gazette.router.ts|CreateGazetteModal|ModifyGazetteModal"`
Expected: errors in `gazette.router.ts` where `category` is destructured from `createGazetteServerSchema`/`updateGazetteServerSchema` input and passed to `buildGazetteBlobContent`/`hasDuplicateNotificationNumber` (both of which still expect the old shape) — these are exactly the errors Task 6 fixes. The `CreateGazetteModal`/`ModifyGazetteModal` errors from Task 3 should now be GONE (client and server schemas agree on `categoryId`/`categoryLabel`).

- [ ] **Step 3: Commit**

```bash
git add apps/studio/src/schemas/gazette.ts
git commit -m "feat(gazette): split server-side category schema field into categoryId/categoryLabel"
```

---

### Task 6: Server write path — persist merged `tagged`, dedup by uuid containment

**Files:**
- Modify: `apps/studio/src/server/modules/gazette/gazette.router.ts`
- Modify: `apps/studio/src/server/modules/gazette/gazette.service.ts`
- Modify: `apps/studio/src/server/modules/gazette/__tests__/gazette.router.test.ts`

**Interfaces:**
- Consumes: `gazetteMetadataSchema` shape from Task 5.
- Produces: `hasDuplicateNotificationNumber` signature changes from `{ category: string; subCategory: string }` to `{ categoryLabel: string; categoryId: string; subcategoryId: string }`. `buildGazetteBlobContent` signature changes from `{ category: string }` to `{ categoryId: string }`, and persists `tagged: [categoryId, ...tagged]` instead of a standalone `category` key.

- [ ] **Step 1: Update `hasDuplicateNotificationNumber` in `gazette.service.ts`**

Replace the full function (currently lines 511-566) with:

```ts
export const hasDuplicateNotificationNumber = async ({
  trx = db,
  siteId,
  parentId,
  notificationNumber,
  publishDate,
  categoryLabel,
  categoryId,
  subcategoryId,
  excludeId,
}: {
  trx?: Kysely<DB> | Transaction<DB>
  siteId: number
  parentId: string | null
  notificationNumber: string
  publishDate: string
  categoryLabel: string
  categoryId: string
  subcategoryId: string
  excludeId?: string
}): Promise<boolean> => {
  const isGovernmentGazette =
    categoryLabel === GazetteCategories.GovernmentGazettes
  // publishDate is a "dd/MM/yyyy" string — the year is the last segment.
  const publishYear = publishDate.split("/").at(-1)

  const content = sql`COALESCE("DraftBlob"."content", "PublishedBlob"."content")`
  const taggedContains = (id: string) =>
    sql<boolean>`${content}->'page'->'tagged' @> ${JSON.stringify([id])}::jsonb`

  let query = trx
    .selectFrom("Resource")
    .leftJoin("Blob as DraftBlob", "Resource.draftBlobId", "DraftBlob.id")
    .leftJoin("Version", "Resource.publishedVersionId", "Version.id")
    .leftJoin("Blob as PublishedBlob", "Version.blobId", "PublishedBlob.id")
    .where("Resource.siteId", "=", siteId)
    .where("Resource.parentId", "=", parentId)
    .where("Resource.type", "=", ResourceType.CollectionLink)
    .where(
      sql<boolean>`${content}->'page'->>'description' = ${notificationNumber}`,
    )
    .where(taggedContains(categoryId))
    .where(
      sql<boolean>`split_part(${content}->'page'->>'date', '/', 3) = ${publishYear}`,
    )
    .select("Resource.id")

  // Government gazettes are unique within category, not subcategory.
  if (!isGovernmentGazette) {
    query = query.where(taggedContains(subcategoryId))
  }

  if (excludeId) {
    query = query.where("Resource.id", "!=", excludeId)
  }

  const duplicate = await query.executeTakeFirst()
  return duplicate !== undefined
}
```

Update the JSDoc comment directly above it (currently lines 499-510) to:

```ts
/**
 * Detects whether another gazette in the same collection already uses the
 * given notification number. A gazette is a duplicate when it shares the
 * same notification number, category and publish year. For non-Government
 * Gazette categories the subcategory must match too — Government Gazette
 * numbers are unique within the category, not the subcategory.
 *
 * Gazette metadata lives in the resource's draft (or published) blob:
 * `content.page.{description,date,tagged}`, where `tagged` holds one uuid
 * per tagCategory (category + subcategory). `date` is stored as a
 * "dd/MM/yyyy" string, so the year is its third "/"-delimited segment.
 * Deleted gazettes are hard-deleted, so no soft-delete filter is needed.
 */
```

- [ ] **Step 2: Update `buildGazetteBlobContent` and both mutations in `gazette.router.ts`**

Replace:

```ts
interface GazetteBlobInputs {
  ref: string
  category: string
  date: string
  description?: string
  tagged: string[]
}

// Blob.content adheres to the PrismaJson.BlobJsonContent contract shared with
// the components package. We deliberately do NOT add gazette-only fields like
// `fileSize` here — the file size is read from S3 at list time instead, since
// the page is bounded to ~25 rows and S3 HEAD scales to thousands of QPS.
const buildGazetteBlobContent = ({
  ref,
  category,
  date,
  description,
  tagged,
}: GazetteBlobInputs) => {
  const base = createCollectionLinkJson({ type: ResourceType.CollectionLink })
  return {
    ...base,
    page: {
      ...base.page,
      ref,
      category,
      date,
      description,
      tagged,
    },
  }
}
```

with:

```ts
interface GazetteBlobInputs {
  ref: string
  categoryId: string
  date: string
  description?: string
  tagged: string[]
}

// Blob.content adheres to the PrismaJson.BlobJsonContent contract shared with
// the components package. We deliberately do NOT add gazette-only fields like
// `fileSize` here — the file size is read from S3 at list time instead, since
// the page is bounded to ~25 rows and S3 HEAD scales to thousands of QPS.
//
// `categoryId` and `tagged` (the subcategory uuid) are merged into a single
// `tagged` array on write — the persisted shape has no standalone `category`
// key, matching the generic tagCategories/tagged model used elsewhere.
const buildGazetteBlobContent = ({
  ref,
  categoryId,
  date,
  description,
  tagged,
}: GazetteBlobInputs) => {
  const base = createCollectionLinkJson({ type: ResourceType.CollectionLink })
  return {
    ...base,
    page: {
      ...base.page,
      ref,
      date,
      description,
      tagged: [categoryId, ...tagged],
    },
  }
}
```

In the `create` mutation, change the input destructure from:

```ts
      async ({
        ctx,
        input: {
          siteId,
          collectionId,
          title,
          permalink,
          ref,
          category,
          date,
          description,
          tagged,
          scheduledAt,
        },
      }) => {
```

to:

```ts
      async ({
        ctx,
        input: {
          siteId,
          collectionId,
          title,
          permalink,
          ref,
          categoryId,
          categoryLabel,
          date,
          description,
          tagged,
          scheduledAt,
        },
      }) => {
```

Change the `buildGazetteBlobContent` call from:

```ts
        const blobContent = buildGazetteBlobContent({
          ref,
          category,
          date,
          description,
          tagged,
        })
```

to:

```ts
        const blobContent = buildGazetteBlobContent({
          ref,
          categoryId,
          date,
          description,
          tagged,
        })
```

Change the `hasDuplicateNotificationNumber` call from:

```ts
            await hasDuplicateNotificationNumber({
              trx: tx,
              siteId,
              parentId: String(collectionId),
              notificationNumber: description,
              publishDate: date,
              category,
              subCategory: tagged[0] ?? "",
            }))
```

to:

```ts
            await hasDuplicateNotificationNumber({
              trx: tx,
              siteId,
              parentId: String(collectionId),
              notificationNumber: description,
              publishDate: date,
              categoryLabel,
              categoryId,
              subcategoryId: tagged[0] ?? "",
            }))
```

In the `update` mutation, change the input destructure from:

```ts
      async ({
        ctx,
        input: {
          siteId,
          gazetteId,
          title,
          newRef,
          desiredFileName,
          category,
          date,
          description,
          tagged,
          scheduledAt,
        },
      }) => {
```

to:

```ts
      async ({
        ctx,
        input: {
          siteId,
          gazetteId,
          title,
          newRef,
          desiredFileName,
          categoryId,
          categoryLabel,
          date,
          description,
          tagged,
          scheduledAt,
        },
      }) => {
```

Change its `buildGazetteBlobContent` call from:

```ts
        const newBlobContent = buildGazetteBlobContent({
          ref: finalRef,
          category,
          date,
          description,
          tagged,
        })
```

to:

```ts
        const newBlobContent = buildGazetteBlobContent({
          ref: finalRef,
          categoryId,
          date,
          description,
          tagged,
        })
```

Change its `hasDuplicateNotificationNumber` call from:

```ts
              (await hasDuplicateNotificationNumber({
                trx: tx,
                siteId,
                parentId: existingResource.parentId,
                notificationNumber: description,
                publishDate: date,
                category,
                subCategory: tagged[0] ?? "",
                excludeId: String(gazetteId),
              }))
```

to:

```ts
              (await hasDuplicateNotificationNumber({
                trx: tx,
                siteId,
                parentId: existingResource.parentId,
                notificationNumber: description,
                publishDate: date,
                categoryLabel,
                categoryId,
                subcategoryId: tagged[0] ?? "",
                excludeId: String(gazetteId),
              }))
```

- [ ] **Step 3: Update `gazette.router.test.ts` create/update/dedup assertions**

This file has many call sites passing `category: "..."` to `caller.gazette.create(...)` / `caller.gazette.update(...)`. For every such call, replace `category: "<Label>"` with the pair `categoryId: "cat-1"` (or a distinct fixed id per test where two different categories are compared — see below) and `categoryLabel: "<Label>"`.

Concretely, for the bulk of call sites (create tests at lines 196, 254, 282, 296, 320, 335 [`"Legislative Supplements"`], 359, 374, 398, 414; update tests at 441, 458, 511, 526, 572, 598, 611, 624, 648, 662, 675, 698, 711; cancelScheduledPublish/delete tests at 742, 866, 1008), apply this mechanical substitution:

- `category: "Government Gazette"` → `categoryId: "cat-gov"`, `categoryLabel: "Government Gazette"`
- `category: "Legislative Supplements"` → `categoryId: "cat-leg"`, `categoryLabel: "Legislative Supplements"`
- `category: "Other Supplements"` → `categoryId: "cat-oth"`, `categoryLabel: "Other Supplements"`

For the assertion in the "rewrites the blob metadata" test (around line 483-492), change:

```ts
          const page = blob.content as {
            category?: string
            tagged?: string[]
          }
```

to:

```ts
          const page = blob.content as {
            tagged?: string[]
          }
```

and change:

```ts
      expect(page?.category).toBe("Other Supplements")
      expect(page?.tagged).toEqual(["sub-2"])
```

to:

```ts
      expect(page?.tagged).toEqual(["cat-oth", "sub-2"])
```

(Adjust the exact `categoryId` value used in that test's `update` call to `"cat-oth"` to match, since it updates the gazette to `"Other Supplements"`.)

For the two "non-Government Gazette category" dedup tests (lines 349-429, `"rejects creation for a non-Government Gazette category..."` and `"allows creation... when the subcategory differs..."`), both the initial `create` and the follow-up duplicate-check `create` must use the SAME `categoryId`/`categoryLabel` pair (e.g. `categoryId: "cat-leg"`, `categoryLabel: "Legislative Supplements"`) so `isGovernmentGazette` resolves to `false` and the subcategory containment check is exercised — this matches the existing test intent unchanged.

For the `getPresignedPutUrl` tests (lines 889-938), leave `category`/`subcategory` untouched — that schema is unchanged per Task 5's scope note.

- [ ] **Step 4: Run the integration test suite**

Run: `pnpm --filter studio test:unit -- src/server/modules/gazette/__tests__/gazette.router.test.ts`
Expected: PASS. If any test still references a bare `category:` field on a `create`/`update` call, TypeScript will fail to compile the test file — search for `category:` remaining anywhere in the file's `create`/`update`/`cancelScheduledPublish`/`delete` describe blocks and fix.

- [ ] **Step 5: Run full typecheck**

Run: `pnpm typecheck`
Expected: no errors remaining in `gazette.router.ts`, `gazette.service.ts`, `gazette.router.test.ts` (errors may remain in `gazette.router.ts`'s `list` procedure and `schedulePushDocumentJob.ts` — those are fixed in Tasks 7 and 8).

- [ ] **Step 6: Commit**

```bash
git add apps/studio/src/server/modules/gazette/gazette.router.ts apps/studio/src/server/modules/gazette/gazette.service.ts apps/studio/src/server/modules/gazette/__tests__/gazette.router.test.ts
git commit -m "feat(gazette): persist category as a tagged uuid, dedup by jsonb containment"
```

---

### Task 7: Server list sort — sort by category uuid containment

**Files:**
- Modify: `apps/studio/src/server/modules/gazette/gazette.router.ts`

**Interfaces:**
- Consumes: `getCollectionTagsForResource` from `../collection/collection.service` (already used elsewhere in the codebase, e.g. `collection.router.ts`), `GAZETTE_CATEGORY_LABEL` and `GazetteCategories` from `~/features/gazettes/constants`.

- [ ] **Step 1: Add the import**

In `apps/studio/src/server/modules/gazette/gazette.router.ts`, change:

```ts
import { createCollectionLinkJson } from "../collection/collection.service"
```

to:

```ts
import {
  createCollectionLinkJson,
  getCollectionTagsForResource,
} from "../collection/collection.service"
```

Add to the top-level imports:

```ts
import {
  GAZETTE_CATEGORY_LABEL,
  GazetteCategories,
} from "~/features/gazettes/constants"
```

(If `GazetteCategories` is already imported here for another reason, merge into the existing import statement rather than duplicating it.)

- [ ] **Step 2: Resolve the three category uuids before building the sort**

In the `list` procedure, right after the `await bulkValidateUserPermissionsForResources({...})` call and before the `const results = await db...` query, add:

```ts
      const collectionTagCategories = await getCollectionTagsForResource({
        collectionId,
        siteId,
      })
      const categoryTagCategory = collectionTagCategories.find(
        (tagCategory) => tagCategory.label === GAZETTE_CATEGORY_LABEL,
      )
      const categoryIdByLabel = Object.fromEntries(
        (categoryTagCategory?.options ?? []).map((option) => [
          option.label,
          option.id,
        ]),
      )
      const governmentGazetteId =
        categoryIdByLabel[GazetteCategories.GovernmentGazettes]
      const legislativeSupplementsId =
        categoryIdByLabel[GazetteCategories.LegislativeSupplements]
      const otherSupplementsId =
        categoryIdByLabel[GazetteCategories.OtherSupplements]
```

- [ ] **Step 3: Replace the category `CASE WHEN` to match on `tagged` containment**

Replace:

```ts
        // 2. Category priority from blob content
        .orderBy((eb) => {
          const categoryExpr = sql<string>`COALESCE("DraftBlob"."content", "PublishedBlob"."content")->'page'->>'category'`
          return eb
            .case()
            .when(categoryExpr, "=", "Government Gazette")
            .then(1)
            .when(categoryExpr, "=", "Legislative Supplements")
            .then(2)
            .when(categoryExpr, "=", "Other Supplements")
            .then(3)
            .else(4)
            .end()
        }, "asc")
```

with:

```ts
        // 2. Category priority from blob content — matches by uuid
        // containment against `tagged` since category is no longer a plain
        // string field. Falls through to the `else` bucket (harmlessly) if a
        // category's uuid is unresolved, e.g. the tagCategory isn't seeded.
        .orderBy((eb) => {
          const taggedExpr = sql`COALESCE("DraftBlob"."content", "PublishedBlob"."content")->'page'->'tagged'`
          const contains = (id: string | undefined) =>
            sql<boolean>`${taggedExpr} @> ${JSON.stringify([id ?? null])}::jsonb`
          return eb
            .case()
            .when(contains(governmentGazetteId))
            .then(1)
            .when(contains(legislativeSupplementsId))
            .then(2)
            .when(contains(otherSupplementsId))
            .then(3)
            .else(4)
            .end()
        }, "asc")
```

- [ ] **Step 4: Run typecheck**

Run: `pnpm typecheck 2>&1 | grep "gazette.router.ts"`
Expected: no output (no errors in this file remaining, other than pre-existing unrelated ones if any).

- [ ] **Step 5: Run the router test suite**

Run: `pnpm --filter studio test:unit -- src/server/modules/gazette/__tests__/gazette.router.test.ts`
Expected: PASS. The `list`-related assertions in this file (if any check sort order) implicitly depend on a `"Category"` tagCategory existing for the test collection — if a `list` sort-order test fails because `getCollectionTagsForResource` returns no matching tagCategory (test collections aren't seeded with one), seed one via the same `db.updateTable("Blob")...` pattern used in `schedulePushDocumentJob.test.ts`'s `seedDocumentReadyForIngestion`, scoped to whichever `describe("list", ...)` or similar block needs it. If no existing test asserts on sort order specifically, no seeding is needed — the `else(4)` fallback keeps unsorted rows in a stable, non-crashing bucket.

- [ ] **Step 6: Commit**

```bash
git add apps/studio/src/server/modules/gazette/gazette.router.ts
git commit -m "feat(gazette): sort list by category uuid containment instead of string equality"
```

---

### Task 8: Cron ingestion — resolve both labels via `resolveGazetteTagLabels`

**Files:**
- Modify: `apps/studio/src/server/cron/jobs/schedulePushDocumentJob.ts`
- Modify: `apps/studio/src/server/cron/jobs/__test__/schedulePushDocumentJob.test.ts`

**Interfaces:**
- Consumes: `resolveGazetteTagLabels` from `~/server/modules/gazette/gazette.service` (Task 1).
- Produces: `extractResourceData` now returns `categoryLabel` alongside `subcategoryLabel`; `parsedPage` no longer has a `.category` field.

- [ ] **Step 1: Update the two Zod schemas**

In `apps/studio/src/server/cron/jobs/schedulePushDocumentJob.ts`, change:

```ts
const pushDocumentContentSchema = z.object({
  page: z.object({
    ref: z.string(),
    category: z.string(),
    tagged: z.array(z.string()),
    description: z.string().optional(),
  }),
})

const collectionIndexPageContentSchema = z.object({
  layout: z.literal("collection"),
  page: z.object({
    tagCategories: z.array(
      z.object({
        options: z.array(z.object({ id: z.string(), label: z.string() })),
      }),
    ),
  }),
})
```

to:

```ts
const pushDocumentContentSchema = z.object({
  page: z.object({
    ref: z.string(),
    tagged: z.array(z.string()),
    description: z.string().optional(),
  }),
})

const collectionIndexPageContentSchema = z.object({
  layout: z.literal("collection"),
  page: z.object({
    tagCategories: z.array(
      z.object({
        label: z.string(),
        options: z.array(z.object({ id: z.string(), label: z.string() })),
      }),
    ),
  }),
})
```

- [ ] **Step 2: Update `extractResourceData` to resolve both labels**

Add the import:

```ts
import { resolveGazetteTagLabels } from "~/server/modules/gazette/gazette.service"
```

(merge into the existing `~/server/modules/gazette/gazette.service` import rather than duplicating it)

Change the return type annotation of `extractResourceData` from:

```ts
): Promise<{
  ref: string
  objectGroup: string
  fileUrl: string
  subcategoryLabel: string | undefined
  pdfTextContent: string
  parsedPage: {
    ref: string
    category: string
    tagged: string[]
    description?: string
  }
} | null> => {
```

to:

```ts
): Promise<{
  ref: string
  objectGroup: string
  fileUrl: string
  categoryLabel: string | undefined
  subcategoryLabel: string | undefined
  pdfTextContent: string
  parsedPage: {
    ref: string
    tagged: string[]
    description?: string
  }
} | null> => {
```

Replace the subcategory-derivation block — change:

```ts
  // NOTE: Derive the subcategory from the tagged mapping
  const indexParsed =
    collectionIndexPageContentSchema.safeParse(indexPageContent)
  if (!indexParsed.success) {
    logger.error(
      { indexPageContent, resourceId },
      "Invalid index page content structure",
    )
    throw new Error(
      `Failed to parse index page content for resource ${resourceId}`,
    )
  }
  const { tagCategories } = indexParsed.data.page
  // reduce the tag category options into a single array then we find
  const options =
    tagCategories?.map((category) => category.options).flat() ?? []
  const subcategory = options.find(
    (option) => option.id === parsed.data.page.tagged[0],
  )

  const pdfTextContent = await parseFullTextFromPDF(blob)

  return {
    ref,
    objectGroup,
    fileUrl,
    subcategoryLabel: subcategory?.label,
    pdfTextContent,
    parsedPage: parsed.data.page,
  }
```

with:

```ts
  // NOTE: Derive the category and subcategory labels from the tagged uuids
  const indexParsed =
    collectionIndexPageContentSchema.safeParse(indexPageContent)
  if (!indexParsed.success) {
    logger.error(
      { indexPageContent, resourceId },
      "Invalid index page content structure",
    )
    throw new Error(
      `Failed to parse index page content for resource ${resourceId}`,
    )
  }
  const { categoryLabel, subcategoryLabel } = resolveGazetteTagLabels({
    tagged: parsed.data.page.tagged,
    tagCategories: indexParsed.data.page.tagCategories,
  })

  const pdfTextContent = await parseFullTextFromPDF(blob)

  return {
    ref,
    objectGroup,
    fileUrl,
    categoryLabel,
    subcategoryLabel,
    pdfTextContent,
    parsedPage: parsed.data.page,
  }
```

- [ ] **Step 3: Update both ingestion branches to use `categoryLabel`**

In the SearchSG branch, change:

```ts
            const { ref, pdfTextContent, subcategoryLabel, parsedPage } =
              extracted

            return {
              // SearchSG dedupes on documentId, so derive a stable id from the
              // S3 key + resourceId. Re-uploads of the same key produce the
              // same id, avoiding duplicate search hits.
              documentId: generateDocumentId(ref, String(resourceId)),
              content: pdfTextContent.slice(0, SEARCHSG_CONTENT_LENGTH),
              title,
              url: encodeURI(`https://${env.S3_GAZETTE_DOMAIN_NAME}${ref}`),
              date: scheduledAt.toISOString(),
              categories: subcategoryLabel ? [subcategoryLabel] : [],
              contentType: parsedPage.category,
            }
```

to:

```ts
            const { ref, pdfTextContent, categoryLabel, subcategoryLabel } =
              extracted

            return {
              // SearchSG dedupes on documentId, so derive a stable id from the
              // S3 key + resourceId. Re-uploads of the same key produce the
              // same id, avoiding duplicate search hits.
              documentId: generateDocumentId(ref, String(resourceId)),
              content: pdfTextContent.slice(0, SEARCHSG_CONTENT_LENGTH),
              title,
              url: encodeURI(`https://${env.S3_GAZETTE_DOMAIN_NAME}${ref}`),
              date: scheduledAt.toISOString(),
              categories: subcategoryLabel ? [subcategoryLabel] : [],
              contentType: categoryLabel ?? "",
            }
```

In the Algolia branch, change:

```ts
          const {
            objectGroup,
            fileUrl,
            subcategoryLabel,
            pdfTextContent,
            parsedPage,
          } = extracted

          const records = buildGazetteSearchRecords({
            parsedText: pdfTextContent,
            objectGroup,
            title,
            category: parsedPage.category,
            subCategory: subcategoryLabel ?? "",
            notificationNum: parsedPage.description,
            fileUrl,
            scheduledAt,
          })
```

to:

```ts
          const {
            objectGroup,
            fileUrl,
            categoryLabel,
            subcategoryLabel,
            pdfTextContent,
            parsedPage,
          } = extracted

          const records = buildGazetteSearchRecords({
            parsedText: pdfTextContent,
            objectGroup,
            title,
            category: categoryLabel ?? "",
            subCategory: subcategoryLabel ?? "",
            notificationNum: parsedPage.description,
            fileUrl,
            scheduledAt,
          })
```

- [ ] **Step 4: Update the test fixture to seed a "Category" tagCategory and drop `category` from the blob content**

In `apps/studio/src/server/cron/jobs/__test__/schedulePushDocumentJob.test.ts`, change the comment and signature of `setBlobContentForPushDocument` — replace:

```ts
// Replace the document blob's content with a shape the worker accepts.
// The worker's Zod parse inspects `page.ref`, `page.category`, and
// `page.tagged`, so we cast around the broader BlobJsonContent typing for
// the sake of the fixture.
const setBlobContentForPushDocument = async (
  blobId: bigint | string,
  ref: string,
  category: string,
  tagged: string[] = [],
  description?: string,
) => {
  await db
    .updateTable("Blob")
    .set({
      content: { page: { ref, category, tagged, description } } as never,
    })
    .where("id", "=", String(blobId))
    .execute()
}
```

with:

```ts
// Replace the document blob's content with a shape the worker accepts.
// The worker's Zod parse inspects `page.ref` and `page.tagged`, so we cast
// around the broader BlobJsonContent typing for the sake of the fixture.
const setBlobContentForPushDocument = async (
  blobId: bigint | string,
  ref: string,
  tagged: string[] = [],
  description?: string,
) => {
  await db
    .updateTable("Blob")
    .set({
      content: { page: { ref, tagged, description } } as never,
    })
    .where("id", "=", String(blobId))
    .execute()
}
```

Update the IndexPage `tagCategories` fixture — replace:

```ts
  // Set the IndexPage blob content to the expected shape.
  await db
    .updateTable("Blob")
    .set({
      content: {
        layout: "collection",
        page: {
          tagCategories: [
            {
              options: [{ id: "tag-1", label: "Public" }],
            },
          ],
        },
      } as never,
    })
    .where("id", "=", String(indexBlob.id))
    .execute()
```

with:

```ts
  // Set the IndexPage blob content to the expected shape: two tagCategories,
  // one for category and one for subcategory, each with a `label` used to
  // disambiguate which resolved option is which.
  await db
    .updateTable("Blob")
    .set({
      content: {
        layout: "collection",
        page: {
          tagCategories: [
            {
              label: GAZETTE_CATEGORY_LABEL,
              options: [{ id: "cat-1", label: category }],
            },
            {
              label: GAZETTE_SUBCATEGORY_LABEL,
              options: [{ id: "tag-1", label: "Public" }],
            },
          ],
        },
      } as never,
    })
    .where("id", "=", String(indexBlob.id))
    .execute()
```

Add the import at the top of the file:

```ts
import {
  GAZETTE_CATEGORY_LABEL,
  GAZETTE_SUBCATEGORY_LABEL,
} from "~/features/gazettes/constants"
```

Update `seedDocumentReadyForIngestion`'s call to `setBlobContentForPushDocument` — change:

```ts
  await setBlobContentForPushDocument(
    blob.id,
    ref,
    category,
    ["tag-1"],
    description,
  )
```

to:

```ts
  await setBlobContentForPushDocument(
    blob.id,
    ref,
    ["cat-1", "tag-1"],
    description,
  )
```

Update the other direct call to `setBlobContentForPushDocument` in the "indexes the published version's content" test — change:

```ts
      await setBlobContentForPushDocument(
        draftBlob.id,
        draftRef,
        "Government Gazettes",
        ["tag-1"],
      )
```

to:

```ts
      await setBlobContentForPushDocument(draftBlob.id, draftRef, [
        "cat-1",
        "tag-1",
      ])
```

The assertion in the "dispatches a due row to Algolia and deletes it" test —

```ts
      expect(records[0]).toMatchObject({
        objectGroup: expectedObjectGroup,
        objectID: `${expectedObjectGroup}-text-0`,
        title: "Document Title",
        category: "Government Gazettes",
        subCategory: "Public",
      })
```

— and the SearchSG assertion —

```ts
      expect(body.documentsToAdd[0]).toMatchObject({
        title: "Document Title",
        content: "parsed pdf text",
        contentType: "Government Gazettes",
        categories: ["Public"],
      })
```

both require NO code changes. `category`/`contentType` still resolve to `"Government Gazettes"` — it's now the label of the `cat-1` option (seeded in Step 4 above) instead of a raw string field, but the fixture passes the same literal string, so these assertions keep passing unmodified. Do not edit these two blocks; they're called out here only so their continued presence is understood, not treated as a leftover of the old field.

- [ ] **Step 5: Run the cron job test suite**

Run: `pnpm --filter studio test:unit -- src/server/cron/jobs/__test__/schedulePushDocumentJob.test.ts`
Expected: PASS (all existing assertions on `category`/`contentType`/`categories` continue to hold since the fixture threads the same label strings through, now via the tagCategories/tagged path instead of a raw field).

- [ ] **Step 6: Run full typecheck**

Run: `pnpm typecheck`
Expected: PASS — this should be the last file with pending errors from earlier tasks.

- [ ] **Step 7: Commit**

```bash
git add apps/studio/src/server/cron/jobs/schedulePushDocumentJob.ts apps/studio/src/server/cron/jobs/__test__/schedulePushDocumentJob.test.ts
git commit -m "feat(gazette): resolve category label via resolveGazetteTagLabels in ingestion cron"
```

---

### Task 9: Final verification sweep

**Files:** none (verification only)

- [ ] **Step 1: Full typecheck**

Run: `pnpm typecheck`
Expected: PASS, zero errors.

- [ ] **Step 2: Full lint**

Run: `pnpm lint`
Expected: PASS. Fix any lint findings (e.g. unused imports left over from removing `GAZETTE_CATEGORIES`/`GazettesCategory` usage) directly, then re-run.

- [ ] **Step 3: Full gazette-related unit/integration test run**

Run: `pnpm --filter studio test:unit -- src/features/gazettes src/server/modules/gazette src/server/cron/jobs/__test__/schedulePushDocumentJob.test.ts`
Expected: PASS.

- [ ] **Step 4: Manual Storybook check**

Run: `pnpm --filter studio storybook`
Open `CreateGazetteModal`, `ModifyGazetteModal` stories. Confirm: Category dropdown now shows the tag-driven options from the MSW fixture, selecting a Category still correctly filters the Subcategory dropdown's options (the `getSubcategoriesForCategory` label-based hierarchy), and submitting doesn't throw.

- [ ] **Step 5: Commit any final fixes**

```bash
git add -A
git commit -m "chore(gazette): fix lint findings from category tagCategories migration"
```

(Only run this commit if Step 2 required changes. If nothing changed, skip this step.)

---

## Execution Handoff

Two execution options:

1. **Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints.
