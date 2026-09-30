// Static site builder for Property Link Partners.
// No dependencies: assembles src/pages/*.html with src/partials/*.html into docs/.
//
// Usage:
//   node build.mjs
//   SITE_URL=https://www.example-domain.com node build.mjs   (adds canonical URLs + sitemap.xml)

import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, statSync, copyFileSync, existsSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const src = join(root, "src");
const out = join(root, "docs");
const siteUrl = (process.env.SITE_URL || "").replace(/\/+$/, "");

const partials = Object.fromEntries(
  readdirSync(join(src, "partials"))
    .filter((f) => f.endsWith(".html"))
    .map((f) => [f.replace(/\.html$/, ""), readFileSync(join(src, "partials", f), "utf8")])
);

function copyDir(from, to) {
  mkdirSync(to, { recursive: true });
  for (const entry of readdirSync(from)) {
    const s = join(from, entry);
    const d = join(to, entry);
    if (statSync(s).isDirectory()) copyDir(s, d);
    else copyFileSync(s, d);
  }
}

function includePartials(html, depth = 0) {
  if (depth > 5) throw new Error("Partial nesting too deep");
  return html.replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (_, name) => {
    if (!(name in partials)) throw new Error(`Unknown partial: ${name}`);
    return includePartials(partials[name], depth + 1);
  });
}

// Line icons (24px grid, stroked via CSS). Use {{icon:name}} in pages/partials.
const icons = {
  investor: '<path d="M4 19h16"/><path d="m5 15 4-4 3 3 6-7"/><path d="M14 7h4v4"/>',
  home: '<path d="M4 11 12 4l8 7"/><path d="M6 10v10h12V10"/><path d="M10 20v-5h4v5"/>',
  swap: '<path d="M6 8h12l-3-3"/><path d="M18 16H6l3 3"/>',
  team: '<circle cx="9" cy="8" r="3"/><path d="M3 20c.8-3.3 3.2-5 6-5s5.2 1.7 6 5"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2c2.5 0 4.3 1.6 5 4.3"/>',
  phone: '<path d="M5 4h3.5l2 5-2.4 1.6a11 11 0 0 0 5.3 5.3L15 13.5l5 2V19a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  clipboard: '<rect x="5" y="4.5" width="14" height="16.5" rx="2"/><path d="M9 3h6v3H9z"/><path d="m9 13.5 2 2 4-4"/>',
  calendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/><path d="m9.5 15 1.8 1.8 3.4-3.4"/>',
  followup: '<path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20 4v5h-5"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.3-4.3"/>',
  crm: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M3 9h18M9 9v11"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.2"/><circle cx="4.5" cy="12" r="1.2"/><circle cx="4.5" cy="18" r="1.2"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  data: '<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/><path d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
  shield: '<path d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6z"/><path d="m9 12 2 2 4-4"/>',
  headset: '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="13" width="4" height="6" rx="1.5"/><rect x="17" y="13" width="4" height="6" rx="1.5"/><path d="M19 19c0 1.5-2 2.5-5 2.5"/>',
  map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
  document: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/><path d="M10 13h6M10 17h4"/>',
  message: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9.5h8M8 12.5h5"/>',
  arrow: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
  building: '<rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/>',
  land: '<path d="M3 18c3-2 5-2 9 0s6 2 9 0"/><path d="M8 14V8"/><path d="M5.5 10.5 8 8l2.5 2.5"/><path d="M15 13V6"/><path d="M12.5 8.5 15 6l2.5 2.5"/>',
  alert: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 2.4 17.5A2 2 0 0 0 4.1 20.5h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'
};
const iconSvg = (name) => {
  if (!icons[name]) throw new Error(`Unknown icon: ${name}`);
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${icons[name]}</svg>`;
};

const escapeAttr = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

if (existsSync(out)) rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
copyDir(join(src, "assets"), join(out, "assets"));

const sitemap = [];

for (const file of readdirSync(join(src, "pages")).filter((f) => f.endsWith(".html"))) {
  const raw = readFileSync(join(src, "pages", file), "utf8");
  const match = raw.match(/^<!--meta\s*([\s\S]*?)-->\s*/);
  if (!match) throw new Error(`Missing meta block in ${file}`);
  const meta = JSON.parse(match[1]);
  const body = raw.slice(match[0].length);

  // "index" -> /index.html, "404" -> /404.html, everything else -> /<slug>/index.html
  const slug = file.replace(/\.html$/, "");
  const isFlat = slug === "index" || slug === "404";
  const outFile = isFlat ? join(out, `${slug}.html`) : join(out, slug, "index.html");
  const urlPath = slug === "index" ? "/" : isFlat ? `/${slug}.html` : `/${slug}/`;
  const base = relative(dirname(outFile), out).replace(/\\/g, "/");
  const basePrefix = base ? `${base}/` : "./";

  const canonical = siteUrl && slug !== "404" ? `<link rel="canonical" href="${siteUrl}${urlPath}">\n  <meta property="og:url" content="${siteUrl}${urlPath}">` : "";

  let html = includePartials(partials.layout.replace("{{content}}", body));
  html = html
    .replace(/\{\{title\}\}/g, escapeAttr(meta.title))
    .replace(/\{\{description\}\}/g, escapeAttr(meta.description))
    .replace(/\{\{canonical\}\}/g, canonical)
    .replace(/\{\{robots\}\}/g, meta.noindex ? '<meta name="robots" content="noindex">' : "")
    .replace(/\{\{bodyClass\}\}/g, meta.bodyClass || "")
    .replace(/\{\{active:([\w-]+)\}\}/g, (_, key) => (key === meta.nav ? ' aria-current="page"' : ""))
    .replace(/\{\{icon:([\w-]+)\}\}/g, (_, name) => iconSvg(name))
    .replace(/\{\{base\}\}/g, basePrefix);

  const leftover = html.match(/\{\{[^}]*\}\}/);
  if (leftover) throw new Error(`Unresolved placeholder ${leftover[0]} in ${file}`);

  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, html);
  if (!meta.noindex) sitemap.push(urlPath);
  console.log(`built ${relative(root, outFile)}`);
}

writeFileSync(join(out, ".nojekyll"), "");

if (siteUrl) {
  const urls = sitemap.map((p) => `  <url><loc>${siteUrl}${p}</loc></url>`).join("\n");
  writeFileSync(join(out, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
  writeFileSync(join(out, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`);
} else {
  writeFileSync(join(out, "robots.txt"), "User-agent: *\nAllow: /\n");
}
