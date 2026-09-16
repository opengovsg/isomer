# Readable Audit Log History Panel (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "History" panel to the Studio page editor that lists one row per `ResourceUpdate` audit log entry with an actual content change, each with a "View changes" button (not yet wired to a diff view — that's Phase 2).

**Architecture:** A new `audit.listResourceUpdates` tRPC query reads `AuditLog` rows via Kysely, filtering (via raw JSONB SQL predicates) to `ResourceUpdate` events for the given page where `delta.before.blob.content` actually differs from `delta.after.blob.content`, cursor-paginated by offset. On the frontend, a new `HistoryStateDrawer` is wired into the existing `DrawerState` state-machine that the page editor's left rail already uses (mirroring how `metadataEditor`/`rawJsonEditor` etc. are wired), triggered by a new "View page history" button in `RootStateDrawer`.

**Tech Stack:** tRPC (`protectedProcedure`), Kysely (raw `sql` JSONB predicates), Zod, React + Chakra UI, `useInfiniteQuery`, Vitest (integration test against real Postgres; Vitest Browser Mode component test).

Spec: `docs/superpowers/specs/2026-09-16-readable-audit-log-history-panel-design.md`

---

## Task 1: Backend — `audit.listResourceUpdates` query

**Files:**
- Modify: `apps/studio/src/schemas/audit.ts` (add input schema)
- Modify: `apps/studio/src/server/modules/audit/audit.service.ts` (add query function, export `FullResource`)
- Modify: `apps/studio/src/server/modules/audit/audit.router.ts` (add procedure)
- Modify: `apps/studio/src/server/modules/audit/__tests__/audit.router.test.ts` (add tests + extend `resetTables`)

Every save through `page.router.ts`'s `updatePageBlob` logs a `ResourceUpdate` `AuditLog` row with `delta: { before: { blob, resource }, after: { blob, resource } }` — even when the blob content didn't actually change (e.g. re-saving with no edits). `resource` is identical on both sides; only `blob.content` may differ. This task adds a paginated read that filters to rows with a genuine content diff.

- [ ] **Step 1: Write the failing integration test**

Open `apps/studio/src/server/modules/audit/__tests__/audit.router.test.ts`. Update the imports and the shared `beforeEach` to reset the extra tables this test needs, then add a new `describe("listResourceUpdates", ...)` block.

Replace the top of the file (imports) with:

```ts
import type { IsomerSchema } from "@opengovsg/isomer-components"
import { TRPCError } from "@trpc/server"
import { pick } from "lodash-es"
import { auth } from "tests/integration/helpers/auth"
import { resetTables } from "tests/integration/helpers/db"
import {
  applyAuthedSession,
  applySession,
  createMockRequest,
} from "tests/integration/helpers/iron-session"
import {
  setupAdminPermissions,
  setupEditorPermissions,
  setupIsomerAdmin,
  setupPageResource,
  setupSite,
  setupUser,
} from "tests/integration/helpers/seed"
import { getCurrentSingaporeMonth } from "~/schemas/audit"
import { createCallerFactory } from "~/server/trpc"

import type { User } from "../../database"
import { db } from "../../database"
import { pageRouter } from "../../page/page.router"
import { auditRouter } from "../audit.router"
import { getMonthDateRange } from "../auditLogExport.query"

const createCaller = createCallerFactory(auditRouter)
const createPageCaller = createCallerFactory(pageRouter)
```

(This only adds `IsomerSchema`, `pick`, `setupPageResource`, and `pageRouter`/`createPageCaller` to the existing imports — everything else stays as-is.)

Update the shared `beforeEach`'s `resetTables` call (currently `resetTables("AuditLogExportRequest", "AuditLog", "IsomerAdmin", "ResourcePermission", "Site", "User")`) to also reset the tables `setupPageResource`/`updatePageBlob` touch:

```ts
  beforeEach(async () => {
    await resetTables(
      "AuditLogExportRequest",
      "AuditLog",
      "IsomerAdmin",
      "ResourcePermission",
      "Blob",
      "Version",
      "Resource",
      "Site",
      "User",
    )
    user = await setupUser({
      userId: session.userId,
      email: "test@mock.com",
    })
    await auth(user)
    caller = createCaller(createMockRequest(session))
  })
```

