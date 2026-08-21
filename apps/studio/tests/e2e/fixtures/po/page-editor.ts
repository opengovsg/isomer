import { expect, type Page } from "@playwright/test"

/** Exact key sequence `ActivateRawJsonEditorMode.tsx` listens for on `window`
 * (any wrong key resets progress to 0) — kept local to the PO rather than
 * imported from app code, per e2e convention. */
const RAW_JSON_EDITOR_COMBO = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
] as const

export class PageEditorPO {
  constructor(private readonly page: Page) {}

  async gotoPage(siteId: number, pageId: string) {
    await this.page.goto(`/sites/${siteId}/pages/${pageId}`)
    await this.page.waitForURL(new RegExp(`/sites/${siteId}/pages/${pageId}`))
  }

  async expectLoaded() {
    await expect(
      this.page.getByRole("link", { name: "Meta Settings" }),
    ).toBeVisible()
  }

  async reload() {
    await this.page.reload()
  }

  async addTextBlock() {
    await this.page.getByRole("button", { name: "Add block" }).click()
    await this.page
      .getByRole("button", { name: /^Text Add text, links, lists/i })
      .click()
  }

  async addAndFillTextBlock(text: string) {
    await this.addTextBlock()
    await this.page.getByRole("textbox").first().fill(text)
    await this.saveBlockChanges()
  }

  // Open block drawer by accessible name; fill the first textbox.
  async fillBlock(label: string, text: string) {
    await this.page
      .getByRole("button", { name: new RegExp(label, "i") })
      .click({ force: true })
    await this.page.getByRole("textbox").first().fill(text)
  }

  async saveBlockChanges() {
    await this.page.getByRole("button", { name: "Save changes" }).click()
    await expect(this.page.getByText(/Changes saved/)).toBeVisible()
  }

  async editProseBlock(previewLabel: string, text: string) {
    await this.fillBlock(previewLabel, text)
    await this.saveBlockChanges()
  }

  /** The prose (TipTap) editor exposes its contenteditable region as a plain
   * textbox role, not a labeled form control — use this instead of
   * `expectFormFieldValue` for its content. */
  async expectProseTextboxContains(text: string) {
    await expect(this.page.getByRole("textbox").first()).toContainText(text)
  }

  async expectBlockPreview(text: string) {
    await expect(
      this.page.getByRole("button", { name: new RegExp(text, "i") }),
    ).toBeVisible()
  }

