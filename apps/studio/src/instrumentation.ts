export async function register() {
  // make sure you only run on nodejs runtime or you will have errors with built-in modules not being defined
  // eslint-disable-next-line no-restricted-properties
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log("Instrumenting Next.js Server")
    await import("~/server/modules/tracer")
  }
}
