import type { TSchema } from "@sinclair/typebox"

import { FooterSchema, NavbarSchema } from "~/interfaces"
import { IsomerPageSchema, SiteConfigSchema } from "~/types"
import { componentSchemaDefinitions } from "./components"

export const schema: TSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "Isomer Next Page Schema",
  ...IsomerPageSchema,
  ...componentSchemaDefinitions,
}

export const siteSchema: TSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "Isomer Next Site Schema",
  ...SiteConfigSchema,
}

export const navbarSchema: TSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "Isomer Next Navbar Schema",
  ...NavbarSchema,
}

export const footerSchema: TSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "Isomer Next Footer Schema",
  ...FooterSchema,
}
