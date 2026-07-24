import { expect, type Page } from "@playwright/test"
import { type RoleType } from "~prisma/generated/generatedEnums"

export const createPageViaWizard = async (
  page: Page,
  {
    startUrl,
    title,
    siteId,
  }: { startUrl: string; title: string; siteId: number },
) => {
  await page.goto(startUrl)

  await page.getByRole("button", { name: "Create new..." }).click()
  await page.getByRole("menuitem", { name: "Page" }).click()

  await page.getByRole("button", { name: "Next: Page title and URL" }).click()

  await page.getByLabel("Page title").fill(title)
  await page.getByRole("button", { name: "Start editing" }).click()

  await page.waitForURL(new RegExp(`/sites/${siteId}/pages/\\d+$`))
}

export const createFolderViaWizard = async (
  page: Page,
  { siteId, title }: { siteId: number; title: string },
) => {
  await page.goto(`/sites/${siteId}`)

  await page.getByRole("button", { name: "Create new..." }).click()
  await page.getByRole("menuitem", { name: "Folder" }).click()

  await page.getByLabel("Folder name").fill(title)
  await page.getByRole("button", { name: "Create Folder" }).click()

  await expect(page.getByText("Folder created!")).toBeVisible()
}

export const openInviteModal = async (page: Page, siteId: number) => {
  await page.goto(`/sites/${siteId}/users`)
  await page.getByRole("button", { name: "Add new user" }).click()
}

export const inviteCollaborator = async (
  page: Page,
  {
    email,
    role,
    siteId,
  }: { email: string; role: keyof typeof RoleType; siteId: number },
) => {
  await openInviteModal(page, siteId)
  await page.getByLabel("Email address").fill(email)
  await page.getByRole("button", { name: new RegExp(`^${role}`) }).click()

  const sendBtn = page.getByRole("button", { name: "Send invite" })
  await expect(sendBtn).toBeEnabled({ timeout: 10_000 })
  await sendBtn.click()
  await expect(page.getByText(/Sent invite to/)).toBeVisible({
    timeout: 10_000,
  })
}
