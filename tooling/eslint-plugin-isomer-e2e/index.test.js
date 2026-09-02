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
  ],
})

ruleTester.run("no-test-use-storage-state", rules["no-test-use-storage-state"], {
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
})

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
  ],
})