Then add this new `describe` block as a sibling of the existing `describe("createExportRequest", ...)` block (inside `describe("audit.router", ...)`):

```ts
  describe("listResourceUpdates", () => {
    const BLOCKS_A: IsomerSchema["content"] = [
      {
        type: "prose",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "First revision" }],
          },
        ],
      },
    ]
    const BLOCKS_B: IsomerSchema["content"] = [
      {
        type: "prose",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Second revision" }],
          },
        ],
      },
    ]

    const createUpdateArgs = (
      page: Awaited<ReturnType<typeof setupPageResource>>["page"],
      blocks: IsomerSchema["content"],
    ) => ({
      pageId: Number(page.id),
      siteId: page.siteId,
      content: JSON.stringify({
        content: blocks,
        layout: "content",
        page: pick(page, ["title", "permalink"]),
        version: "0.1.0",
      }),
    })

    it("returns only ResourceUpdate rows where the blob content actually changed, newest first", async () => {
      // Arrange
      const { page } = await setupPageResource({ resourceType: "Page" })
      await setupAdminPermissions({
        userId: session.userId ?? undefined,
        siteId: page.siteId,
      })
      const pageCaller = createPageCaller(createMockRequest(session))

      await pageCaller.updatePageBlob(createUpdateArgs(page, BLOCKS_A))
      // Re-saving identical content must not appear in the history list.
      await pageCaller.updatePageBlob(createUpdateArgs(page, BLOCKS_A))
      await pageCaller.updatePageBlob(createUpdateArgs(page, BLOCKS_B))

      // Act
      const result = await caller.listResourceUpdates({
        pageId: Number(page.id),
        siteId: page.siteId,
        cursor: 0,
        limit: 10,
      })

      // Assert
      expect(result.items).toHaveLength(2)
      expect(result.items[0]?.afterContent.content).toEqual(BLOCKS_B)
      expect(result.items[1]?.afterContent.content).toEqual(BLOCKS_A)
      expect(result.nextOffset).toBeNull()
    })

    it("paginates with cursor/limit", async () => {
      // Arrange
      const { page } = await setupPageResource({ resourceType: "Page" })
      await setupAdminPermissions({
        userId: session.userId ?? undefined,
        siteId: page.siteId,
      })
      const pageCaller = createPageCaller(createMockRequest(session))
      await pageCaller.updatePageBlob(createUpdateArgs(page, BLOCKS_A))
      await pageCaller.updatePageBlob(createUpdateArgs(page, BLOCKS_B))

      // Act
      const firstPage = await caller.listResourceUpdates({
        pageId: Number(page.id),
        siteId: page.siteId,
        cursor: 0,
        limit: 1,
      })
      const secondPage = await caller.listResourceUpdates({
        pageId: Number(page.id),
        siteId: page.siteId,
        cursor: firstPage.nextOffset ?? 0,
        limit: 1,
      })

      // Assert
      expect(firstPage.items).toHaveLength(1)
      expect(firstPage.items[0]?.afterContent.content).toEqual(BLOCKS_B)
      expect(firstPage.nextOffset).toBe(1)
      expect(secondPage.items).toHaveLength(1)
      expect(secondPage.items[0]?.afterContent.content).toEqual(BLOCKS_A)
      expect(secondPage.nextOffset).toBeNull()
    })

    it("throws FORBIDDEN if the user has no permission on the site", async () => {
      // Arrange
      const { page } = await setupPageResource({ resourceType: "Page" })

      // Act
      const result = caller.listResourceUpdates({
        pageId: Number(page.id),
        siteId: page.siteId,
        cursor: 0,
        limit: 10,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })
  })
```

- [ ] **Step 2: Run the test to verify it fails**

Ensure the local test DB is up: `pnpm services:setup` (from `apps/studio`, only if not already running).

Run: `pnpm test:unit -- src/server/modules/audit/__tests__/audit.router.test.ts`

