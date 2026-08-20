import type { Locator, Page } from "@playwright/test"

export type SettingsSection =
  | "agency"
  | "colours"
  | "footer"
  | "integrations"
  | "logo"
  | "navbar"
  | "notification"
  | "redirects"

export class SitePO {
  constructor(private readonly page: Page) {}

  async gotoSettingsSection(siteId: number, section: SettingsSection) {
    await this.page.goto(`/sites/${siteId}/settings/${section}`)
    await this.page.waitForURL(new RegExp(`/settings/${section}$`))
  }

  async reloadSettingsSection(section: SettingsSection) {
    await this.page.reload()
    await this.page.waitForURL(new RegExp(`/settings/${section}$`))
  }

  async openSettingsSection(section: SettingsSection) {
    // Settings landing redirects to /agency. To reach other sections we
    // navigate via the settings side-nav (label === section name, title-cased).
    // Labels sourced from apps/studio/src/features/settings/SettingsSidenav/SettingsSidenav.tsx
    const label = SETTINGS_SECTION_LABELS[section]
    await this.page.getByRole("link", { name: label }).click()

    const urlPattern = new RegExp(`/settings/${section}$`)
    const confirmLeaveButton = this.page.getByRole("button", {
      name: "Yes, leave this page",
    })
    // A settings page can be considered "dirty" (form state briefly out of
    // sync with the server) right after mount, which triggers the same
    // "leave without saving?" confirmation a real user would see. Confirm it
    // if it shows up instead of hanging on a route change that never fires.
    const dismissIfShown = confirmLeaveButton
      .waitFor({ state: "visible" })
      .then(() => confirmLeaveButton.click())
      .catch(() => undefined)

    await Promise.race([this.page.waitForURL(urlPattern), dismissIfShown])
    await this.page.waitForURL(urlPattern)
  }

  /** UnsavedSettingModal.tsx — shown when navigating away with unsaved settings changes. */
  unsavedChangesModalHeading() {
    return this.page.getByText("Leave this page without saving your settings?")
  }

  /** Stay on the current page, keeping unsaved edits intact. */
  goBackToEditingButton() {
    return this.page.getByRole("button", { name: "Go back to editing" })
  }

  /** Discard unsaved edits and navigate away. */
  yesLeaveThisPageButton() {
    return this.page.getByRole("button", { name: "Yes, leave this page" })
  }

  /**
   * The SettingsHeader-rendered Publish button. Settings forms use "Publish"
   * (see src/features/settings/SettingsHeader.tsx). Non-settings surfaces
   * (page editor, resource modals) use different verbs — add a separate
   * helper for those rather than overloading this one.
   */
  publishButton() {
    // exact: true avoids matching unrelated buttons whose accessible name
    // merely contains "Publish" as a substring, e.g. a navbar item's
    // "Navbar item Fix errors before publishing" error button.
    return this.page.getByRole("button", { name: "Publish", exact: true })
  }

  siteNameField() {
    return this.page.getByLabel("Site name")
  }

  agencyOwnerField() {
    return this.page.getByLabel("Website is owned by")
  }

  mainBrandColourField() {
    return this.page.getByLabel("Main brand colour")
  }

  /**
   * The round colour swatch rendered next to the main brand colour input
   * (JsonFormsColourPickerControl.tsx) — updates live as the hex input
   * changes, before Publish. DOM: Input -> InputGroup (../) -> HStack (../)
   * -> last child Box is the swatch.
   */
  mainBrandColourSwatch() {
    return this.mainBrandColourField().locator("xpath=../../div[last()]")
  }

  gtmIdField() {
    return this.page.getByLabel("Google Tag Manager (GTM) ID")
  }

  notificationBannerToggle() {
    // Chakra v2's Switch exposes an implicit ARIA `checkbox` role, not `switch`.
    return this.page.getByRole("checkbox")
  }

  notificationTitleField() {
    return this.page.getByLabel("Notification title")
  }

