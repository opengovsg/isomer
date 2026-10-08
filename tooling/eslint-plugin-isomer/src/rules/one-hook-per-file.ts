import type { Rule } from "eslint"
import type {
  ExportDefaultDeclaration,
  ExportNamedDeclaration,
  Node,
} from "estree"

const HOOK_NAME_PATTERN = /^use[A-Z]/

function isCustomHookName(name: string | undefined | null): boolean {
  return typeof name === "string" && HOOK_NAME_PATTERN.test(name)
}

type HookExport = { name: string; node: Node }

function hooksFromExportNamedDeclaration(
  node: ExportNamedDeclaration,
): HookExport[] {
  const hooks: HookExport[] = []

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
        : specifier.exported.type === "Literal" &&
            typeof specifier.exported.value === "string"
          ? specifier.exported.value
          : null

    if (exportedName !== null && isCustomHookName(exportedName)) {
      hooks.push({ name: exportedName, node: specifier })
    }
  }

  return hooks
}

function hooksFromExportDefaultDeclaration(
  node: ExportDefaultDeclaration,
): HookExport[] {
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

const rule: Rule.RuleModule = {
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
    const exportedHooks = new Map<string, HookExport>()

    return {
      ExportNamedDeclaration(node: ExportNamedDeclaration) {
        for (const hook of hooksFromExportNamedDeclaration(node)) {
          exportedHooks.set(hook.name, hook)
        }
      },
      ExportDefaultDeclaration(node: ExportDefaultDeclaration) {
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
          const hook = exportedHooks.get(hookName)
          if (!hook) {
            continue
          }

          context.report({
            node: hook.node,
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
