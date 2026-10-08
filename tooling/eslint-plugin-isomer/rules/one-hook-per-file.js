/** @typedef {import("eslint").Rule} Rule */

const HOOK_NAME_PATTERN = /^use[A-Z]/

/**
 * @param {string | undefined | null} name
 */
function isCustomHookName(name) {
  return typeof name === "string" && HOOK_NAME_PATTERN.test(name)
}

/**
 * @param {import("estree").ExportNamedDeclaration} node
 * @returns {{ name: string, node: import("estree").Node }[]}
 */
function hooksFromExportNamedDeclaration(node) {
  const hooks = []

  if (node.declaration) {
    if (
      node.declaration.type === "FunctionDeclaration" &&
      node.declaration.id
    ) {
      const { name } = node.declaration.id
      if (isCustomHookName(name)) {
        hooks.push({ name, node: node.declaration.id })
      }
    }

    if (node.declaration.type === "VariableDeclaration") {
      for (const declarator of node.declaration.declarations) {
        if (declarator.id.type === "Identifier") {
          const { name } = declarator.id
          if (isCustomHookName(name)) {
            hooks.push({ name, node: declarator.id })
          }
        }
      }
    }
  }

  for (const specifier of node.specifiers) {
    const exportedName =
      specifier.exported.type === "Identifier"
        ? specifier.exported.name
        : specifier.exported.value

    if (isCustomHookName(exportedName)) {
      hooks.push({ name: exportedName, node: specifier })
    }
  }

  return hooks
}

/**
 * @param {import("estree").ExportDefaultDeclaration} node
 * @returns {{ name: string, node: import("estree").Node }[]}
 */
function hooksFromExportDefaultDeclaration(node) {
  if (
    node.declaration.type === "FunctionDeclaration" &&
    node.declaration.id &&
    isCustomHookName(node.declaration.id.name)
  ) {
    return [{ name: node.declaration.id.name, node: node.declaration.id }]
  }

  if (
    node.declaration.type === "Identifier" &&
    isCustomHookName(node.declaration.name)
  ) {
    return [{ name: node.declaration.name, node: node.declaration }]
  }

  return []
}

/** @type {Rule.RuleModule} */
const rule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Require at most one exported custom React hook per file.",
    },
    schema: [],
    messages: {
      multipleHooks:
        "Export only one custom hook per file (found {{hookNames}}). Move `{{hookName}}` to its own file (for example `{{suggestedFile}}`).",
    },
  },
  create(context) {
    /** @type {Map<string, { name: string, node: import("estree").Node }>} */
    const exportedHooks = new Map()

    return {
      ExportNamedDeclaration(node) {
        for (const hook of hooksFromExportNamedDeclaration(node)) {
          exportedHooks.set(hook.name, hook)
        }
      },
      ExportDefaultDeclaration(node) {
        for (const hook of hooksFromExportDefaultDeclaration(node)) {
          exportedHooks.set(hook.name, hook)
        }
      },
      "Program:exit"() {
        if (exportedHooks.size <= 1) {
          return
        }

        const hookNames = [...exportedHooks.keys()].sort()
        const hookNamesText = hookNames.join(", ")

        for (const hookName of hookNames) {
          const { node } = exportedHooks.get(hookName) ?? {}
          if (!node) {
            continue
          }

          context.report({
            node,
            messageId: "multipleHooks",
            data: {
              hookName,
              hookNames: hookNamesText,
              suggestedFile: `${hookName}.ts`,
            },
          })
        }
      },
    }
  },
}

export default rule
