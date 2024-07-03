import { type OperationNode, type TableNode } from "kysely";

export const IN_OPERATORS = ["in", "not in"] as const;

export interface InOperatorNode {
  kind: "OperatorNode";
  operator: (typeof IN_OPERATORS)[number];
}

export const isTableNode = (node: OperationNode): node is TableNode => {
  return node.kind === "TableNode";
};

export const isInOperatorNode = (
  node: OperationNode,
): node is InOperatorNode => {
  return (
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    (node as InOperatorNode).kind === "OperatorNode" &&
    IN_OPERATORS.includes((node as InOperatorNode).operator)
  );
};
