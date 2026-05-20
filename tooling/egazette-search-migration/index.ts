import { Command } from "commander"

import { exportAlgolia } from "./algolia"
import { ingest } from "./ingest"
import { verify } from "./verify"

const program = new Command()

program
  .name("egazette-search-migration")
  .description(
    "Export eGazette records from Algolia and ingest them into SearchSG in " +
      "idempotent, resumable, rate-limited batches.",
  )

program
  .command("export")
  .description("Browse all records from Algolia into the NDJSON documents file")
  .action(exportAlgolia)

program
  .command("ingest")
  .description(
    "Ingest the NDJSON documents file into SearchSG (idempotent + resumable)",
  )
  .action(ingest)

program
  .command("verify")
  .description(
    "Compare source document count against SearchSG's document count",
  )
  .action(verify)

await program.parseAsync()
