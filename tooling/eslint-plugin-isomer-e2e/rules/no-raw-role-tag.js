/**
 * Disallow raw `@role` tag strings on describes. Use `roleTag(...)` from
 * `~e2e/fixtures/auth` so tags stay typed against `ROLES`.
 *
 * @type {import('eslint').Rule.RuleModule}
 */
export const noRawRoleTag = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow raw @role tag strings in E2E describes (use roleTag)",
    },
    messages: {
      noRawRoleTag:
        'Use `roleTag("{{role}}")` from `~e2e/fixtures/auth` instead of a raw `"@{{role}}"` tag string.',
    },
    schema: [],
  },
  create(context) {
    /** @param {import('estree').Node} node @param {string} role */
    const reportRawRoleTag = (node, role) => {
      context.report({
        node,
        messageId: "noRawRoleTag",
        data: { role },
      })
    }

    /** @param {import('estree').Literal} literal */
    const checkRoleTagLiteral = (literal) => {
      if (typeof literal.value !== "string") {
        return
      }

      const match = /^@(?<role>[a-z]+)$/.exec(literal.value)
      if (match?.groups?.role) {
        reportRawRoleTag(literal, match.groups.role)
      }
    }

    return {
      Property(node) {
        const { key, value } = node
        const isTagKey =
          (key.type === "Identifier" && key.name === "tag") ||
          (key.type === "Literal" && key.value === "tag")

        if (!isTagKey) {
          return
        }

        if (value.type === "Literal") {
          checkRoleTagLiteral(value)
          return
        }

        if (value.type === "ArrayExpression") {
          for (const element of value.elements) {
            if (element?.type === "Literal") {
              checkRoleTagLiteral(element)
            }
          }
        }
      },
    }
  },
}
