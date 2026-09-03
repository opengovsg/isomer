import { RuleTester } from "oxlint/plugins-dev"
import { describe, it } from "vitest"

import plugin from "./index.js"

RuleTester.describe = describe
RuleTester.it = it

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
  },
})

const { rules } = plugin

ruleTester.run("no-page-methods-in-tests", rules["no-page-methods-in-tests"], {
  valid: [
    "async ({ page }) => { const editor = new PageEditorPO(page) }",
    "async ({ page }) => { await resetGrowthBookPage(page) }",
    "async ({ page }) => { await openSeededPageEditor(page, siteId, id) }",
    "const parsed = { page: { title: 'x' } }; parsed.page.title = 'y'",
  ],
  invalid: [
    {
      code: "async ({ page }) => { await page.goto('/dashboard') }",
      errors: [{ messageId: "noPageMethods" }],
    },
    {
      code: "async ({ page }) => { await page.clock.install({ time: new Date() }) }",
      errors: [{ messageId: "noPageMethods" }],
    },
    {
      code: "async ({ page: page2 }) => { await page2.goto('/dashboard') }",
      errors: [{ messageId: "noPageMethods" }],
    },
  ],
})

ruleTester.run(
  "no-test-use-storage-state",
  rules["no-test-use-storage-state"],
  {
    valid: [
      'test.describe("admin", { tag: roleTag("admin") }, () => {})',
      'test.use({ baseURL: "http://localhost" })',
    ],
    invalid: [
      {
        code: 'test.use({ storageState: "./storage-state/admin.json" })',
        errors: [{ messageId: "noStorageStateUse" }],
      },
    ],
  },
)

ruleTester.run("no-raw-role-tag", rules["no-raw-role-tag"], {
  valid: [
    'test.describe("admin", { tag: roleTag("admin") }, () => {})',
    'const tags = "@admin @editor"',
  ],
  invalid: [
    {
      code: 'test.describe("admin", { tag: "@admin" }, () => {})',
      errors: [{ messageId: "noRawRoleTag" }],
    },
    {
      code: 'test.describe("admin", { tag: ["@admin", "@editor"] }, () => {})',
      errors: [{ messageId: "noRawRoleTag" }, { messageId: "noRawRoleTag" }],
    },
  ],
})

ruleTester.run(
  "no-positional-locators-in-po",
  rules["no-positional-locators-in-po"],
  {
    valid: [
      "this.page.locator('div').filter({ hasText: /^Enable/ }).last().locator('xpath=..')",
      "this.page.locator('button').filter({ hasText: /Item 1/ }).first().click()",
      "this.page.getByRole('group').filter({ has: this.page.getByText('Topic') }).getByRole('combobox')",
      "async (links, index) => { await expect(links.nth(index)).toBeVisible() }",
      'this.page.getByRole("button", { name: "Save" }).click()',
    ],
    invalid: [
      {
        code: 'this.page.getByRole("textbox").first().fill("x")',
        errors: [{ messageId: "noPositionalLocator" }],
      },
      {
        code: 'this.page.locator("textarea").nth(1).fill("x")',
        errors: [{ messageId: "noPositionalLocator" }],
      },
      {
        code: 'this.page.getByRole("button", { name: "Add a link" }).first().click()',
        errors: [{ messageId: "noPositionalLocator" }],
      },
      {
        code: 'this.page.getByText("Saved").filter({ hasText: "Saved" }).first()',
        errors: [{ messageId: "noPositionalLocator" }],
      },
    ],
  },
)
