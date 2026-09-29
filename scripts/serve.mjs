import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "dist");
const port = Number(process.env.PORT || 4174);
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url || "/", "http://localhost").pathname);
    let target = path.resolve(root, `.${pathname}`);
    if (!target.startsWith(root)) throw new Error("Invalid path");
    if ((await stat(target).catch(() => null))?.isDirectory()) target = path.join(target, "index.html");
    const content = await readFile(target).catch(() => readFile(path.join(root, "index.html")));
    response.writeHead(200, { "Content-Type": mimeTypes[path.extname(target)] || "application/octet-stream" });
    response.end(content);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`ERP test server listening on http://127.0.0.1:${port}`);
});