  /** Tiptap simple-prose content editor toolbar buttons on the notification settings page. */
  notificationContentToolbarButton(
    name: "Bold" | "Italicise" | "Underline" | "Link",
  ) {
    return this.page.getByRole("button", { name })
  }

  /** Tiptap simple-prose content editor on the notification settings page (a plain contenteditable div, not a labelled form control). */
  notificationContentEditor() {
    return this.page.locator('[contenteditable="true"]')
  }

  /**
   * AskGov widget toggle (JsonFormsWidgetIntegrationControl) on the
   * integrations settings page. `.last()` on the hasText filter resolves to
   * the innermost matching div, which wraps only the label text — the
   * Switch is a sibling one level up, so we go up before searching for the
   * checkbox. Then scoped to the wrapping <label>, not the checkbox input
   * itself — the input is visually hidden inside the label, so clicking it
   * directly gets blocked by the label intercepting the pointer event.
   */
  askgovToggle() {
    return this.page
      .locator("div")
      .filter({ hasText: /^Enable your AskGov widget on this website/ })
      .last()
      .locator("xpath=..")
      .getByRole("checkbox")
      .locator("xpath=..")
  }

  vicaToggle() {
    return this.page
      .locator("div")
      .filter({ hasText: /^Enable your VICA widget on this website/ })
      .last()
      .locator("xpath=..")
      .getByRole("checkbox")
      .locator("xpath=..")
  }

  askgovIdField() {
    return this.page.getByLabel("AskGov ID")
  }

  vicaIdField() {
    return this.page.getByLabel("VICA ID")
  }

  /** Logo upload section container on the logos and favicon settings page. */
  logoUploadGroup() {
    return this.page.getByRole("group").filter({ hasText: /^Logo/ })
  }

  /**
   * Logo file input on the logos and favicon settings page. Visually hidden
   * by design (Attachment renders a styled dropzone over it) — usable with
   * setInputFiles(), but never assert toBeVisible() on it directly. Use
   * logoUploadGroup() for visibility checks instead.
   */
  logoUploadInput() {
    return this.logoUploadGroup().getByTestId("file-upload")
  }

  logoFilenameText(filename: string) {
    return this.page.getByText(filename)
  }

  /** Favicon upload section container on the logos and favicon settings page. */
  faviconUploadGroup() {
    return this.page.getByRole("group").filter({ hasText: /^Favicon/ })
  }

  faviconUploadInput() {
    return this.faviconUploadGroup().getByTestId("file-upload")
  }

  /**
   * The trash IconButton (aria-label "Remove file") shown once a logo or
   * favicon has been uploaded (AttachmentData.tsx) — clearing it restores the
   * empty dropzone so a new file can be uploaded in its place.
   */
  removeUploadedFileButton(group: Locator) {
    return group.getByRole("button", { name: "Remove file" })
  }

  /**
   * "Remove file" button for a BaseLinkControl field, found by its label
   * text (e.g. "Contact us page", "Privacy statement page") — the "Remove
   * file" aria-label is reused generically by BaseLinkControl. Two levels
   * up from the label: one reaches the <label> element itself, a second
   * reaches the shared FormControl that also contains the button.
   */
  removeLinkButtonByLabel(label: string) {
    return this.page
      .getByText(label)
      .locator("xpath=../..")
      .getByRole("button", { name: "Remove file" })
  }

  /**
   * File upload rejection text, scoped to the given upload group. The toast
   * notification (rendered as a <span>) is also a descendant of the group,
   * so scoping alone isn't enough — filter to the <p> the dropzone itself
   * renders the error into.
   */
  fileUploadErrorText(group: Locator) {
    return group
      .locator("p")
      .filter({ hasText: /is not allowed|exceeds the size limit/ })
  }

  footerLinkButton(name: string) {
    return this.page.getByRole("button", { name })
  }

