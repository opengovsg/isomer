import type { TSchema } from "@sinclair/typebox"

import { IsomerPageSchema } from "~/types"
import { componentSchemaDefinitions } from "./components"

export const schema: TSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "Isomer Next Page Schema",
  ...IsomerPageSchema,
  ...componentSchemaDefinitions,
}
