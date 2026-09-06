/** @type {import('eslint').ESLint.Plugin} */
export default {
  meta: {
    name: "isomer-vitest",
  },
  rules: {
    "no-dummy-to-throw-regex": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Disallow placeholder toThrow(/./) matchers used to satisfy require-to-throw-message.",
        },
        schema: [],
        messages: {
          dummyToThrowRegex:
            "Do not use toThrow(/./) or toThrow(/.*)/ as a placeholder. Assert the real error message, TRPCError instance, or error class instead.",
        },
      },
      create(context) {
        const dummyPatterns = new Set([".", ".*"])

        return {
          CallExpression(node) {
            if (
              node.callee.type !== "MemberExpression" ||
              node.callee.property.type !== "Identifier" ||
              node.callee.property.name !== "toThrow"
            ) {
              return
            }

            const [argument] = node.arguments
            if (!argument) {
              return
            }

            let pattern = null
            if (argument.type === "Literal" && argument.regex) {
              pattern =
                typeof argument.value === "string"
                  ? argument.value
                  : argument.regex.pattern
            } else if (argument.type === "RegExpLiteral") {
              pattern = argument.pattern
            }

            if (pattern !== null && dummyPatterns.has(pattern)) {
              context.report({ node: argument, messageId: "dummyToThrowRegex" })
            }
          },
        }
      },
    },
  },
}
