import { file } from "bun";

const port = Number(Bun.env.PORT || "4173");
const root = new URL("../", import.meta.url);

const types: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

const resolveCandidates = (pathname: string): string[] => {
  if (pathname === "/" || pathname === "") {
    return ["demo/index.html"];
  }

  const relativePath = pathname.startsWith("/") ? pathname.slice(1) : pathname;
  if (relativePath.startsWith("demo/") || relativePath.startsWith("dist/") || relativePath.startsWith("test/")) {
    return [relativePath];
  }

  return [relativePath, `demo/${relativePath}`];
};

const contentTypeFor = (pathname: string): string | undefined => {
  const dot = pathname.lastIndexOf(".");
  return dot === -1 ? undefined : types[pathname.slice(dot)];
};

const server = Bun.serve({
  port,
  async fetch(request) {
    const url = new URL(request.url);
    const candidates = resolveCandidates(url.pathname);

    for (const relativePath of candidates) {
      const fileUrl = new URL(relativePath, root);
      const asset = file(fileUrl);

      if (!(await asset.exists())) {
        continue;
      }

      const headers = new Headers();
      const contentType = contentTypeFor(relativePath);
      if (contentType) {
        headers.set("content-type", contentType);
      }
      headers.set("cache-control", "no-store");

      return new Response(asset, { headers });
    }

    return new Response("Not found", { status: 404 });
  }
});

console.log(`pinu-bot demo running at http://localhost:${server.port}`);