  /**
   * "Add a link" button scoped to a footer column ("Footer column 1"/"Footer
   * column 2") to disambiguate the two identical-looking buttons. `.last()`
   * on the hasText filter resolves to the innermost div, which wraps only
   * the column's label/count text — the button is a sibling one level up.
   */
  addFooterLinkButtonForColumn(
    columnHeading: "Footer column 1" | "Footer column 2",
  ) {
    return this.page
      .locator("div")
      .filter({ hasText: new RegExp(`^${columnHeading}`) })
      .last()
      .locator("xpath=..")
      .getByRole("button", { name: "Add a link" })
  }

  linkLabelField() {
    return this.page.getByLabel("Link label")
  }

  backToFooterButton() {
    return this.page.getByRole("button", { name: "Back to footer" })
  }

  /**
   * "Add a link" button under the "Social media links" section. See
   * addFooterLinkButtonForColumn() for why the extra xpath=.. is needed.
   */
  addSocialMediaLinkButton() {
    return this.page
      .locator("div")
      .filter({ hasText: /^Social media links/ })
      .last()
      .locator("xpath=..")
      .getByRole("button", { name: "Add a link" })
  }

  socialMediaTypeSelect() {
    return this.page.getByLabel("Social media")
  }

  /**
   * exact: false, since the FormLabel wraps both the field label ("Link")
   * and its description ("Make sure you are linking an official account")
   * as one accessible name.
   */
  socialMediaLinkField() {
    return this.page.getByLabel("Link")
  }

  /** Deleted-link/error-scoped delete confirmation used by footer link, social-media link modals ("Delete {label}?" / "Delete {Label} link?"). */
  confirmDeleteButtonNamed(name: RegExp | string) {
    return this.page.getByRole("button", { name })
  }

  navbarItemText(name: string) {
    return this.page.getByText(name, { exact: true })
  }

  /**
   * "Link something..." button (BaseLinkControl) shown for any unset "link"
   * format field — navbar items/CTA/utility links, footer links, contact us/
   * feedback/privacy/terms. Opens the shared LinkEditorModal.
   */
  linkSomethingButton() {
    return this.page.getByRole("button", { name: "Link something..." })
  }

  /**
   * Visible type card in LinkEditorModal ("Page" | "External" | "File" | "Email").
   * Chakra `useRadio` renders a visually-hidden nameless `<input type="radio">`;
   * the label text is a sibling paragraph, so `getByRole("radio", { name })`
   * never matches. Click the dialog-scoped text instead.
   */
  linkTypeOption(type: "Page" | "External" | "File" | "Email") {
    return this.page.getByRole("dialog").getByText(type, { exact: true })
  }

  externalLinkUrlInput() {
    return this.page.getByPlaceholder("www.isomer.gov.sg")
  }

  /** "Add link" (new) / "Save link" (editing) submit button in LinkEditorModal. */
  saveLinkButton() {
    return this.page.getByRole("button", { name: /^(Add|Save) link$/ })
  }

  /** Set an unset "link" field (BaseLinkControl) to an external https:// URL. */
  async setLinkDestinationExternal(urlWithoutProtocol: string) {
    await this.linkSomethingButton().click()
    await this.linkTypeOption("External").click()
    await this.externalLinkUrlInput().fill(urlWithoutProtocol)
    await this.saveLinkButton().click()
  }

  /** Set an unset "link" field (BaseLinkControl) to an internal page, picked from the resource tree by its title. */
  async setLinkDestinationInternalPage(pageTitle: string) {
    await this.linkSomethingButton().click()
    await this.page
      .getByRole("dialog")
      .getByRole("button", { name: pageTitle })
      .click()
    await this.saveLinkButton().click()
  }

  /** "Add a link" button on the Menu Links tab (JsonFormsNavbarControl) — same text whether the list is empty (outline variant) or not (clear variant). */
  addNavbarLinkButton() {
    return this.page.getByRole("button", { name: "Add a link" }).first()
  }

  /** "Delete this link" button inside the navbar/footer item edit panel. */
  deleteThisLinkButton() {
    return this.page.getByRole("button", { name: "Delete this link" })
  }

  /**
   * Confirm-delete button in DeleteGroupModal/DeleteSubItemModal/DeleteLinkModal.
   * Text is "Delete link" (leaf item) or "Delete links" (group with sub-items)
   * — unqualified match (no exact) intentionally matches both.
   */
  confirmDeleteLinkButton() {
    return this.page.getByRole("button", { name: "Delete link" })
  }

