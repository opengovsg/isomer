/** @param {import('estree').Property} property */
const isStorageStateProperty = (property) => {
  if (property.type !== "Property") {
    return false
  }

  const { key } = property
  if (key.type === "Identifier") {
    return key.name === "storageState"
  }
  if (key.type === "Literal" && typeof key.value === "string") {
    return key.value === "storageState"
  }
  return false
}

/**
 * Disallow per-file `test.use({ storageState })`. Role auth is configured via
 * Playwright projects and `roleTag()` on describes.
 *
 * @type {import('eslint').Rule.RuleModule}
 */
export const noTestUseStorageState = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow test.use({ storageState }) in E2E tests (use role projects + roleTag)",
    },
    messages: {
      noStorageStateUse:
        "Do not use `test.use({ storageState })` in E2E tests. Tag the `describe` with `roleTag(...)` and let Playwright projects supply auth. See `tests/e2e/README.md`.",
    },
    schema: [],
  },
  create(context) {
    return {
      CallExpression(node) {
        const { callee } = node
        if (
          callee.type !== "MemberExpression" ||
          callee.object.type !== "Identifier" ||
          callee.object.name !== "test" ||
          callee.property.type !== "Identifier" ||
          callee.property.name !== "use"
        ) {
          return
        }

        const [firstArg] = node.arguments
        if (firstArg?.type !== "ObjectExpression") {
          return
        }

        if (firstArg.properties.some(isStorageStateProperty)) {
          context.report({ node, messageId: "noStorageStateUse" })
        }
      },
    }
  },
}
