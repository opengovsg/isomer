import { noPageMethodsInTests } from "./rules/no-page-methods-in-tests.js"
import { noRawRoleTag } from "./rules/no-raw-role-tag.js"
import { noTestUseStorageState } from "./rules/no-test-use-storage-state.js"

/** @type {import('eslint').ESLint.Plugin} */
const plugin = {
  meta: {
    name: "isomer-e2e",
  },
  rules: {
    "no-page-methods-in-tests": noPageMethodsInTests,
    "no-raw-role-tag": noRawRoleTag,
    "no-test-use-storage-state": noTestUseStorageState,
  },
}

export default plugin