  /** JsonForms text/textarea controls set `placeholder={label}` but do not wire
   * `FormLabel` to the input via `htmlFor`, so `getByLabel` cannot resolve them. */
  #jsonFormsField(label: string) {
    return this.page.getByPlaceholder(label, { exact: true })
  }

  async editArticleHeaderSummary(summary: string) {
    await this.page
      .getByRole("button", { name: "Article page header" })
      .click({ force: true })
    await this.#jsonFormsField("Article summary").fill(summary)
    await this.saveBlockChanges()
  }

  async expectArticleHeaderSummary(summary: string) {
    await this.page
      .getByRole("button", { name: "Article page header" })
      .click({ force: true })
    await expect(this.#jsonFormsField("Article summary")).toHaveValue(summary)
  }

  async clickPublish() {
    await this.page
      .getByRole("button", { name: "Publish", exact: true })
      .click()
    await this.page.getByRole("button", { name: "Publish now" }).click()
  }

  async expectPublishedToast() {
    await this.page
      .getByText("Page published successfully")
      .first()
      .waitFor({ state: "visible" })
  }

  async expectPublishConflictError(permalink: string) {
    await expect(
      this.page.getByText(
        `Can't publish — a redirect already exists at ${permalink}. Remove it on the Redirections page first.`,
      ),
    ).toBeVisible()
  }

  /** Generic error toast shown by `RootStateDrawer.tsx`'s `reorderBlock`
   * `onError` — not conflict-specific UI, just the mutation's `error.message`
   * (e.g. the `reorderBlock` router's stale-draft `CONFLICT` copy) rendered
   * verbatim as the toast description under a fixed title. */
  async expectReorderConflictToast() {
    await this.page
      .getByText("Failed to update blocks")
      .first()
      .waitFor({ state: "visible" })
    await expect(
      this.page.getByText(
        "Someone on your team has changed this page, refresh the page and try again",
      ),
    ).toBeVisible()
  }

  async dismissPublishConfirmation() {
    await this.page.getByRole("button", { name: "No, don't publish" }).click()
  }

  async cancelPublishConfirmation() {
    await this.page
      .getByRole("button", { name: "Publish", exact: true })
      .click()
    await this.page.getByRole("button", { name: "No, don't publish" }).click()
    await expect(this.page.getByText("Publish this page?")).not.toBeVisible()
  }

  async expectPublishButtonVisible() {
    await expect(
      this.page.getByRole("button", { name: "Publish", exact: true }),
    ).toBeVisible()
  }

  async expectPublishButtonDisabled() {
    await expect(
      this.page.getByRole("button", { name: "Publish", exact: true }),
    ).toBeDisabled()
  }

  async expectPublishButtonEnabled() {
    await expect(
      this.page.getByRole("button", { name: "Publish", exact: true }),
    ).toBeEnabled()
  }

  async expectScheduleOptionsDisabled() {
    await expect(
      this.page.getByRole("button", { name: "More options" }),
    ).toBeDisabled()
  }

  async openScheduleModal() {
    const publish = this.page.getByRole("button", {
      name: "Publish",
      exact: true,
    })
    await expect(publish).toBeVisible()
    await expect(publish).toBeEnabled()
    await this.page.getByRole("button", { name: "More options" }).click()
    await this.page
      .getByRole("menuitem", { name: /Schedule for later/i })
      .click()
    await expect(
      this.page.getByText("When should we publish this page?"),
    ).toBeVisible()
  }

  /** `quickSelectLabel` must match one of QUICK_SELECT_TIMES' rendered labels
   * exactly (e.g. "9:00 AM", "5:00 PM") — pass a different label than a prior
   * call to reschedule to a distinct time. Matching by exact label, rather
   * than position, avoids ambiguity with the (also form-scoped) TimeSelect
   * control, which renders the same label text once a time is selected. */
  async schedulePublishForToday(quickSelectLabel = "5:00 PM") {
    await this.page
      .getByRole("button", { name: "Select from date picker." })
      .click()
    await this.page.getByRole("button", { name: "Today" }).click()
    await this.page
      .locator("form")
      .getByText(quickSelectLabel, { exact: true })
      .click()
    await this.page.getByRole("button", { name: "Schedule publish" }).click()
  }

  async expectScheduledSuccessfully() {
    await expect(
      this.page.getByText("Page scheduled successfully"),
    ).toBeVisible()
  }

  async expectCancelScheduleVisible() {
    await expect(
      this.page.getByRole("button", { name: "Cancel schedule" }),
    ).toBeVisible()
  }

  async cancelSchedule() {
    await this.page.getByRole("button", { name: "Cancel schedule" }).click()
    await this.page
      .getByRole("button", { name: "Yes, cancel the schedule" })
      .click()
    await expect(
      this.page.getByText("Schedule cancelled successfully"),
    ).toBeVisible()
  }

  async expectScheduledEditingRestrictionBanner() {
    await expect(
      this.page.getByText(
        "This page is scheduled for publishing. To make changes, cancel the schedule first.",
      ),
    ).toBeVisible()
  }

  // --- Preview iframe ---

  previewFrame() {
    return this.page.frameLocator('[data-testid="preview-iframe"]')
  }

  /** `exact` disambiguates default placeholder text that is a literal
   * substring of other text already on the page (e.g. `callout`'s default
   * "Callout content" vs. the integration seed's default callout block,
   * whose text is "Test Callout content" — a non-exact match would resolve
   * to both blocks' paragraphs and violate Playwright's strict mode). */
  async expectPreviewContains(text: string, options?: { exact?: boolean }) {
    await expect(
      this.previewFrame().getByText(text, options).first(),
    ).toBeVisible()
  }

  /** `map`/`formsg` render a plain `<iframe title={title}>` directly (no
   * lazy-activation gate, unlike `video`) — matched on the `title` attribute
   * since iframes have no reliably queryable ARIA role across browsers. */
  async expectPreviewIframeTitle(title: string) {
    await expect(this.previewFrame().getByTitle(title)).toBeVisible()
  }

  /** `video`'s YouTube embed (`LiteYouTubeEmbed`) is lazy-activated: the real
   * `<iframe title={title}>` only mounts after the placeholder is clicked, so
   * asserting on it directly would require actually loading an external
   * video. Before activation, the placeholder is a button whose accessible
   * name is `Play ${title}` — asserting on that instead proves the block
   * rendered with the correct title without depending on network access. */
  async expectPreviewVideoPlayButtonVisible(title: string) {
    await expect(
      this.previewFrame().getByRole("button", { name: title }),
    ).toBeVisible()
  }

  /** `imagegallery` renders 3 default images sharing identical placeholder
   * `alt`/`caption` text, duplicated further across its main slideshow and
   * thumbnail strip — text/role-based matching on those would violate
   * Playwright's strict mode. The outer `<section role="region"
   * aria-label="Image gallery">` wrapper is unique and proves the block
   * rendered, which is all this smoke-level check needs. */
  async expectPreviewRegionVisible(name: string) {
    await expect(
      this.previewFrame().getByRole("region", { name }),
    ).toBeVisible()
  }

  /** Asserts an `<img>` with the given accessible name (its `alt` attribute,
   * per `ImageClient.tsx`) renders in the preview — used instead of
   * `expectPreviewContains` for image/imagegallery blocks, since alt text
   * isn't visible page text. */
  async expectPreviewImageVisible(altText: string) {
    // Placeholder images can be present in the DOM but not painted as visible
    // (zero intrinsic size / lazy-load gates) — attached + correct alt is enough
    // for these smoke-level default-content checks.
    await expect(
      this.previewFrame().locator(`img[alt="${altText}"]`),
    ).toBeAttached()
  }

  /** Asserts a link to a child page renders in the preview — the
   * `childrenpages` block's `RowLayout`/`BoxLayout` (`ChildrenPages.tsx`)
   * wraps each child in a `<Link>` whose accessible name is the child's
   * title (plus its summary text too, when `showSummary` is on) — matched by
   * substring rather than an exact name for that reason. */
  async expectPreviewChildPageLink(childPageTitle: string) {
    await expect(
      this.previewFrame().getByRole("link", { name: childPageTitle }),
    ).toBeVisible()
  }

  // --- Block picker / add block ---

  async openAddBlockPicker() {
    await this.page.getByRole("button", { name: "Add block" }).click()
  }

  /** Scoped to the block's exact caption-1 label text, not a regex over the
   * full accessible name (label + description). Several labels are literal
   * prefixes of others' accessible names when concatenated with their
   * description — e.g. "Image" vs "Image gallery" vs "Image with text", all
   * present together on the Content-layout picker — so a `^label\b` regex
   * against the full name would match more than one option. */
  #blockPickerOption(label: string) {
    return this.page
      .getByRole("button")
      .filter({ has: this.page.getByText(label, { exact: true }) })
  }

  /** `label` must match a block's exact picker label (e.g. "Text", "Quote", "Image"). */
  async addBlockByLabel(label: string) {
    await this.openAddBlockPicker()
    await this.#blockPickerOption(label).click()
  }

  async expectBlockPickerOptionVisible(label: string) {
    await expect(this.#blockPickerOption(label)).toBeVisible()
  }

  async expectBlockPickerOptionHidden(label: string) {
    await expect(this.#blockPickerOption(label)).toHaveCount(0)
  }

  async closeBlockPicker() {
    await this.page.getByRole("button", { name: "Cancel" }).click()
  }

  // --- Complex (JSON-schema/FormBuilder) block editing ---
  // Distinct from prose blocks: these blocks render via `ComplexEditorStateDrawer`,
  // whose Save button reads "Save block" (prose's own drawer says "Save changes").

  async openBlockEditor(previewLabel: string | RegExp) {
    const name =
      typeof previewLabel === "string"
        ? new RegExp(previewLabel, "i")
        : previewLabel
    await this.page.getByRole("button", { name }).first().click({ force: true })
  }

  async fillFormFieldByLabel(label: string, text: string) {
    await this.#jsonFormsField(label).fill(text)
  }

  /**
   * `collectionblock`'s `collectionReferenceLink` field renders as an ODS
   * `SingleSelect` (`JsonFormsCollectionDropdownControl`), not a plain input —
   * same "not labelled by the FormLabel" situation as `CollectionPO`'s
   * `chooseSortOrder`/`selectTagOption` (scope via the FormControl `group`,
   * since the combobox's own accessible name doesn't resolve through
   * `getByLabel`). Filtered by the field's description text rather than its
   * "Collection" title, since that title is a substring of other sibling
   * fields' descriptions on this block (e.g. `buttonLabel`'s description
   * mentions "the main collection").
   */
  async selectCollection(collectionTitle: string) {
    await this.page
      .getByRole("group")
      .filter({ hasText: "The collection to display pages from" })
      .getByRole("combobox")
      .click()
    await this.page.getByRole("option", { name: collectionTitle }).click()
  }

  async saveComplexBlock() {
    await this.page.getByRole("button", { name: "Save block" }).click()
    await expect(this.page.getByText(/Changes saved/)).toBeVisible()
  }

  async expectSaveBlockButtonDisabled() {
    await expect(
      this.page.getByRole("button", { name: "Save block" }),
    ).toBeDisabled()
  }

  async expectSaveBlockButtonEnabled() {
    await expect(
      this.page.getByRole("button", { name: "Save block" }),
    ).toBeEnabled()
  }

  async expectFieldErrorText(text: string | RegExp) {
    await expect(this.page.getByText(text)).toBeVisible()
  }

  // --- Reorder (keyboard-based drag, mirrors collection.ts's reorderDraggableDown) ---
  // The drag handle (`BaseBlockDragHandle`) is a *nested* <button> inside the
  // block row's own <button> (`BaseBlock`) — not a sibling.

  #blockDragHandle(previewLabel: string) {
    return this.page
      .getByRole("button", { name: new RegExp(previewLabel, "i") })
      .getByRole("button")
  }

  async reorderBlockDown(previewLabel: string) {
    const handle = this.#blockDragHandle(previewLabel)
    await expect(handle).toBeVisible()
    await handle.focus()
    await this.page.keyboard.press("Space")
    await this.page.keyboard.press("ArrowDown")
    await this.page.keyboard.press("Space")
  }

  async reorderBlockUp(previewLabel: string) {
    const handle = this.#blockDragHandle(previewLabel)
    await expect(handle).toBeVisible()
    await handle.focus()
    await this.page.keyboard.press("Space")
    await this.page.keyboard.press("ArrowUp")
    await this.page.keyboard.press("Space")
  }

  async expectBlockOrder(previewLabels: string[]) {
    const blocks = this.page.getByRole("button", {
      name: new RegExp(previewLabels.join("|"), "i"),
    })
    await expect(blocks).toHaveCount(previewLabels.length)
    for (const [index, label] of previewLabels.entries()) {
      await expect(blocks.nth(index)).toHaveAccessibleName(
        new RegExp(label, "i"),
      )
    }
  }

  // --- Delete block ---

  async openDeleteBlockModal() {
    await this.page.getByRole("button", { name: "Delete block" }).click()
  }

  async confirmDeleteBlock() {
    await this.page.getByRole("button", { name: "Yes, delete" }).click()
  }

  async cancelDeleteBlock() {
    await this.page.getByRole("button", { name: "Go back to editing" }).click()
    // Delete modal is scoped to the open block drawer — returning to the block
    // list is required before block-row preview buttons are queryable again.
    await this.clickDrawerBack()
  }

  async expectBlockAbsent(previewLabel: string) {
    await expect(
      this.page.getByRole("button", { name: new RegExp(previewLabel, "i") }),
    ).toHaveCount(0)
  }

  // --- Discard-changes modal (drawer back button) ---

  async clickDrawerBack() {
    await this.page
      .getByRole("button", { name: "Return to previous step" })
      .click()
  }

  async expectDiscardChangesModalVisible() {
    await expect(
      this.page.getByText("Are you sure you want to discard your changes?"),
    ).toBeVisible()
  }

  async expectDiscardChangesModalHidden() {
    await expect(
      this.page.getByText("Are you sure you want to discard your changes?"),
    ).not.toBeVisible()
  }

  async clickStayEditing() {
    await this.page.getByRole("button", { name: "Go back to editing" }).click()
  }

  async clickConfirmDiscard() {
    await this.page
      .getByRole("button", { name: "Yes, discard changes" })
      .click()
  }

  async expectAtBlockListRoot() {
    await expect(
      this.page.getByRole("button", { name: "Add block" }),
    ).toBeVisible()
  }

  // --- Meta Settings ---
  // Opens `MetadataEditorStateDrawer` via the layout-specific "page header"
  // block in the block-list root — NOT the top-nav "Meta Settings" tab. That
  // link navigates to a separate `/settings` route (`pages/sites/[siteId]/pages/[pageId]/settings.tsx`)
  // which renders the full unscoped metadata schema in its own autosave-on-blur
  // form (toast "Saved page metadata", no "Save changes" button) — a
  // different surface entirely from the "Save changes" / "Changes saved"
  // drawer exercised here. Each BaseBlock's accessible name also includes its
  // description text, so this is a start-anchored substring match, not an
  // exact label (mirrors the existing `editArticleHeaderSummary` pattern).

  async openMetaSettings() {
    await this.page
      .getByRole("button", {
        name: /^(Content page header|Article page header|Page header|Header|Database page header)\b/,
      })
      .click({ force: true })
  }

  async saveMetaSettings() {
    await this.page.getByRole("button", { name: "Save changes" }).click()
    await expect(this.page.getByText(/Changes saved/)).toBeVisible()
  }

  async expectSaveMetaSettingsDisabled() {
    await expect(
      this.page.getByRole("button", { name: "Save changes" }),
    ).toBeDisabled()
  }

  async expectSaveMetaSettingsEnabled() {
    await expect(
      this.page.getByRole("button", { name: "Save changes" }),
    ).toBeEnabled()
  }

  async expectFormFieldValue(label: string, value: string) {
    await expect(this.#jsonFormsField(label)).toHaveValue(value)
  }

  /** The "Button destination" field (`format: "link"`) renders via
   * `BaseLinkControl`/`LinkEditorModal` — not a plain input — so it can't be
   * filled via `fillFormFieldByLabel`. Mirrors `CollectionLinkPO.addExternalLink`,
   * the same underlying component.
   *
   * Hero (and any grouped schema) can render more than one of these — pass
   * `sectionHeading` (the JsonForms Group heading, e.g. "Primary Call-to-Action")
   * to pick the right control. */
  async fillButtonDestination(
    url: string,
    options?: { sectionHeading?: string },
  ) {
    const trigger = options?.sectionHeading
      ? this.page
          .getByRole("heading", {
            name: options.sectionHeading,
            exact: true,
          })
          .locator(
            "xpath=ancestor::div[.//button[contains(., 'Link something')]][1]",
          )
          .getByRole("button", { name: "Link something..." })
      : this.page.getByRole("button", { name: "Link something..." })
    await trigger.click()
    const dialog = this.page.getByRole("dialog")
    await dialog.getByText("External", { exact: true }).click()
    await dialog.getByPlaceholder("www.isomer.gov.sg").fill(url)
    await dialog.getByRole("button", { name: "Add link" }).click()
  }

  async expectButtonDestinationHref(href: string) {
    await expect(this.page.getByText(href, { exact: true })).toBeVisible()
  }

  /**
   * ODS DatePicker (`allowManualInput`) — the FormLabel is not wired via
   * `htmlFor`, so match the visible "DD/MM/YYYY" placeholder instead of
   * `getByLabel("Article date")`.
   */
  async fillArticleDate(date: string) {
    const input = this.page.getByPlaceholder("DD/MM/YYYY")
    await input.fill(date)
    await input.blur()
  }

  async expectArticleDate(date: string) {
    await expect(this.page.getByPlaceholder("DD/MM/YYYY")).toHaveValue(date)
  }

  /**
   * Optional `page.image` is not mounted until its object switch is on —
   * FileAttachment (`file-upload`) is not in the DOM otherwise.
   */
  async enableThumbnail() {
    const toggle = this.page.getByLabel("Set a thumbnail image")
    if (!(await toggle.isChecked())) {
      await toggle.click({ force: true })
    }
  }

  /** `page.image` (thumbnail) on Content/Article/Index/Database headers. */
  async uploadThumbnail(
    file: string | { name: string; mimeType: string; buffer: Buffer },
    alt: string,
  ) {
    await this.enableThumbnail()
    await this.uploadImage(file)
    const filename =
      typeof file === "string" ? (file.split("/").pop() ?? "") : file.name
    await expect(this.imageFilenameText(filename)).toBeVisible()
    await this.fillFormFieldByLabel("Alternate text", alt)
  }

  async openSeoSettings() {
    await this.page.getByRole("link", { name: "Meta Settings" }).click()
    await this.page.waitForURL(/\/pages\/\d+\/settings$/)
  }

  async openHeroEditor() {
    await this.page
      .getByRole("button", { name: /^Hero banner\b/ })
      .click({ force: true })
    await expect(this.page.getByText("Edit Hero banner")).toBeVisible()
  }

  async selectHeroVariant(name: string) {
    // Chakra radio's visual control intercepts pointer events on the
    // native input — same as `CollectionPO.chooseLayout`.
    await this.page.getByRole("radio", { name }).click({ force: true })
  }

  async openDatabaseEditor() {
    await this.openBlockEditor("Database")
    await this.expectDatabaseEditorOpen()
  }

  async openDgsDatasetModal() {
    const dgsRadio = this.page.getByRole("radio", { name: /DGS/i })
    if ((await dgsRadio.isVisible()) && !(await dgsRadio.isChecked())) {
      // Chakra radio's visual control intercepts pointer events on the
      // native input — same as `CollectionPO.chooseLayout`.
      await dgsRadio.click({ force: true })
    }
    await this.page.getByRole("button", { name: "Edit" }).click()
    await expect(
      this.page.getByRole("dialog").getByText("Link a dataset"),
    ).toBeVisible()
  }

  async fillDgsDatasetUrl(url: string) {
    const input = this.page.getByPlaceholder("Paste dataset URL here")
    await input.fill(url)
    await input.blur()
  }

  async expectValidCsvDataset() {
    await expect(this.page.getByText("Valid CSV dataset")).toBeVisible()
  }

  async saveDgsDatasetId() {
    const save = this.page.getByRole("button", { name: "Save Dataset ID" })
    await expect(save).toBeEnabled()
    await save.click()
    await expect(this.page.getByRole("dialog")).toBeHidden()
  }

  async expectDgsDatasetUrlContains(datasetId: string) {
    await expect(this.page.getByText(datasetId, { exact: false })).toBeVisible()
  }

  // --- Image / Image gallery blocks: upload, replace, remove ---
  // Both block types render `src`/`alt`/`caption` via the same
  // `JsonFormsImageControl`/`FileAttachment`/`AttachmentData` components used
  // by Site Settings' logo/favicon upload (`fixtures/po/site-settings.ts`) —
  // method shapes below mirror that PO. Add either block via the existing
  // `addBlockByLabel("Image")` / `addBlockByLabel("Image gallery")`.

  /**
   * The upload dropzone's underlying file input (`FileAttachment.tsx`,
   * `name="file-upload"`). Visually hidden by design — usable with
   * `setInputFiles()`, never assert visibility on it directly. Assumes only
   * one image upload control is visible at a time (the currently open
   * block or nested-item drawer).
   */
  imageUploadInput() {
    return this.page.getByTestId("file-upload")
  }

  async uploadImage(
    file: string | { name: string; mimeType: string; buffer: Buffer },
  ) {
    // Newly-added image blocks inherit `DEFAULT_BLOCKS.image.src` — the control
    // shows `AttachmentData` (not the empty dropzone) until that placeholder
    // file is removed.
    const removeButton = this.removeUploadedImageButton()
    if (await removeButton.isVisible()) {
      await removeButton.click()
    }
    await this.imageUploadInput().setInputFiles(file)
  }

  /**
   * "Remove file" trash IconButton shown by `AttachmentData` once an image
   * has been uploaded — same generic aria-label as `SitePO`'s
   * `removeUploadedFileButton`. Clearing it restores the empty dropzone.
   */
  removeUploadedImageButton() {
    return this.page.getByRole("button", { name: "Remove file" })
  }

  imageFilenameText(filename: string) {
    return this.page.getByText(filename, { exact: true })
  }

  // --- Image gallery array items (nested item drawer) ---
  // `imagegallery`'s `images` array renders each item via
  // `JsonFormsArrayControl`'s `NestedDrawerSwitch`: "Add item" immediately
  // opens the new item's own sub-drawer (same `src`/`alt`/`caption` controls
  // as the plain image block); the list of already-added items is only
  // visible again after returning from that sub-drawer.

  async addGalleryItem() {
    await this.page.getByRole("button", { name: "Add item" }).click()
  }

  /**
   * `nameOrRegex` matches a gallery item row's accessible name. Once an
   * image is uploaded, the row's label is the raw `src` value (a full
   * upload path, not just the filename) — match on a filename substring
   * rather than the exact string. Before an image is set, rows fall back to
   * "Item 1", "Item 2", etc. (`DraggableTagButton`'s `childLabel` fallback).
   */
  async openGalleryItem(nameOrRegex: string | RegExp) {
    // Row labels render as visible text inside a nested `<button>`; matching on
    // `hasText` is more reliable than `getByRole('button', { name })` once the
    // label is a full upload path rather than a short "Item N" fallback.
    await this.page
      .locator("button")
      .filter({ hasText: nameOrRegex })
      .first()
      .click({ force: true })
  }

  /**
   * Nested item drawer's back button — its aria-label is
   * `Return to ${fieldLabel}` (the array field's own schema title, e.g.
   * "Images"), distinct from the block-level drawer's generic
   * "Return to previous step" (`clickDrawerBack`).
   */
  async returnFromNestedItem(fieldLabel: string) {
    await this.page
      .getByRole("button", { name: `Return to ${fieldLabel}` })
      .click()
  }

  // --- Rich text (TipTap prose) formatting ---
  // The prose block's contenteditable region and its `TextMenuBar` toolbar
  // (`TiptapTextEditor.tsx` -> `TextMenuBar.tsx`) render bold/italic/
  // underline/link/list controls as `IconButton`s whose accessible name is
  // their `title` (`MenuItem.tsx`). Note: the accessible name is
  // "Italicise", not "Italic", and headings only go from H2-H5 (no H1 —
  // `IsomerHeading`'s configured `levels: [2, 3, 4, 5]`).

  proseEditor() {
    return this.page.locator('[contenteditable="true"]')
  }

  /** Clears the prose block down to a single empty paragraph. */
  async clearProseContent() {
    const editor = this.proseEditor()
    await editor.click()
    await editor.selectText()
    await this.page.keyboard.press("Backspace")
  }

  /** Types `text` as its own paragraph, then presses Enter to start a new one. */
  async typeProseLine(text: string) {
    await this.page.keyboard.type(text)
    await this.page.keyboard.press("Enter")
  }

  /** Types `text` as the final paragraph, without a trailing Enter. */
  async typeProseLastLine(text: string) {
    await this.page.keyboard.type(text)
  }

  /** Fills a nested prose field embedded in a complex block's own drawer
   * (e.g. `accordion`'s `details`) — distinct from `clearProseContent`
   * (which targets a top-level prose block's own "Save changes" drawer):
   * there's no existing content to clear first, since these fields' schemas
   * require at least one paragraph but `DEFAULT_BLOCKS` seeds them with an
   * empty `content: []` array. Assumes the block's own drawer is the only
   * one currently open, so `proseEditor()` resolves to this one field. */
  async fillNestedProseContent(text: string) {
    await this.proseEditor().click()
    await this.typeProseLastLine(text)
  }

  /** Selects a whole paragraph by its exact text — a triple-click selects
   * the entire block in a TipTap/ProseMirror contenteditable, regardless of
   * where the cursor currently is or the paragraph's position in the doc
   * (mirrors `notificationContentEditor().selectText()` in `site-settings.ts`,
   * which relies on the same fact that TipTap's `.focus()` command restores
   * the editor's own last selection rather than the DOM selection). */
  async #selectProseLine(text: string) {
    await this.proseEditor()
      .getByText(text, { exact: true })
      .click({ clickCount: 3 })
  }

  async applyHeading(text: string, level: 2 | 3 | 4 | 5) {
    const HEADING_MENU_ITEM: Record<2 | 3 | 4 | 5, string> = {
      2: "Section heading",
      3: "Large heading",
      4: "Medium heading",
      5: "Small heading",
    }
    await this.#selectProseLine(text)
    // When the selection is a paragraph, the styles dropdown shows "Paragraph"
    // as its label rather than the idle "Text styles" default.
    await this.page
      .getByRole("button", { name: /Text styles|Paragraph/ })
      .first()
      .click()
    await this.page
      .getByRole("menuitem", { name: HEADING_MENU_ITEM[level] })
      .click()
  }

  async applyBold(text: string) {
    await this.#selectProseLine(text)
    await this.page.getByRole("button", { name: "Bold" }).click()
  }

  async applyItalic(text: string) {
    await this.#selectProseLine(text)
    await this.page.getByRole("button", { name: "Italicise" }).click()
  }

  async applyUnderline(text: string) {
    await this.#selectProseLine(text)
    await this.page.getByRole("button", { name: "Underline" }).click()
  }

  /** Applies bold, italic, and underline on one text run without re-selecting
   * between toolbar clicks — triple-clicking text already wrapped in `<strong>`
   * is flaky in CI, so subsequent `applyItalic`/`applyUnderline` calls can
   * silently miss the intended paragraph. */
  async applyInlineFormatting(text: string) {
    await this.#selectProseLine(text)
    await this.page.getByRole("button", { name: "Bold" }).click()
    await this.page.getByRole("button", { name: "Italicise" }).click()
    await this.page.getByRole("button", { name: "Underline" }).click()
  }

  async insertBulletedList(text: string) {
    await this.#selectProseLine(text)
    await this.page.getByRole("button", { name: "Lists" }).click()
    await this.page.getByRole("button", { name: "Bullet list" }).click()
  }

  /** Inserts an external link (`https://<urlWithoutProtocol>`) on the given
   * text run — same underlying `LinkEditorModal` as `fillButtonDestination`
   * above, just opened from the prose toolbar's "Link" button rather than a
   * "Link something..." field button. */
  async insertLink(text: string, urlWithoutProtocol: string) {
    await this.#selectProseLine(text)
    await this.page.getByRole("button", { name: "Link", exact: true }).click()
    const dialog = this.page.getByRole("dialog")
    await dialog.getByText("External", { exact: true }).click()
    await dialog.getByPlaceholder("www.isomer.gov.sg").fill(urlWithoutProtocol)
    await dialog.getByRole("button", { name: "Add link" }).click()
  }

  // --- Rich text assertions: editor pane ---
  // TipTap's own extensions render their own default HTML tags in the
  // editor, which differ from the published-site renderer's tags (see the
  // preview-iframe assertions below) — e.g. Bold -> <strong>, Italic -> <em>,
  // Underline -> <u> here, vs `getTextAsHtml.ts`'s `MARK_DOM_MAPPING`
  // (<b>/<i>/<u>) used to render the saved JSON content in the preview.

  async expectEditorHeadingVisible(level: 2 | 3 | 4 | 5, text: string) {
    await expect(
      this.proseEditor().locator(`h${level}`, { hasText: text }),
    ).toBeVisible()
  }

  async expectEditorBoldVisible(text: string) {
    await expect(
      this.proseEditor().locator("strong", { hasText: text }),
    ).toBeVisible()
  }

  async expectEditorItalicVisible(text: string) {
    await expect(
      this.proseEditor().locator("em", { hasText: text }),
    ).toBeVisible()
  }

  async expectEditorUnderlineVisible(text: string) {
    await expect(
      this.proseEditor().locator("u", { hasText: text }),
    ).toBeVisible()
  }

  async expectEditorLinkVisible(text: string) {
    await expect(
      this.proseEditor().locator("a", { hasText: text }),
    ).toBeVisible()
  }

  async expectEditorBulletedListVisible(text: string) {
    await expect(
      this.proseEditor().locator("ul li", { hasText: text }),
    ).toBeVisible()
  }

  // --- Rich text assertions: preview iframe ---

  async expectPreviewHeading(level: 2 | 3 | 4 | 5, name: string) {
    await expect(
      this.previewFrame().getByRole("heading", { level, name }),
    ).toBeVisible()
  }

  async expectPreviewBoldVisible(text: string) {
    await expect(
      this.previewFrame().locator("b, strong", { hasText: text }),
    ).toBeVisible()
  }

  async expectPreviewItalicVisible(text: string) {
    await expect(
      this.previewFrame().locator("i, em", { hasText: text }),
    ).toBeVisible()
  }

  async expectPreviewUnderlineVisible(text: string) {
    await expect(
      this.previewFrame().locator("u", { hasText: text }),
    ).toBeVisible()
  }

  async expectPreviewLink(name: string, href: string) {
    const link = this.previewFrame().getByRole("link", { name })
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute("href", href)
  }

  async expectPreviewBulletedList(itemText: string) {
    await expect(
      this.previewFrame()
        .getByRole("list")
        .getByRole("listitem")
        .filter({ hasText: itemText }),
    ).toBeVisible()
  }

  // --- Resource-type smoke checks (per-layout distinguishing UI) ---

  /** Smoke-level check that a labelled field renders in whichever metadata
   * drawer is currently open, without asserting a specific value — use after
   * `openMetaSettings()` (Content/Article/Index layouts) or `openBlockEditor`
   * targeting a layout's own fixed block. */
  async expectMetaSettingsFieldVisible(label: string) {
    await expect(this.#jsonFormsField(label)).toBeVisible()
  }

  /** Distinct from `MetadataEditorStateDrawer`'s "Page header" block — the
   * Database layout's dedicated "Database" fixed block opens
   * `DatabaseEditorStateDrawer` instead (`DrawerHeader` label "Edit
   * database"). Open it via `openBlockEditor("Database")` first. */
  async expectDatabaseEditorOpen() {
    await expect(this.page.getByText("Edit database")).toBeVisible()
  }

  /** Only rendered when `previewPageState.layout === "index"` — see
   * `RootStateDrawer.tsx`'s `pageLayout === "index"` branch. Distinguishes a
   * Folder/Collection Index page from a plain Content page. */
  async expectReorderSiderailVisible() {
    await expect(
      this.page.getByRole("button", {
        name: "Reorder siderail for this folder",
      }),
    ).toBeVisible()
  }

  // --- Upload rejection + risky-file warning ---
  // Rejected uploads (oversized / unsupported extension) are surfaced by
  // Attachment/AttachmentError (@opengovsg/design-system-react) as a <p> next
  // to the dropzone — the same `imageUploadInput()`/`uploadImage()` above
  // work regardless of whether it's an image block or a file/link
  // attachment (`FileAttachment.tsx` hardcodes `name="file-upload"` for
  // every consumer).

  /** getErrorMessage.ts's copy differs by rejection reason (oversized vs.
   * unsupported extension) — match on the shared substrings rather than one
   * exact string. */
  async expectFileUploadRejectionVisible() {
    await expect(
      this.page
        .locator("p")
        .filter({ hasText: /is not allowed|exceeds the size limit/ }),
    ).toBeVisible()
  }

  /** Opens a prose block's "Link" toolbar button (same button `insertLink`
   * uses), then switches the link-type radio group to "File" — the one call
   * site (`LinkEditorModal.tsx`'s `ModalLinkEditor`) that passes
   * `enableRiskyFileWarning` to `FileAttachment`. Clicking the radio's label
   * text (not the underlying input) mirrors `insertLink`/
   * `fillButtonDestination`'s existing "External" click, already proven to
   * hit the right target without a forced click. */
  async openLinkFileAttachment() {
    await this.page.getByRole("button", { name: "Link", exact: true }).click()
    const dialog = this.page.getByRole("dialog", { name: "Add link" })
    await dialog.getByText("File", { exact: true }).click()
  }

  /** `RiskyFileUploadModal.tsx`, dynamically imported by `FileAttachment.tsx`
   * when a `.doc`/`.docx`/`.xls`/`.xlsx` file is dropped. Scoped by its own
   * header text since it can be open at the same time as the Add-link dialog
   * behind it. */
  riskyFileWarningModal() {
    return this.page.getByRole("dialog", { name: /Before you upload/i })
  }

  async expectRiskyFileWarningVisible() {
    await expect(this.riskyFileWarningModal()).toBeVisible()
  }

  async expectRiskyFileWarningHidden() {
    await expect(this.riskyFileWarningModal()).not.toBeVisible()
  }

  /** The modal's `ModalCloseButton` (accessible name "Close") — there is no
   * separate "Cancel" button on this modal, per the component's source. */
  async cancelRiskyFileWarning() {
    await this.riskyFileWarningModal()
      .getByRole("button", { name: "Close" })
      .click()
  }

  async confirmRiskyFileWarning() {
    await this.riskyFileWarningModal()
      .getByText("I've read and accept the risks.", { exact: true })
      .click()
    await this.riskyFileWarningModal()
      .getByRole("button", { name: "Upload file" })
      .click()
  }

  // --- Legacy custom-content Index Page conversion ---
  // Only rendered when `isCustomContentIndexPage` (`RootStateDrawer.tsx`
  // ~366-369): `type === ResourceType.IndexPage && layout !== "index" &&
  // layout !== "collection"`. Seed via
  // `seedFolderLegacyContentIndexPage` (`~e2e/fixtures/resource`).

  async clickPreviewIndexPageConversion() {
    await this.page
      .getByRole("button", {
        name: "Preview what this looks like",
        exact: true,
      })
      .click()
  }

  async expectPreviewIndexPageConversionButtonVisible() {
    await expect(
      this.page.getByRole("button", {
        name: "Preview what this looks like",
        exact: true,
      }),
    ).toBeVisible()
  }

  /** "Accept this change" (drawer footer, opens the confirm modal) — distinct
   * from the modal's own "Accept changes" button
   * (`expectConfirmConvertIndexPageModalVisible`/`acceptConvertIndexPageModal`). */
  async clickAcceptIndexPageConversion() {
    await this.page
      .getByRole("button", { name: "Accept this change", exact: true })
      .click()
  }

  async expectAcceptIndexPageConversionButtonVisible() {
    await expect(
      this.page.getByRole("button", {
        name: "Accept this change",
        exact: true,
      }),
    ).toBeVisible()
  }

  async clickKeepOldIndexPageVersion() {
    await this.page
      .getByRole("button", { name: "Keep old version", exact: true })
      .click()
  }

  async expectKeepOldIndexPageVersionButtonVisible() {
    await expect(
      this.page.getByRole("button", { name: "Keep old version", exact: true }),
    ).toBeVisible()
  }

  /** `ConfirmConvertIndexPageModal.tsx` — opened by `clickAcceptIndexPageConversion`. */
  confirmConvertIndexPageModal() {
    return this.page.getByRole("dialog", {
      name: "Are you sure you want to accept these changes?",
    })
  }

  async expectConfirmConvertIndexPageModalVisible() {
    await expect(this.confirmConvertIndexPageModal()).toBeVisible()
  }

  async expectConfirmConvertIndexPageModalHidden() {
    await expect(this.confirmConvertIndexPageModal()).not.toBeVisible()
  }

  async cancelConvertIndexPageModal() {
    await this.confirmConvertIndexPageModal()
      .getByRole("button", { name: "No, cancel" })
      .click()
  }

  /** Confirms via the modal's "Accept changes" button — a single action that
   * both converts AND saves (`handleSaveConversionToIndexPage`, one
   * `updatePageBlob` mutation call). */
  async acceptConvertIndexPageModal() {
    await this.confirmConvertIndexPageModal()
      .getByRole("button", { name: "Accept changes" })
      .click()
    await expect(this.page.getByText(/Changes saved/)).toBeVisible()
  }

  // --- Raw JSON Editor Mode (admin-gated Konami-style combo) ---
  // Only activates when `useIsUserIsomerAdmin({ roles: [Core, Migrator] })`
  // resolves true (`RootStateDrawer.tsx`) — the `ActivateRawJsonEditorMode`
  // listener component isn't even mounted for non-Isomer-admins, so pressing
  // the combo is a no-op for them. It's a `window`-level `keydown` listener,
  // so focus doesn't matter; any wrong key in between resets progress to 0.

  async pressRawJsonEditorCombo() {
    await this.page.locator("body").click({ position: { x: 0, y: 0 } })
    for (const key of RAW_JSON_EDITOR_COMBO) {
      await this.page.keyboard.press(key, { delay: 50 })
    }
  }

  rawJsonEditorHeading() {
    return this.page.getByRole("heading", { name: "Raw JSON Editor Mode" })
  }

  async expectRawJsonEditorVisible() {
    await expect(this.rawJsonEditorHeading()).toBeVisible()
  }

  async expectRawJsonEditorHidden() {
    await expect(this.rawJsonEditorHeading()).not.toBeVisible()
  }

  /** The textarea has no accessible name set (`RawJsonEditor.tsx`'s plain
   * Chakra `<Textarea>`) — `.first()` mirrors the same-shaped fallback used
   * elsewhere in this PO (e.g. `fillBlock`) for unlabelled textbox roles. */
  rawJsonEditorTextarea() {
    return this.page.getByRole("textbox").first()
  }

  async getRawJsonEditorValue() {
    return this.rawJsonEditorTextarea().inputValue()
  }

  async fillRawJsonEditor(content: string) {
    await this.rawJsonEditorTextarea().fill(content)
  }

  /** Save button reads "Save changes" here too (same text as
   * `saveBlockChanges`/`saveMetaSettings`) — disabled while the textarea's
   * current content fails to parse/validate against the full page schema
   * (`isPendingChangesValid`, re-checked on every keystroke). */
  async expectRawJsonEditorSaveDisabled() {
    await expect(
      this.page.getByRole("button", { name: "Save changes" }),
    ).toBeDisabled()
  }

  async expectRawJsonEditorSaveEnabled() {
    await expect(
      this.page.getByRole("button", { name: "Save changes" }),
    ).toBeEnabled()
  }

  async saveRawJsonEditorChanges() {
    await this.page.getByRole("button", { name: "Save changes" }).click()
    await expect(this.page.getByText(/Changes saved/)).toBeVisible()
  }
}
