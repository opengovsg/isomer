import { test } from "@playwright/test"
import crypto from "crypto"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import { CollectionLinkPO } from "~e2e/fixtures/po"
import {
  expectResourceDraftBlobContains,
  seedCollection,
  seedCollectionLink,
  seedRootPage,
} from "~e2e/fixtures/resource"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { RoleType } from "~prisma/generated/generatedEnums"

// Internal-link persistence (PAGE_EDITOR_E2E_SPEC.md 3.5), tested via a
// Collection item's `ref` field rather than a prose-block hyperlink: both
// share the same `LinkEditorModal`/`ResourceSelector` machinery
// (`BaseLinkControl`, `src/features/editing-experience/components/form-builder/renderers/controls/BaseLinkControl.tsx`),
// and `edit-collection-link.test.ts` already proves out the "open picker ->
// pick a link type -> Add link -> Save" flow for the External type. This
// reuses that same proven flow for the Page type instead.
let siteId: number
let collectionId: string

test.beforeAll(async () => {
  const site = await provisionE2ESite({ roles: [RoleType.Editor] })
  siteId = site.siteId
  const { collection } = await seedCollection({ siteId })
  collectionId = collection.id
})

test.describe("editor", { tag: roleTag("editor") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.editor)
  })

  test("internal link to another page persists after save and reload", async ({
    page,
  }) => {
    const suffix = crypto.randomUUID().slice(0, 8)
    const linkTitle = `E2E Internal Link Source ${suffix}`
    const targetPageTitle = `E2E Internal Link Target ${suffix}`
    const linkEditor = new CollectionLinkPO(page)

    // Arrange
    const { collectionLink } = await seedCollectionLink({
      siteId,
      collectionId,
      linkTitle,
    })
    const { page: targetPage } = await seedRootPage({
      siteId,
      pageTitle: targetPageTitle,
    })
    await linkEditor.gotoLink(siteId, collectionLink.id)
    await linkEditor.expectLoaded()

    // Act
    await linkEditor.addInternalLink(targetPageTitle)
    await linkEditor.save()

    // Assert
    await expectResourceDraftBlobContains(
      collectionLink.id,
      `[resource:${siteId}:${targetPage.id}]`,
    )
    await linkEditor.reload()
    await linkEditor.expectLoaded()
    await linkEditor.expectInternalLinkTarget(targetPage.permalink)
  })
})