Expected: FAIL — `caller.listResourceUpdates` is not a function (the procedure doesn't exist yet).

- [ ] **Step 3: Add the input schema**

In `apps/studio/src/schemas/audit.ts`, add the import and schema (place near the top, after the existing imports, and export it anywhere in the file — e.g. right after the `AuditLogExportScope` block):

```ts
import { infiniteOffsetPaginationSchema } from "./pagination"
```

```ts
// Input for the page editor's "History" panel — lists ResourceUpdate audit
// log rows for one page, paginated. `pageId`/`siteId` match the shape
// `basePageSchema` (in `~/schemas/page.ts`) already uses across the page
// editor, since this is always called with the same route params.
export const listResourceUpdatesSchema = z
  .object({
    pageId: z.number().min(1),
    siteId: z.number().min(1),
  })
  .merge(infiniteOffsetPaginationSchema)
```

- [ ] **Step 4: Add the query function to `audit.service.ts`**

Open `apps/studio/src/server/modules/audit/audit.service.ts`.

Add `IsomerSchema` as a new top import:

```ts
import type { IsomerSchema } from "@opengovsg/isomer-components"
```

Change the existing `"../database"` import to also bring in `db` and `sql`:

```ts
import type {
  AuditLogEvent,
  AuditLogExportReportType,
  Blob,
  DB,
  Footer,
  Navbar,
  PushDocumentJob,
  Redirect,
  Resource,
  ResourcePermission,
  Site,
  Transaction,
  User,
  VerificationToken,
  Version,
} from "../database"
import { AuditLogEvent as AuditLogEventValue, db, sql } from "../database"
```

> Note: `AuditLogEvent` is currently imported only as a `type`. It's also used as a runtime enum value below (`AuditLogEvent.ResourceUpdate`), so keep the type import for the other type-only usages in this file and add a second, value import. If oxlint's `consistent-type-imports` rule flags the split, merge into a single non-type-only import of `AuditLogEvent` instead and drop the `AuditLogEventValue` alias — check how `auditLogExport.query.ts` imports it (`import { AuditLogEvent, db, sql } from "../database"`, a plain value import used both as a type and enum) and mirror that instead of introducing an alias.

Change `type FullResource` to `export type FullResource` (it's currently unexported; the new function needs the shape, and this is the cleanest way to reuse it):

```ts
export type FullResource =
  | WithoutMeta<Resource>
  | {
      blob: WithoutMeta<Blob>
      resource: WithoutMeta<Resource>
    }
```

Add the following at the end of the file:

```ts
export interface ResourceUpdateRow {
  id: string
  createdAt: Date
  actor: { id: string; name: string; email: string }
  beforeContent: IsomerSchema
  afterContent: IsomerSchema
}

interface ListResourceUpdatesProps {
  resourceId: number
  siteId: number
  cursor: number
  limit: number
}

interface ListResourceUpdatesResult {
  items: ResourceUpdateRow[]
  nextOffset: number | null
}

// Every `updatePageBlob` save logs a `ResourceUpdate` row even when the blob
// content didn't actually change (e.g. re-saving with no edits) — see
// `page.router.ts`. We filter those out here so the history panel only ever
// shows rows with a real content diff to render.
export const listResourceUpdates = async ({
  resourceId,
  siteId,
  cursor: offset,
  limit,
}: ListResourceUpdatesProps): Promise<ListResourceUpdatesResult> => {
  const resourceIdString = String(resourceId)

  const rows = await db
    .selectFrom("AuditLog")
    .innerJoin("User", "User.id", "AuditLog.userId")
    .select([
      "AuditLog.id as id",
      "AuditLog.createdAt",
      "AuditLog.delta",
      "User.id as actorId",
      "User.name as actorName",
      "User.email as actorEmail",
    ])
    .where("AuditLog.siteId", "=", siteId)
    .where("AuditLog.eventType", "=", AuditLogEventValue.ResourceUpdate)
    .where(
      sql<boolean>`"AuditLog"."delta" -> 'after' -> 'resource' ->> 'id' = ${resourceIdString}`,
    )
    .where(sql<boolean>`"AuditLog"."delta" -> 'before' ? 'blob'`)
    .where(sql<boolean>`"AuditLog"."delta" -> 'after' ? 'blob'`)
    .where(
      sql<boolean>`"AuditLog"."delta" -> 'before' -> 'blob' -> 'content' IS DISTINCT FROM "AuditLog"."delta" -> 'after' -> 'blob' -> 'content'`,
    )
    .orderBy("AuditLog.createdAt", "desc")
    .offset(offset)
    .limit(limit + 1)
    .execute()

  const hasMore = rows.length > limit
  const page = hasMore ? rows.slice(0, limit) : rows

  const items = page.map((row): ResourceUpdateRow => {
    const delta = row.delta as unknown as {
      before: { blob: { content: IsomerSchema } }
      after: { blob: { content: IsomerSchema } }
    }
    return {
      id: row.id,
      createdAt: row.createdAt,
      actor: { id: row.actorId, name: row.actorName, email: row.actorEmail },
      beforeContent: delta.before.blob.content,
      afterContent: delta.after.blob.content,
    }
  })

  return {
    items,
    nextOffset: hasMore ? offset + limit : null,
  }
}
```

If the `AuditLogEventValue` alias approach above trips a lint rule, replace every `AuditLogEventValue` usage with `AuditLogEvent` and change the `"../database"` imports to a single plain (non-type-only) import line, e.g.:

```ts
import type {
  AuditLogExportReportType,
  Blob,
  DB,
  Footer,
  Navbar,
  PushDocumentJob,
  Redirect,
  Resource,
  ResourcePermission,
  Site,
  Transaction,
  User,
  VerificationToken,
  Version,
} from "../database"
import { AuditLogEvent, db, sql } from "../database"
```

- [ ] **Step 5: Add the router procedure**

Open `apps/studio/src/server/modules/audit/audit.router.ts`.

Add `listResourceUpdatesSchema` to the existing `~/schemas/audit` import:

```ts
import {
  AuditLogExportScope,
  createAuditLogExportRequestServerSchema,
  getAuditLogExportWindowSchema,
  listResourceUpdatesSchema,
} from "~/schemas/audit"
```

Add a new import for the permission check and the service function:

```ts
import { bulkValidateUserPermissionsForResources } from "../permissions/permissions.service"
import {
  createAuditLogExportRequestsForSites,
  getAuditLogExportWindow,
} from "./auditLogExport.service"
import { listResourceUpdates } from "./audit.service"
```

Add the new procedure inside `auditRouter = router({ ... })`, alongside `getExportWindow`/`createExportRequest`:

```ts
  listResourceUpdates: protectedProcedure
    .input(listResourceUpdatesSchema)
    .query(async ({ ctx, input: { pageId, siteId, cursor, limit } }) => {
      await bulkValidateUserPermissionsForResources({
        siteId,
        action: "read",
        userId: ctx.user.id,
      })

      return listResourceUpdates({
        resourceId: pageId,
        siteId,
        cursor,
        limit,
      })
    }),
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `pnpm test:unit -- src/server/modules/audit/__tests__/audit.router.test.ts`

Expected: PASS (all `listResourceUpdates` tests, plus all pre-existing tests in this file still passing).

- [ ] **Step 7: Typecheck and lint**

Run: `pnpm typecheck` and `pnpm lint` (from repo root, or `apps/studio` — either works via Turborepo).

Expected: no new errors introduced by these changes. Fix any issues before proceeding (in particular, double-check the `AuditLogEvent` import approach from Step 4 against whatever oxlint reports).

- [ ] **Step 8: Commit**

```bash
git add apps/studio/src/schemas/audit.ts apps/studio/src/server/modules/audit/audit.service.ts apps/studio/src/server/modules/audit/audit.router.ts apps/studio/src/server/modules/audit/__tests__/audit.router.test.ts
git commit -m "$(cat <<'EOF'
feat(audit): add listResourceUpdates query for page history

Lists ResourceUpdate audit log rows for a page, filtered to only rows
where the blob content actually changed (every save logs a row, even
no-op resaves), cursor-paginated by offset.
EOF
)"
```

---

## Task 2: Frontend — History panel in the page editor

**Files:**
- Modify: `apps/studio/src/types/editorDrawer.ts` (add `history` to `DrawerState`)
- Modify: `apps/studio/src/features/editing-experience/components/Drawer/EditPageDrawer.tsx` (wire the new state)
- Create: `apps/studio/src/features/editing-experience/components/Drawer/HistoryStateDrawer.tsx`
- Modify: `apps/studio/src/features/editing-experience/components/Drawer/RootStateDrawer.tsx` (add the trigger button)
- Create: `apps/studio/src/features/editing-experience/components/Drawer/__tests__/HistoryStateDrawer.browser.test.tsx`
- Modify: `apps/studio/src/features/editing-experience/components/Drawer/__tests__/RootStateDrawer.browser.test.tsx` (assert the trigger button renders)

The page editor's left rail is driven by a `DrawerState` union in React context (`useEditorDrawerContext`); `EditPageDrawer.tsx` switches on `drawerState.state` to decide what to render. This task adds a new `"history"` state to that union, a `HistoryStateDrawer` component for it, and a button in the root panel (`RootStateDrawer.tsx`) that triggers it — mirroring exactly how the existing `"metadataEditor"`/`"rawJsonEditor"` states are wired.

- [ ] **Step 1: Write the failing component test**

Create `apps/studio/src/features/editing-experience/components/Drawer/__tests__/HistoryStateDrawer.browser.test.tsx`:

```tsx
import type { IsomerSchema } from "@opengovsg/isomer-components"
import { ThemeProvider } from "@opengovsg/design-system-react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { EditorDrawerProvider } from "~/contexts/EditorDrawerContext"
import { theme } from "~/theme"
import { ResourceType } from "~prisma/generated/generatedEnums"

import HistoryStateDrawer from "../HistoryStateDrawer"

vi.mock("next/router", () => ({
  useRouter: () => ({ query: { pageId: "1", siteId: "1" } }),
}))

const noop = vi.hoisted(() => vi.fn())
const mockUseInfiniteQuery = vi.hoisted(() => vi.fn())

vi.mock("~/utils/trpc", () => ({
  trpc: {
    audit: {
      listResourceUpdates: {
        useInfiniteQuery: (...args: unknown[]) =>
          mockUseInfiniteQuery(...args),
      },
    },
  },
}))

const EMPTY_PAGE: IsomerSchema = {
  page: { title: "About us", description: "About us" },
  layout: "content",
  content: [],
  version: "0.1.0",
}

const renderDrawer = () =>
  render(
    <ThemeProvider theme={theme}>
      <EditorDrawerProvider
        initialPageState={EMPTY_PAGE}
        type={ResourceType.Page}
        permalink="about-us"
        siteId={1}
        pageId={1}
        updatedAt={new Date()}
        title="About us"
      >
        <HistoryStateDrawer />
      </EditorDrawerProvider>
    </ThemeProvider>,
  )

describe("HistoryStateDrawer", () => {
  it("shows an empty state when there are no changes", () => {
    // Arrange
    mockUseInfiniteQuery.mockReturnValue({
      data: { pages: [{ items: [], nextOffset: null }] },
      fetchNextPage: noop,
      hasNextPage: false,
      isFetchingNextPage: false,
      isLoading: false,
    })

    // Act
    renderDrawer()

    // Assert
    expect(screen.queryByText("No changes yet")).not.toBeNull()
  })

  it("renders one row per ResourceUpdate entry with a View changes button", () => {
    // Arrange
    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          {
            items: [
              {
                id: "1",
                createdAt: new Date("2026-01-01T00:00:00Z"),
                actor: {
                  id: "u1",
                  name: "Alice",
                  email: "alice@example.com",
                },
                beforeContent: EMPTY_PAGE,
                afterContent: EMPTY_PAGE,
              },
              {
                id: "2",
                createdAt: new Date("2026-01-02T00:00:00Z"),
                actor: { id: "u2", name: "Bob", email: "bob@example.com" },
                beforeContent: EMPTY_PAGE,
                afterContent: EMPTY_PAGE,
              },
            ],
            nextOffset: null,
          },
        ],
      },
      fetchNextPage: noop,
      hasNextPage: false,
      isFetchingNextPage: false,
      isLoading: false,
    })

    // Act
    renderDrawer()

    // Assert
    expect(
      screen.getAllByRole("button", { name: "View changes" }),
    ).toHaveLength(2)
    expect(screen.queryByText("Alice")).not.toBeNull()
    expect(screen.queryByText("Bob")).not.toBeNull()
  })

  it("calls fetchNextPage when Load more is clicked", () => {
    // Arrange
    const fetchNextPage = vi.fn()
    mockUseInfiniteQuery.mockReturnValue({
      data: { pages: [{ items: [], nextOffset: 20 }] },
      fetchNextPage,
      hasNextPage: true,
      isFetchingNextPage: false,
      isLoading: false,
    })
    renderDrawer()

    // Act
    screen.getByRole("button", { name: "Load more" }).click()

    // Assert
    expect(fetchNextPage).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test:unit -- src/features/editing-experience/components/Drawer/__tests__/HistoryStateDrawer.browser.test.tsx`

Expected: FAIL — `../HistoryStateDrawer` does not exist.

- [ ] **Step 3: Add `history` to the `DrawerState` union**

Open `apps/studio/src/types/editorDrawer.ts`. Add a new interface and include it in the union:

```ts
interface HistoryDrawerState {
  state: "history"
}
```

```ts
export type DrawerState =
  | RootDrawerState
  | RawJsonEditorModeDrawerState
  | AddNewBlockState
  | NativeEditorState
  | ComplexEditorState
  | MetadataEditorState
  | DatabaseEditorState
  | HeroEditorState
  | CollectionEditorState
  | SiderailOrderingEditorState
  | HistoryDrawerState
```

- [ ] **Step 4: Create `HistoryStateDrawer.tsx`**

Create `apps/studio/src/features/editing-experience/components/Drawer/HistoryStateDrawer.tsx`:

```tsx
import { Box, Button, Divider, Flex, Text, VStack } from "@chakra-ui/react"
import { format } from "date-fns"
import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { useQueryParse } from "~/hooks/useQueryParse"
import { trpc } from "~/utils/trpc"

import { pageSchema } from "../../schema"
import { DrawerHeader } from "./DrawerHeader"

const PAGE_SIZE = 20

export default function HistoryStateDrawer(): JSX.Element {
  const { setDrawerState } = useEditorDrawerContext()
  const { pageId, siteId } = useQueryParse(pageSchema)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    trpc.audit.listResourceUpdates.useInfiniteQuery(
      { pageId, siteId, limit: PAGE_SIZE },
      { getNextPageParam: (lastPage) => lastPage.nextOffset },
    )

  const rows = data?.pages.flatMap((resultPage) => resultPage.items) ?? []

  return (
    <Flex direction="column" h="full">
      <DrawerHeader
        label="Page history"
        onBackClick={() => setDrawerState({ state: "root" })}
      />
      <VStack
        align="stretch"
        spacing="0.75rem"
        p="1.5rem"
        overflowY="auto"
        flex={1}
      >
        {isLoading && <Text textStyle="body-2">Loading...</Text>}
        {!isLoading && rows.length === 0 && (
          <Text textStyle="body-2" color="base.content.medium">
            No changes yet
          </Text>
        )}
        {rows.map((row, index) => (
          <Box key={row.id}>
            <Flex justify="space-between" align="center" py="0.5rem">
              <Box>
                <Text textStyle="body-2">
                  {format(row.createdAt, "d MMM yyyy, h:mm a")}
                </Text>
                <Text textStyle="caption-2" color="base.content.medium">
                  {row.actor.name}
                </Text>
              </Box>
              <Button
                size="xs"
                variant="outline"
                onClick={() => {
                  // TODO(phase 2): wire this to the diffDOM visual diff view.
                }}
              >
                View changes
              </Button>
            </Flex>
            {index < rows.length - 1 && <Divider />}
          </Box>
        ))}
        {hasNextPage && (
          <Button
            variant="link"
            size="xs"
            alignSelf="center"
            isLoading={isFetchingNextPage}
            onClick={() => fetchNextPage()}
          >
            Load more
          </Button>
        )}
      </VStack>
    </Flex>
  )
}
```

- [ ] **Step 5: Wire `"history"` into `EditPageDrawer.tsx`**

Open `apps/studio/src/features/editing-experience/components/Drawer/EditPageDrawer.tsx`.

Add the import alongside the other drawer imports:

```ts
import HistoryStateDrawer from "./HistoryStateDrawer"
```

Add a case in the `switch (currState.state)` block, next to the other simple cases (e.g. right after `case "metadataEditor": return <MetadataEditorStateDrawer />`):

```ts
    case "history":
      return <HistoryStateDrawer />
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `pnpm test:unit -- src/features/editing-experience/components/Drawer/__tests__/HistoryStateDrawer.browser.test.tsx`

Expected: PASS (all three tests).

- [ ] **Step 7: Add the trigger button to `RootStateDrawer.tsx`**

Open `apps/studio/src/features/editing-experience/components/Drawer/RootStateDrawer.tsx`.

Add `BiHistory` to the existing `react-icons/bi` import:

```ts
import {
  BiCog,
  BiData,
  BiHistory,
  BiPin,
  BiPlus,
  BiPlusCircle,
  BiSlider,
} from "react-icons/bi"
```

Insert a new button right before the `{isUserIsomerAdmin && (<ActivateRawJsonEditorMode .../>)}` block, inside the outer `<VStack gap="1.5rem" p="1.5rem" flex={1}>`:

```tsx
        <Button
          variant="link"
          gap="0.25rem"
          alignSelf="flex-start"
          onClick={() => setDrawerState({ state: "history" })}
        >
          <Icon
            as={BiHistory}
            color="interaction.main.default"
            boxSize="1.25rem"
          />
          <Text textStyle="subhead-2" color="interaction.links.default">
            View page history
          </Text>
        </Button>

        {isUserIsomerAdmin && (
          <ActivateRawJsonEditorMode
            onActivate={() => setDrawerState({ state: "rawJsonEditor" })}
          />
        )}
```

- [ ] **Step 8: Assert the trigger button in the existing `RootStateDrawer` test**

Open `apps/studio/src/features/editing-experience/components/Drawer/__tests__/RootStateDrawer.browser.test.tsx` and add one assertion to the existing `"allows adding blocks on a regular content page"` test (after its existing assertions):

```ts
    expect(
      screen.queryByRole("button", { name: "View page history" }),
    ).not.toBeNull()
```

- [ ] **Step 9: Run both drawer test files to verify everything passes**

Run: `pnpm test:unit -- src/features/editing-experience/components/Drawer/__tests__/HistoryStateDrawer.browser.test.tsx src/features/editing-experience/components/Drawer/__tests__/RootStateDrawer.browser.test.tsx`

Expected: PASS (all tests in both files).

- [ ] **Step 10: Typecheck and lint**

Run: `pnpm typecheck` and `pnpm lint`.

Expected: no new errors. In particular, confirm the `default: const _: never = currState` exhaustiveness check at the bottom of `EditPageDrawer.tsx`'s switch still compiles now that `"history"` is a handled case.

- [ ] **Step 11: Commit**

```bash
git add apps/studio/src/types/editorDrawer.ts apps/studio/src/features/editing-experience/components/Drawer/EditPageDrawer.tsx apps/studio/src/features/editing-experience/components/Drawer/HistoryStateDrawer.tsx apps/studio/src/features/editing-experience/components/Drawer/RootStateDrawer.tsx apps/studio/src/features/editing-experience/components/Drawer/__tests__/HistoryStateDrawer.browser.test.tsx apps/studio/src/features/editing-experience/components/Drawer/__tests__/RootStateDrawer.browser.test.tsx
git commit -m "$(cat <<'EOF'
feat(editing-experience): add page history panel

Adds a "View page history" button to the editor's root panel, opening
a new History drawer state that lists ResourceUpdate audit log entries
for the page via audit.listResourceUpdates. The "View changes" button
per row is a placeholder — Phase 2 wires it to the diffDOM visual diff.
EOF
)"
```

---

## Task 3: Manual smoke test

- [ ] **Step 1: Start the dev server**

Run (from `apps/studio`): `pnpm dev`

- [ ] **Step 2: Exercise the happy path**

1. Open any existing page in the Studio editor (`/sites/<siteId>/pages/<pageId>`).
2. Edit a block and save, so the page has at least one real `ResourceUpdate` with a content diff.
3. Click "View page history" in the left rail.
4. Confirm: the History panel opens, shows a row for the save you just made (timestamp + your name), with a "View changes" button. Clicking "View changes" does nothing yet (expected — Phase 2).
5. Click the back arrow in the panel header — confirm it returns to the root editor panel.
6. Open a page that has never been edited (no qualifying `ResourceUpdate` rows) — confirm the panel shows "No changes yet" instead of an empty list or an error.

- [ ] **Step 3: Check the browser console**

Confirm no new console errors/warnings appear while opening/closing the History panel.

---

## Self-review notes (for whoever executes this plan)

- Task 1 Step 4 flags a real uncertainty (the `AuditLogEvent` type-vs-value import split) with an explicit, concrete fallback — resolve it via Step 7's lint run, don't guess silently.
- The "View changes" button is intentionally a no-op in this plan (Phase 1 scope, per the design spec's Non-goals section). Do not implement diff rendering as part of this plan.
- If `pnpm services:setup` reports Postgres is already running, skip it and proceed directly to the test command.
