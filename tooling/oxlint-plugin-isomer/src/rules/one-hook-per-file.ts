import { defineRule } from "@oxlint/plugins"

// React custom-hook names: `use` plus an uppercase letter (`useFoo`).
// `userId` and bare `use` are ordinary identifiers, not hooks.
const HOOK_NAME_PATTERN = /^use[A-Z]/

function isCustomHookName(name: string | undefined | null): boolean {
  return typeof name === "string" && HOOK_NAME_PATTERN.test(name)
}

type HookExport = { name: string; node: object }

type ModuleExportName = {
  type: string
  name?: string
  value?: unknown
}

function moduleExportName(
  node: ModuleExportName | null | undefined,
): string | null {
  if (node?.type === "Identifier" && typeof node.name === "string") {
    return node.name
  }

  if (node?.type === "Literal" && typeof node.value === "string") {
    return node.value
  }

  return null
}

type BindingPattern = {
  type: string
  name?: string
  properties?: BindingProperty[]
  elements?: (BindingPattern | null)[] | null
  left?: BindingPattern | null
  argument?: BindingPattern | null
  value?: BindingPattern | null
}

type BindingProperty = {
  type: string
  value?: BindingPattern | null
  argument?: BindingPattern | null
}

function collectHooksFromPattern(
  pattern: BindingPattern | null | undefined,
  hooks: HookExport[],
): void {
  if (!pattern) {
    return
  }

  switch (pattern.type) {
    case "Identifier": {
      if (isCustomHookName(pattern.name)) {
        hooks.push({ name: pattern.name as string, node: pattern })
      }
      return
    }
    case "ObjectPattern": {
      for (const property of pattern.properties ?? []) {
        if (property.type === "RestElement") {
          collectHooksFromPattern(property.argument, hooks)
          continue
        }

        // Keys are not bindings (`{ useFoo: notAHook }`, computed keys).
        collectHooksFromPattern(property.value, hooks)
      }
      return
    }
    case "ArrayPattern": {
      for (const element of pattern.elements ?? []) {
        collectHooksFromPattern(element, hooks)
      }
      return
    }
    case "AssignmentPattern": {
      collectHooksFromPattern(pattern.left, hooks)
      return
    }
    case "RestElement": {
      collectHooksFromPattern(pattern.argument, hooks)
      return
    }
    default:
      return
  }
}

function hooksFromExportNamedDeclaration(node: {
  exportKind?: string
  declaration?: {
    type: string
    id?: { name: string } | null
    declarations?: { id: BindingPattern }[]
  } | null
  specifiers: {
    exportKind?: string
    local: ModuleExportName
    exported: ModuleExportName
  }[]
}): HookExport[] {
  if (node.exportKind === "type") {
    return []
  }

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
        collectHooksFromPattern(declarator.id, hooks)
      }
    }
  }

  for (const specifier of node.specifiers) {
    if (specifier.exportKind === "type") {
      continue
    }

    const exportedName = moduleExportName(specifier.exported)
    if (exportedName === null) {
      continue
    }

    // `export { useFoo as default }` — Identifier or `"default"`.
    // The hook name is the local binding, not the exported name `default`.
    const name =
      exportedName === "default"
        ? moduleExportName(specifier.local)
        : exportedName

    if (isCustomHookName(name)) {
      hooks.push({ name: name as string, node: specifier })
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
        const hooks = hooksFromExportDefaultDeclaration(
          node as Parameters<typeof hooksFromExportDefaultDeclaration>[0],
        )
        if (hooks.length === 0) {
          return
        }

        // A default-exported hook is local, so this file is not a barrel.
        hasLocalHookExport = true

        for (const hook of hooks) {
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
