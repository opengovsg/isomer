/** @param {import('estree').Node | null | undefined} node */
const getMemberChainRoot = (node) => {
  let current = node
  while (current?.type === "MemberExpression") {
    current = current.object
  }
  return current
}

/** @param {import('estree').Pattern} param @param {Set<string>} names */
const collectPageFixtureBindings = (param, names) => {
  if (param.type !== "ObjectPattern") {
    return
  }

  for (const property of param.properties) {
    if (property.type !== "Property") {
      continue
    }

    const keyIsPage =
      (property.key.type === "Identifier" && property.key.name === "page") ||
      (property.key.type === "Literal" && property.key.value === "page")

    if (!keyIsPage || property.value.type !== "Identifier") {
      continue
    }

    names.add(property.value.name)
  }
}

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
    /** @type {Set<string>[]} */
    const pageFixtureScopeStack = [new Set(["page"])]

    const currentPageFixtures = () => {
      const names = new Set()
      for (const scope of pageFixtureScopeStack) {
        for (const name of scope) {
          names.add(name)
        }
      }
      return names
    }

    const enterFunction = (node) => {
      const names = new Set()
      for (const param of node.params) {
        collectPageFixtureBindings(param, names)
      }
      pageFixtureScopeStack.push(names)
    }

    const exitFunction = () => {
      pageFixtureScopeStack.pop()
    }

    return {
      FunctionDeclaration: enterFunction,
      "FunctionDeclaration:exit": exitFunction,
      FunctionExpression: enterFunction,
      "FunctionExpression:exit": exitFunction,
      ArrowFunctionExpression: enterFunction,
      "ArrowFunctionExpression:exit": exitFunction,
      CallExpression(node) {
        const root = getMemberChainRoot(node.callee)
        if (root?.type !== "Identifier") {
          return
        }

        if (!currentPageFixtures().has(root.name)) {
          return
        }

        const method =
          node.callee.type === "MemberExpression"
            ? context.sourceCode.getText(node.callee)
            : root.name

        context.report({
          node,
          messageId: "noPageMethods",
          data: { method },
        })
      },
    }
  },
}