  noDontDeleteButton() {
    return this.page.getByRole("button", { name: "No, don't delete" })
  }

  backToNavigationBarButton() {
    return this.page.getByRole("button", { name: "Back to navigation bar" })
  }

  navbarLinksCountText() {
    return this.page.getByText(/\d+\/8 first-level links added/)
  }

  navbarCustomiseTab() {
    return this.page.getByRole("tab", { name: "Customise" })
  }

  /**
   * Primary Call-to-Action section's on/off Switch (JsonFormsBoxedGroupControl),
   * matched by its aria-label rather than position. Scoped to the wrapping
   * <label> (see askgovToggle() for why — clicking the checkbox input directly
   * gets blocked by the label intercepting the pointer event).
   */
  ctaToggle() {
    return this.page
      .getByRole("checkbox", { name: "Primary Call-to-Action" })
      .locator("xpath=..")
  }

  /** Utility links section's on/off Switch, matched by its aria-label. */
  utilityLinksToggle() {
    return this.page
      .getByRole("checkbox", { name: "Utility links" })
      .locator("xpath=..")
  }

  ctaButtonTextField() {
    return this.page.getByLabel("Button text")
  }

  /**
   * "Pin Call-to-Action on mobile" Switch. Click the wrapping <label>, not the
   * visually-hidden checkbox input (same reason as ctaToggle()).
   */
  ctaPinOnMobileToggle() {
    return this.page
      .getByLabel("Pin Call-to-Action on mobile")
      .locator("xpath=..")
  }

  addUtilityItemButton() {
    return this.page.getByRole("button", { name: "Add item" })
  }

  /**
   * Placeholder row label in JsonFormsArrayControl (DraggableTagButton.Label)
   * before the nested drawer has a name. Click to open ComplexEditorNestedDrawer.
   */
  utilityItemRow(index: number) {
    return this.page.getByText(`Item ${index}`, { exact: true })
  }

  /**
   * Nested-drawer back control. `aria-label` is `Return to ${label}` where
   * `label` is the array field's JSON Forms label (see ComplexEditorNestedDrawer).
   */
  nestedDrawerBackButton() {
    return this.page.getByRole("button", { name: /^Return to/ })
  }

  /**
   * The chevron toggle (Chakra AccordionButton) that expands a top-level
   * navbar item's sub-items list. Scoped via the item's `data-id`
   * (`items.<index>`, see JsonFormsNavbarControl/utils.ts getNavbarItemPath)
   * rather than accessible name, since the button has no text/aria-label.
   */
  navbarExpandItemButton(itemDataId: string) {
    return this.page
      .locator(`[data-id="${itemDataId}"] .chakra-accordion__button`)
      .first()
  }

  utilityItemNameField() {
    return this.page.getByLabel("Name of the utility link")
  }

  redirectSourceField() {
    return this.page.getByPlaceholder("redirect-from")
  }

  redirectDestinationField() {
    return this.page.getByPlaceholder("/path-to-page or https://www.google.com")
  }

  redirectPathText(path: string) {
    return this.page.getByText(path, { exact: true })
  }

  deleteRedirectButton(source: string) {
    return this.page.getByRole("button", {
      name: `Delete redirect for /${source}`,
    })
  }

  bulkUploadRedirectsButton() {
    return this.page.getByRole("button", { name: /bulk upload with a \.csv/i })
  }

  bulkUploadRedirectsDialogTitle() {
    return this.page.getByText("Bulk upload redirects")
  }

  bulkUploadDialogFileInput() {
    return this.page.locator("[role='dialog'] input[type='file']")
  }

  async fillSiteName(name: string) {
    await this.siteNameField().fill(name)
  }

  async setMainBrandColour(hex: string) {
    const field = this.mainBrandColourField()
    await field.clear()
    await field.fill(hex)
  }

  async fillGtmId(id: string) {
    await this.gtmIdField().fill(id)
  }

