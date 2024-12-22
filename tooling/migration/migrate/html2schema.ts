import { convertHtmlToSchema } from "./utils";

// NOTE: just renaming this because the convertHtmlToSchema function assigns to a global
// which we cannot do in an import
export const html2schema = convertHtmlToSchema;
