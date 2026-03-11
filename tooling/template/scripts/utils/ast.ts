import { namedTypes as n } from "ast-types"

/** AST node types from recast/ast-types are untyped; we use narrow helpers for readability. */
type AnyNode = unknown

/**
 * True if the discriminant is `props.layout` (or props["layout"]).
 */
export function isPropsLayoutSwitch(discriminant: AnyNode): boolean {
  if (!n.MemberExpression.check(discriminant)) return false
  if (
    !n.Identifier.check(discriminant.object) ||
    discriminant.object.name !== "props"
  )
    return false
  if (
    discriminant.computed === false &&
    n.Identifier.check(discriminant.property)
  )
    return discriminant.property.name === "layout"
  if (discriminant.computed === true && n.Literal.check(discriminant.property))
    return discriminant.property.value === "layout"
  return false
}

/**
 * True if the discriminant is `component.type` (or component["type"]).
 */
export function isComponentTypeSwitch(discriminant: AnyNode): boolean {
  if (!n.MemberExpression.check(discriminant)) return false
  if (
    !n.Identifier.check(discriminant.object) ||
    discriminant.object.name !== "component"
  )
    return false
  if (
    discriminant.computed === false &&
    n.Identifier.check(discriminant.property)
  )
    return discriminant.property.name === "type"
  if (discriminant.computed === true && n.Literal.check(discriminant.property))
    return discriminant.property.value === "type"
  return false
}

/**
 * If the case test is a string literal, return its value; otherwise null.
 */
export function getLiteralCaseValue(test: AnyNode): string | null {
  if (!n.Literal.check(test) || typeof test.value !== "string") return null
  return test.value
}

/** Layout case values we never keep (they are not real layouts). */
export const LAYOUT_SKIP_VALUES = new Set(["file", "link"])

/**
 * Filter switch cases to those whose literal test is in usedSet, or non-literal (keep).
 * For layout switch: also skip LAYOUT_SKIP_VALUES.
 */
export function filterCasesByUsed(
  cases: Array<{ test: AnyNode | null; [k: string]: unknown }>,
  usedSet: Set<string>,
  skipValues?: Set<string>,
): typeof cases {
  const kept: typeof cases = []
  for (const caseNode of cases) {
    if (!caseNode.test) {
      kept.push(caseNode)
      continue
    }
    const value = getLiteralCaseValue(caseNode.test)
    if (value === null) {
      kept.push(caseNode)
      continue
    }
    if (skipValues?.has(value)) continue
    if (usedSet.has(value)) kept.push(caseNode)
  }
  return kept
}
