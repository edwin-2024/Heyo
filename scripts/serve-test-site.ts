import { serve } from "bun";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const PORT = 5000;
const testWebDir = join(process.cwd(), "test-website");

serve({
  port: PORT,
  fetch(req: Request) {
    const url = new URL(req.url);
    const fileName = url.pathname === "/" ? "index.html" : url.pathname;
    const filePath = join(testWebDir, fileName);

    if (existsSync(filePath)) {
      const ext = filePath.split(".").pop() || "";
      const mimeTypes: Record<string, string> = {
        html: "text/html; charset=utf-8",
        css: "text/css; charset=utf-8",
        js: "application/javascript; charset=utf-8",
        json: "application/json",
        png: "image/png",
        jpg: "image/jpeg",
        svg: "image/svg+xml",
      };
      return new Response(readFileSync(filePath), {
        headers: {
          "Content-Type": mimeTypes[ext] || "text/plain",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`🚀 Heyo External Customer Test Website running at: http://localhost:${PORT}`);
console.log(`   Connected to Heyo Platform at: http://localhost:3000`);