  async enableNotificationBanner() {
    // The switch input is visually hidden (pointer-events: none) inside its
    // wrapping <label>; click the label itself, as a real user would.
    await this.notificationBannerToggle().locator("xpath=..").click()
  }

  async disableNotificationBanner() {
    await this.notificationBannerToggle().locator("xpath=..").click()
  }

  navbarMenuItemLabelField() {
    return this.page.getByLabel("Menu item label")
  }

  async fillNavbarMenuItemLabel(label: string) {
    await this.navbarMenuItemLabelField().fill(label)
  }

  navbarMenuItemLabelEmptyError() {
    return this.page.getByText("Menu item label cannot be empty")
  }

  siteNameEmptyValidationError() {
    return this.page.getByText(
      "Site name cannot be empty or contain only spaces",
    )
  }

  gtmIdValidationError() {
    return this.page.getByText(
      "Google Tag Manager (GTM) ID is not in the correct format",
    )
  }

  invalidLinkFormatError() {
    return this.page.getByText("Link is not in the correct format")
  }

  contactAndFeedbackHeading() {
    return this.page.getByText("Contact and feedback form")
  }

  legalPagesHeading() {
    return this.page.getByText("Legal pages")
  }

  footerLinksCountText(count: string) {
    return this.page.getByText(`${count} links added`)
  }

  privacyStatementEmptyError() {
    return this.page.getByText("Privacy statement page cannot be empty")
  }

  siteUpdateFailureText() {
    return this.page.getByText("Failed to update site")
  }

  /** Click a settings side-nav link without waiting for navigation to finish. */
  async clickSettingsSidebarSection(section: SettingsSection) {
    const label = SETTINGS_SECTION_LABELS[section]
    await this.page.getByRole("link", { name: label }).click()
  }

  async waitForSettingsSection(section: SettingsSection) {
    await this.page.waitForURL(new RegExp(`/settings/${section}$`))
  }

  async addNavbarLink(label: string, externalUrl: string) {
    await this.addNavbarLinkButton().click()
    // Add both appends a default item and opens its editor (setSelectedPath).
    await this.fillNavbarMenuItemLabel(label)
    await this.setLinkDestinationExternal(externalUrl)
    await this.backToNavigationBarButton().click()
  }

  async deleteNavbarLink(label: string) {
    await this.navbarItemText(label).click()
    await this.deleteThisLinkButton().click()
    await this.confirmDeleteLinkButton().click()
  }

  async addFooterLinkToColumn(
    columnHeading: "Footer column 1" | "Footer column 2",
    label: string,
    externalUrl: string,
  ) {
    await this.addFooterLinkButtonForColumn(columnHeading).click()
    // Add opens the new item's editor immediately (setSelectedIndex).
    await this.linkLabelField().fill(label)
    await this.setLinkDestinationExternal(externalUrl)
    await this.backToFooterButton().click()
  }

  async configureAskgov(agencyId: string) {
    await this.askgovToggle().click()
    await this.askgovIdField().fill(agencyId)
    await this.clickPublish()
    await this.expectChangesPublishedToast()
  }

  async removeAskgov() {
    await this.askgovToggle().click()
    await this.clickPublish()
    await this.expectChangesPublishedToast()
  }

  async configureVica(appId: string) {
    await this.vicaToggle().click()
    await this.vicaIdField().fill(appId)
    await this.clickPublish()
    await this.expectChangesPublishedToast()
  }

  async removeVica() {
    await this.vicaToggle().click()
    await this.clickPublish()
    await this.expectChangesPublishedToast()
  }

  async fillNotificationTitle(title: string) {
    await this.notificationTitleField().fill(title)
  }

  async uploadLogo(
    file: string | { name: string; mimeType: string; buffer: Buffer },
  ) {
    await this.logoUploadInput().setInputFiles(file)
  }

  async uploadFavicon(
    file: string | { name: string; mimeType: string; buffer: Buffer },
  ) {
    await this.faviconUploadInput().setInputFiles(file)
  }

