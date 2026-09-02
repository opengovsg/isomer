const POSITIONAL_METHODS = new Set(["first", "last", "nth"])

const LOCATOR_METHODS = new Set([
  "getByRole",
  "getByLabel",
  "getByText",
  "getByPlaceholder",
  "locator",
])

/** @param {import('estree').MemberExpression} member */
const getPositionalMethod = (member) => {
  if (member.type !== "MemberExpression" || member.computed) {
    return null
  }
  if (member.property.type !== "Identifier") {
    return null
  }
  return POSITIONAL_METHODS.has(member.property.name)
    ? member.property.name
    : null
}

/** @param {import('estree').Node | null | undefined} node */
const hasFilterCallInChain = (node) => {
  let current = node
  while (current) {
    if (
      current.type === "CallExpression" &&
      current.callee.type === "MemberExpression" &&
      current.callee.property.type === "Identifier" &&
      current.callee.property.name === "filter"
    ) {
      return true
    }

    if (current.type === "MemberExpression") {
      current = current.object
      continue
    }

    if (
      current.type === "CallExpression" &&
      current.callee.type === "MemberExpression"
    ) {
      current = current.callee.object
      continue
    }

    break
  }

  return false
}

/**
 * Walk the member/call chain upward from `node` and return the nearest
 * Playwright locator factory call (`getByRole`, `locator`, …).
 *
 * @param {import('estree').Node | null | undefined} node
 */
const findLocatorFactory = (node) => {
  let current = node

  while (current) {
    if (
      current.type === "CallExpression" &&
      current.callee.type === "MemberExpression" &&
      current.callee.property.type === "Identifier" &&
      LOCATOR_METHODS.has(current.callee.property.name)
    ) {
      return current
    }

    if (current.type === "MemberExpression") {
      current = current.object
      continue
    }

    if (
      current.type === "CallExpression" &&
      current.callee.type === "MemberExpression"
    ) {
      current = current.callee.object
      continue
    }

    break
  }

  return null
}

/** @param {import('estree').CallExpression} node */
const isNthWithVariableIndex = (node, method) =>
  method === "nth" &&
  node.arguments[0]?.type === "Identifier" &&
  node.arguments.length === 1

/**
 * Disallow `.first()`, `.last()`, and literal `.nth(n)` on Playwright locators
 * in page objects. Prefer `getByRole(role, { name })` / `getByLabel(...)` over
 * positional disambiguation.
 *
 * @type {import('eslint').Rule.RuleModule}
 */
export const noPositionalLocatorsInPo = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow positional Playwright locators (.first/.last/.nth) in PO files",
    },
    messages: {
      noPositionalLocator:
        "Avoid `{{method}}()` on Playwright locators in page objects. Match controls by accessible name (`getByRole(role, { name })`, `getByLabel`) instead of position. See `.claude/skills/isomer-conventions/conventions/e2e-tests.md`.",
    },
    schema: [],
  },
  create(context) {
    return {
      CallExpression(node) {
        if (node.callee.type !== "MemberExpression") {
          return
        }

        const method = getPositionalMethod(node.callee)
        if (!method) {
          return
        }

        if (isNthWithVariableIndex(node, method)) {
          return
        }

        const receiver = node.callee.object
        if (hasFilterCallInChain(receiver)) {
          return
        }

        const locatorFactory = findLocatorFactory(receiver)
        if (!locatorFactory) {
          return
        }

        context.report({
          node,
          messageId: "noPositionalLocator",
          data: { method },
        })
      },
    }
  },
}
