import { env } from "./env.mjs"

export async function register() {
  // make sure you only run on nodejs runtime or you will have errors with built-in modules not being defined
  if (env.NODE_ENV === "production") {
    console.log("Instrumenting Next.js Server")
    await import("~/server/modules/tracer")
  }
}
