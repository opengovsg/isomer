import { generateOpenApiDocument } from "trpc-openapi"

import { getBaseUrl } from "~/utils/getBaseUrl"
import { appRouter } from "./modules/_app"
import { sessionOptions } from "./modules/auth/session"

export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: "Starter Kit OpenAPI",
  version: "1.0.0",
  baseUrl: `${getBaseUrl()}/api`,
  securitySchemes: {
    cookieAuth: {
      type: "apiKey",
      in: "cookie",
      name: sessionOptions.cookieName,
    },
  },
})
