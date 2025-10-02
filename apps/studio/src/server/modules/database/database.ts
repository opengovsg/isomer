import { type DB } from "~prisma/generated/generatedTypes"
import ddTrace from "dd-trace"
import {
  KyselyPlugin,
  PluginTransformQueryArgs,
  PluginTransformResultArgs,
  PostgresDialect,
  QueryResult,
  UnknownRow,
} from "kysely"
import pg from "pg"

import { env } from "~/env.mjs"
import { Kysely } from "./types"

const connectionString = `${env.DATABASE_URL}`

class TracingPlugin implements KyselyPlugin {
  private spanMap = new WeakMap<
    PluginTransformQueryArgs["queryId"],
    ddTrace.Span
  >()
  transformQuery(args: PluginTransformQueryArgs) {
    const queryId = args.queryId
    // only create spans if dd-trace is properly initialized, which is NOT the case if running in a seed script
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (ddTrace?.tracer) {
      const span = ddTrace.tracer.startSpan(`kysely_${args.node.kind}`, {
        childOf: ddTrace.tracer.scope().active() ?? undefined,
        tags: {
          "kysely.query_id": queryId,
          "kysely.kind": args.node.kind,
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

// TODO: Add ssl option later
const dialect = new PostgresDialect({
  pool: new pg.Pool({
    connectionString,
  }),
})

export const db: Kysely<DB> = new Kysely<DB>({
  // eslint-disable-next-line no-restricted-properties
  log: process.env.NODE_ENV === "development" ? ["error"] : undefined,
  dialect,
  // add tracing plugin for dd-spans to intercept kysely queries
  plugins: [new TracingPlugin()],
})
