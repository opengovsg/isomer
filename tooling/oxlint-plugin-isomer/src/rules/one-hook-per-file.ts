import { defineRule } from "@oxlint/plugins"

const HOOK_NAME_PATTERN = /^use[A-Z]/

function isCustomHookName(name: string | undefined | null): boolean {
  return typeof name === "string" && HOOK_NAME_PATTERN.test(name)
}

type HookExport = { name: string; node: object }

function hooksFromExportNamedDeclaration(node: {
  declaration?: {
    type: string
    id?: { name: string } | null
    declarations?: { id: { type: string; name: string } }[]
  } | null
  specifiers: {
    exported: { type: string; name?: string; value?: unknown }
  }[]
}): HookExport[] {
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
      for (const declarator of node.declaration.declarations ?? []) {
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
      hooks.push({ name: exportedName as string, node: specifier })
    }
  }

  return hooks
}

function hooksFromExportDefaultDeclaration(node: {
  declaration: {
    type: string
    id?: { name: string } | null
    name?: string
  }
}): HookExport[] {
  if (
    node.declaration.type === "FunctionDeclaration" &&
    node.declaration.id &&
    isCustomHookName(node.declaration.id.name)
  ) {
    return [{ name: node.declaration.id.name, node: node.declaration.id }]
  }

  if (node.declaration.type === "Identifier") {
    const { name } = node.declaration
    if (isCustomHookName(name)) {
      return [{ name: name as string, node: node.declaration }]
    }
  }

  return []
}

/** Require at most one exported custom React hook per file. */
export const oneHookPerFileRule = defineRule({
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
  // Per-file state: `createOnce` would share the hook map across the whole lint run.
  create(context) {
    const exportedHooks = new Map<string, HookExport>()
    let hasLocalHookExport = false

    return {
      ExportNamedDeclaration(node) {
        const exportNode = node as Parameters<
          typeof hooksFromExportNamedDeclaration
        >[0] & { source?: unknown | null }

        const hooks = hooksFromExportNamedDeclaration(exportNode)
        if (hooks.length === 0) {
          return
        }

        if (exportNode.source == null) {
          hasLocalHookExport = true
        }

        for (const hook of hooks) {
          exportedHooks.set(hook.name, hook)
        }
      },
      ExportDefaultDeclaration(node) {
        for (const hook of hooksFromExportDefaultDeclaration(
          node as Parameters<typeof hooksFromExportDefaultDeclaration>[0],
        )) {
          exportedHooks.set(hook.name, hook)
        }
      },
      "Program:exit"() {
        if (exportedHooks.size <= 1) {
          return
        }

        // Barrel files may re-export multiple hooks via `export { … } from "…"`.
        if (!hasLocalHookExport) {
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
            node: hook.node as never,
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
})
