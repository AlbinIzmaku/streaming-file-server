import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getMimeType, isAllowedExtension } from "./utils/mimeTypes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const FILES_DIR = path.join(__dirname, "files");
const PUBLIC_DIR = path.join(__dirname, "public");

const server = http.createServer((req, res) => {
  const { method, url, headers } = req;
  const parsedUrl = new URL(url, `http://${headers.host}`);
  const pathname = parsedUrl.pathname;

  if (method === "GET" && pathname === "/") {
    const homePath = path.join(PUBLIC_DIR, "index.html");
    fs.createReadStream(homePath).pipe(res);
    return;
  }

  if (method === "GET" && pathname === "/stream") {
    const fileName = parsedUrl.searchParams.get("file");
    if (!fileName) {
      res.writeHead(400);
      res.end("Missing file parameter");
      return;
    }

    if (fileName.includes("..") || !isAllowedExtension(fileName)) {
      res.writeHead(403);
      res.end("Forbidden file");
      return;
    }

    const filePath = path.join(FILES_DIR, fileName);
    if (!fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end("File not found");
      return;
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = headers.range;
    const mimeType = getMimeType(fileName);

    if (!range) {
      res.writeHead(200, {
        "Content-Type": mimeType,
        "Content-Length": fileSize,
        "Accept-Ranges": "bytes",
      });
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize || end >= fileSize) {
      res.writeHead(416, {
        "Content-Range": `bytes */${fileSize}`,
      });
      res.end();
      return;
    }

    const chunkSize = end - start + 1;
    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": mimeType,
    });

    const stream = fs.createReadStream(filePath, { start, end });
    stream.pipe(res);

    stream.on("error", () => {
      res.end();
    });

    return;
  }

  res.writeHead(404);
  res.end("Route not found");
});

server.listen(PORT, () => {
  console.log(`Streaming server running on http://localhost:${PORT}`);
});