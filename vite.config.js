import fs from "node:fs";
import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
function normalizeBasePath(raw) {
    const trimmed = raw?.trim();
    if (!trimmed)
        return "/";
    let base = trimmed;
    if (!base.startsWith("/"))
        base = `/${base}`;
    if (!base.endsWith("/"))
        base = `${base}/`;
    return base;
}
function injectSiteUrlForHtml() {
    return {
        name: "inject-site-url-html",
        transformIndexHtml: {
            order: "pre",
            handler(html, ctx) {
                const mode = ctx.server?.config?.mode ?? "production";
                const fileEnv = loadEnv(mode, process.cwd(), "");
                const site = (process.env.VITE_SITE_URL ?? fileEnv.VITE_SITE_URL ?? "").trim();
                let out = html.replaceAll("__SITE_URL__", site);
                if (!site) {
                    out = out.replace(/\s*<link rel="canonical"[^>]*>\s*\n?/gi, "\n");
                    out = out.replace(/\s*<meta property="og:url"[^>]*>\s*\n?/gi, "\n");
                    out = out.replace(/\s*"url":\s*""\s*,\s*\n/, "\n");
                }
                return out;
            },
        },
    };
}
function seoDistFilesPlugin() {
    let outDir = "dist";
    return {
        name: "seo-dist-files",
        apply: "build",
        configResolved(config) {
            outDir = path.resolve(config.root, config.build.outDir);
        },
        closeBundle() {
            const fileEnv = loadEnv("production", process.cwd(), "");
            const siteUrlRaw = (process.env.VITE_SITE_URL ?? fileEnv.VITE_SITE_URL ?? "").trim();
            if (!siteUrlRaw || !siteUrlRaw.includes(".github.io"))
                return;
            const siteUrl = siteUrlRaw.endsWith("/") ? siteUrlRaw.slice(0, -1) : siteUrlRaw;
            const rootWithSlash = `${siteUrl}/`;
            const robots = `User-agent: *\nAllow: /\n\nSitemap: ${rootWithSlash}sitemap.xml\n`;
            const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${rootWithSlash}</loc>\n  </url>\n</urlset>\n`;
            fs.mkdirSync(outDir, { recursive: true });
            fs.writeFileSync(path.join(outDir, "robots.txt"), robots, "utf8");
            fs.writeFileSync(path.join(outDir, "sitemap.xml"), sitemap, "utf8");
        },
    };
}
export default defineConfig(({ mode }) => {
    const fileEnv = loadEnv(mode, process.cwd(), "");
    const base = normalizeBasePath(process.env.VITE_BASE_PATH || fileEnv.VITE_BASE_PATH);
    return {
        base,
        plugins: [injectSiteUrlForHtml(), react(), seoDistFilesPlugin()],
        build: {
            sourcemap: true,
        },
    };
});
