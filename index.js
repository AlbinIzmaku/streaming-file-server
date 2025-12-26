import http from "node:http";
import * as fs from "node:fs";
import os from "node:os";
import { fileURLToPath } from "node:url";
import path from "node:path";

const server = http
  .createServer((request, response) => {
    const { headers, method, url } = request;
    if (method === "GET" && url === "/") {
      response.writeHead(200, { "content-type": "text/html" });
      fs.createReadStream("./index.html").pipe(response);
      return;
    }
    if (method === "GET" && url === "/files/nature.mp4") {
      const videoPath = path.join(import.meta.dirname, "files", "nature.mp4");

      fs.stat(videoPath, (err, stats) => {
        if (err) {
          response.writeHead(404);
          response.end("Video not found");
          return;
        }

        const range = headers.range;
        if (!range) {
          response.writeHead(200, {
            "content-type": "video/mp4",
            "content-length": stats.size,
            "accept-ranges": "bytes",
          });
          fs.createReadStream(videoPath).pipe(response);
          return;
        }

        const [startStr, endStr] = range.replace("bytes=", "").split("-");
        const start = Number(startStr);
        const end = endStr ? Number(endStr) : stats.size - 1;
        const chunkSize = end - start + 1;

        response.writeHead(206, {
          "content-type": "video/mp4",
          "content-length": chunkSize,
          "content-range": `bytes ${start} - ${end}/${stats.size}`,
          "accept-ranges": "bytes",
        });

        const stream = fs.createReadStream(videoPath, { start, end });
        stream.pipe(response);
      });

      return;

      // response.writeHead(200, { "content-type": "video/mp4" });
      // fs.createReadStream(videoPath).pipe(response);
      // return;
    }
  })
  .listen(3000);
