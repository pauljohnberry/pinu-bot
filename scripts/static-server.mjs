import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join } from "node:path";

const port = Number(process.env.PORT || "53001");
const root = process.cwd();

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

const sanitizeRelativePath = (pathname) => {
  const rawPath = pathname.replace(/^\/+/, "");

  let decodedPath = rawPath;
  try {
    decodedPath = decodeURIComponent(rawPath);
  } catch {
    return null;
  }

  if (decodedPath.includes("\\") || decodedPath.includes("\0")) {
    return null;
  }

  const segments = [];
  for (const segment of decodedPath.split("/")) {
    if (!segment || segment === ".") {
      continue;
    }
    if (segment === "..") {
      return null;
    }
    segments.push(segment);
  }

  return segments.join("/");
};

const resolveCandidates = (pathname) => {
  if (pathname === "/" || pathname === "") {
    return [join(root, "demo/index.html")];
  }

  if (pathname === "/showcase" || pathname === "/showcase/") {
    return [join(root, "showcase/index.html")];
  }

  const cleaned = sanitizeRelativePath(pathname);
  if (!cleaned) {
    return [];
  }

  if (
    cleaned.startsWith("demo/") ||
    cleaned.startsWith("dist/") ||
    cleaned.startsWith("test/") ||
    cleaned.startsWith("showcase/") ||
    cleaned.startsWith("public/")
  ) {
    return [join(root, cleaned)];
  }

  return [join(root, "public", cleaned), join(root, "demo", cleaned)];
};

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://127.0.0.1:${port}`);
  const candidates = resolveCandidates(url.pathname);

  for (const filePath of candidates) {
    if (!existsSync(filePath)) {
      continue;
    }

    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      continue;
    }

    response.setHeader("cache-control", "no-store");
    response.setHeader(
      "content-type",
      contentTypes[extname(filePath)] || "application/octet-stream",
    );
    createReadStream(filePath).pipe(response);
    return;
  }

  response.writeHead(404);
  response.end("Not found");
});

server.listen(port, "127.0.0.1", () => {
  console.log(`static server listening on http://127.0.0.1:${port}`);
});
