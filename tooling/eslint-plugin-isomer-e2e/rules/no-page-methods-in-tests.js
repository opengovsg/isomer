/** @param {import('estree').Node | null | undefined} node */
const getMemberChainRoot = (node) => {
  let current = node
  while (current?.type === "MemberExpression") {
    current = current.object
  }
  return current
}

/** @param {import('estree').Node} node */
const isPlaywrightPageFixture = (node) =>
  node.type === "Identifier" && node.name === "page"

/**
 * Disallow `page.<method>(...)` in E2E test files. Playwright page calls belong
 * in fixtures/po/ or fixtures/helpers.ts — tests only pass `page` into POs and
 * documented infra helpers.
 *
 * @type {import('eslint').Rule.RuleModule}
 */
export const noPageMethodsInTests = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow Playwright page method calls in E2E test files (use POs/helpers instead)",
    },
    messages: {
      noPageMethods:
        "Do not call `{{method}}()` in E2E test files. Move this to `fixtures/po/` or `fixtures/helpers.ts`, then call the PO/helper from the test. See `.claude/skills/isomer-conventions/conventions/e2e-tests.md`.",
    },
    schema: [],
  },
  create(context) {
    return {
      CallExpression(node) {
        const root = getMemberChainRoot(node.callee)
        if (!isPlaywrightPageFixture(root)) {
          return
        }

        const method =
          node.callee.type === "MemberExpression"
            ? context.sourceCode.getText(node.callee)
            : "page"

        context.report({
          node,
          messageId: "noPageMethods",
          data: { method },
        })
      },
    }
  },
}
