import type {
  KyselyPlugin,
  PluginTransformQueryArgs,
  PluginTransformResultArgs,
  QueryResult,
  UnknownRow,
} from "kysely"
import ddTrace from "dd-trace"
import { PostgresQueryCompiler } from "kysely"

export class TracingPlugin implements KyselyPlugin {
  // reuse a single compiler instance to avoid unnecessary allocations
  private compiler = new PostgresQueryCompiler()
  private spanMap = new WeakMap<
    PluginTransformQueryArgs["queryId"],
    ddTrace.Span
  >()
  transformQuery(args: PluginTransformQueryArgs) {
    const queryId = args.queryId
    // only create spans if dd-trace is properly initialized, which is NOT the case if running in a seed script
    // oxlint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (ddTrace?.tracer) {
      // this is VERY performant (microseconds) relative to actually executing the query, so we can afford to do this
      const compiled = this.compiler.compileQuery(args.node, args.queryId)
      const span = ddTrace.tracer.startSpan(`kysely_${args.node.kind}`, {
        childOf: ddTrace.tracer.scope().active() ?? undefined,
        tags: {
          "kysely.query_id": queryId,
          "kysely.kind": args.node.kind,
          "kysely.sql": compiled.sql, // only log the SQL
          "kysely.parameters_len": compiled.parameters.length, // log number of parameters, NOT the parameters themselves for security
        },
      })
      this.spanMap.set(queryId, span)
    }
    return args.node
  }
  transformResult(
    args: PluginTransformResultArgs,
  ): Promise<QueryResult<UnknownRow>> {
    const span = this.spanMap.get(args.queryId)
    if (span) {
      // do NOT log query result rows for security and performance reasons
      span.addTags({
        affectedRows: args.result.numAffectedRows,
        changedRows: args.result.numChangedRows,
        returnedRows: args.result.rows.length,
      })
      span.finish()
      this.spanMap.delete(args.queryId)
    }
    return Promise.resolve(args.result)
  }
}
