import type {
  KyselyPlugin,
  OperationNode,
  PluginTransformQueryArgs,
  PluginTransformResultArgs,
  QueryResult,
  RootOperationNode,
  UnknownRow,
} from "kysely";
import {
  InsertQueryNode,
  OperationNodeTransformer,
  RawNode,
  ValuesNode,
} from "kysely";

/**
 * Kysely plugin used to prevent WHERE IN () empty array clauses which would cause runtime errors.
 *
 * EXAMPLE RAW QUERY:
 *
 * INSERT INTO "Activity" VALUES ();
 *
 * TRANSFORMED:
 *
 * select 1;
 */
export class SafeArrayInsertPlugin implements KyselyPlugin {
  readonly #transformer = new SafeArrayInsertTransformer();

  transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
    return this.#transformer.transformNode(args.node);
  }

  transformResult(
    args: PluginTransformResultArgs,
  ): Promise<QueryResult<UnknownRow>> {
    return Promise.resolve(args.result);
  }
}

export class SafeArrayInsertTransformer extends OperationNodeTransformer {
  protected transformNodeImpl<T extends OperationNode>(node: T): T {
    if (!InsertQueryNode.is(node)) {
      return node;
    }

    const childNode = node.values;

    if (!childNode || !ValuesNode.is(childNode)) {
      return node;
    }

    const insertValues = childNode.values;

    if (!Array.isArray(insertValues)) {
      return node;
    }

    if (insertValues.length === 0) {
      const rawNode = RawNode.createWithSql(`select 1 where false;`);

      if (node.returning) {
        // This returning true property is set so that the query always returns an empty array
        // For more info see https://github.com/kysely-org/kysely/blob/0fd4de864f7ca4c9d69c7338fba4c6902c8d110e/src/query-builder/insert-query-builder.ts#L969
        // Returning property is set so that the rows can be returned
        return Object.freeze({
          ...rawNode,
          returning: true,
        }) as unknown as T;
      }

      return Object.freeze({
        ...rawNode,
      }) as unknown as T;
    }

    return node;
  }
}
