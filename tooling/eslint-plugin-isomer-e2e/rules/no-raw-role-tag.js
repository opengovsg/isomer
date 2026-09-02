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
        "Use `roleTag(\"{{role}}\")` from `~e2e/fixtures/auth` instead of a raw `\"@{{role}}\"` tag string.",
    },
    schema: [],
  },
  create(context) {
    return {
      Property(node) {
        const { key, value } = node
        const isTagKey =
          (key.type === "Identifier" && key.name === "tag") ||
          (key.type === "Literal" && key.value === "tag")

        if (!isTagKey || value.type !== "Literal" || typeof value.value !== "string") {
          return
        }

        const match = /^@(?<role>[a-z]+)$/.exec(value.value)
        if (!match?.groups?.role) {
          return
        }

        context.report({
          node: value,
          messageId: "noRawRoleTag",
          data: { role: match.groups.role },
        })
      },
    }
  },
}
