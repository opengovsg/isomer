import type {
  BinaryOperationNode,
  KyselyPlugin,
  PluginTransformQueryArgs,
  PluginTransformResultArgs,
  QueryResult,
  RootOperationNode,
  UnknownRow,
} from "kysely";
import { OperationNodeTransformer, PrimitiveValueListNode } from "kysely";

import { isInOperatorNode } from "./types";

/**
 * Kysely plugin used to prevent WHERE IN () empty array clauses which would cause runtime errors.
 *
 * EXAMPLE RAW QUERY:
 *
 * select * from "Activity" a where a.id in ();
 *
 * TRANSFORMED:
 *
 * select * from "Activity" a where a.id in (null);
 */
export class SafeWhereInPlugin implements KyselyPlugin {
  readonly #transformer = new SafeWhereInTransformer();

  transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
    return this.#transformer.transformNode(args.node);
  }

  transformResult(
    args: PluginTransformResultArgs,
  ): Promise<QueryResult<UnknownRow>> {
    return Promise.resolve(args.result);
  }
}

export class SafeWhereInTransformer extends OperationNodeTransformer {
  // Do it on BinaryOperation node level to handle `WHERE` `AND` `OR` and `HAVING` clauses
  protected transformBinaryOperation(
    node: BinaryOperationNode,
  ): BinaryOperationNode {
    const rightOperand = node.rightOperand;
    const operator = node.operator;

    if (isInOperatorNode(operator) && PrimitiveValueListNode.is(rightOperand)) {
      const values = rightOperand.values;

      if (Array.isArray(values) && values.length === 0) {
        return Object.freeze({
          ...node,
          rightOperand: Object.freeze({
            ...rightOperand,
            values: [null],
          }),
        });
      }
    }

    return node;
  }
}
