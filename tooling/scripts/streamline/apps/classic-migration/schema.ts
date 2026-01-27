/* eslint-disable no-undef */
import { schema } from "@opengovsg/isomer-components";
import Ajv from "ajv";

const cleanedSchema = JSON.stringify(schema, null, 2)
  // Replace all references via IDs to references via the schema path
  .replace(/"\$ref": "components-native-/g, '"$ref": "#/components/native/')
  // Remove all instances of $id since we no longer need it
  .replace(/^.*\$id.*\n?/gm, "");

const ajv = new Ajv({
  useDefaults: true,
  allErrors: true,
  strict: false,
  logger: false,
});

export const isomerSchemaValidator = ajv.compile(JSON.parse(cleanedSchema));