  async editFooterLinkLabel(linkButtonName: string, newLabel: string) {
    await this.footerLinkButton(linkButtonName).click()
    await this.page.getByLabel("Link label").fill(newLabel)
    // The edit panel overlays the header Publish button until dismissed.
    await this.page.getByRole("button", { name: "Back to footer" }).click()
  }

  async editNavbarItemLabel(itemName: string, newLabel: string) {
    await this.navbarItemText(itemName).click()
    await this.fillNavbarMenuItemLabel(newLabel)
    // The edit panel overlays the header Publish button until dismissed.
    await this.backToNavigationBarButton().click()
  }

  async addRedirect(source: string, destination: string) {
    await this.redirectSourceField().fill(source)
    await this.redirectDestinationField().fill(destination)
    await this.page.getByRole("button", { name: "Add" }).click()
  }

  async deleteRedirect(source: string) {
    await this.deleteRedirectButton(source).click()
    await this.page.getByRole("button", { name: "Delete redirect" }).click()
  }

  async cancelDeleteRedirect(source: string) {
    await this.deleteRedirectButton(source).click()
    await this.page.getByRole("button", { name: "No, keep redirect" }).click()
    // Wait for the confirmation dialog to fully close — otherwise its body
    // text (which repeats the redirect path) still matches locators scoped
    // to the whole page, causing strict-mode violations in callers.
    await this.page.getByLabel("Delete redirect?").waitFor({ state: "hidden" })
  }

  async bulkUploadRedirectsCsv(csvContent: string, expectedCount: number) {
    await this.bulkUploadRedirectsButton().click()
    await this.bulkUploadRedirectsDialogTitle().waitFor({ state: "visible" })

    await this.bulkUploadDialogFileInput().setInputFiles({
      name: "redirects.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csvContent),
    })

    await this.page.getByRole("button", { name: "Process redirects" }).click()
    await this.page
      .getByText(`All ${expectedCount} redirects are good to go.`)
      .waitFor({ state: "visible" })

    await this.page
      .getByRole("button", { name: `Publish ${expectedCount} redirects` })
      .click()
    await this.page
      .getByText(`${expectedCount} redirects published`)
      .waitFor({ state: "visible" })
  }

  async expectLogoFilenameVisible(filename: string) {
    await this.logoFilenameText(filename).waitFor({ state: "visible" })
  }

  async expectNotificationTitleFieldVisible() {
    await this.notificationTitleField().waitFor({ state: "visible" })
  }

  /** Click the settings Publish button. */
  async clickPublish() {
    await this.publishButton().click()
  }

  /**
   * The toast that appears after a successful Publish on a settings page.
   * The text "Changes published" is settings-specific; do not reuse for
   * other success paths without verifying their toast copy.
   */
  async expectChangesPublishedToast() {
    await this.page
      .getByText("Changes published")
      .first()
      .waitFor({ state: "visible" })
  }
}

// Labels come from SIDENAV_ITEMS in:
// apps/studio/src/features/settings/SettingsSidenav/SettingsSidenav.tsx
const SETTINGS_SECTION_LABELS: Record<SettingsSection, string> = {
  agency: "Name and agency",
  colours: "Colours",
  footer: "Footer",
  integrations: "Integrations",
  logo: "Logos and favicon", // spec said "Logo" — actual label is "Logos and favicon"
  navbar: "Navigation bar", // spec said "Navbar" — actual label is "Navigation bar"
  notification: "Notification banner", // spec said "Notification" — actual label is "Notification banner"
  redirects: "Redirects",
}

/** Settings sections that render a Publish CTA (redirects publish inline instead). */
export const PUBLISH_GATED_SETTINGS_SECTIONS = [
  "agency",
  "colours",
  "footer",
  "integrations",
  "logo",
  "navbar",
  "notification",
] as const satisfies readonly SettingsSection[]

export const ALL_SETTINGS_SECTIONS = [
  ...PUBLISH_GATED_SETTINGS_SECTIONS,
  "redirects",
] as const satisfies readonly SettingsSection[]
