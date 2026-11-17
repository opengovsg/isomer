// Minimal static server for a build's out/ dir (directory -> index.html, unknown -> 404.html).
//   node scripts/serve.mjs <dir> <port>
import fs from "node:fs"
import http from "node:http"
import path from "node:path"

const TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".woff2": "font/woff2",
  ".json": "application/json",
  ".txt": "text/plain",
  ".png": "image/png",
  ".svg": "image/svg+xml",
}

export const serve = (dir, port) =>
  new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let file = path.join(
        dir,
        decodeURIComponent(new URL(req.url, "http://x").pathname),
      )
      if (fs.existsSync(file) && fs.statSync(file).isDirectory())
        file = path.join(file, "index.html")
      if (!fs.existsSync(file)) {
        file = path.join(dir, "404.html")
        res.statusCode = 404
      }
      res.setHeader(
        "content-type",
        TYPES[path.extname(file)] ?? "application/octet-stream",
      )
      res.end(fs.readFileSync(file))
    })
    server.listen(port, () => resolve(server))
  })

if (import.meta.main) {
  const [dir, port] = process.argv.slice(2)
  await serve(path.resolve(dir), Number(port))
  console.log(`serving ${dir} on ${port}`)
}
