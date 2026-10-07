// Builds photo-guide/README.md: every photo, which page + section it's on,
// and where its files live. Run with: npm run photo-guide
// Reads the real HTML pages, so the guide always matches the live site.
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { photos, HERO_SLUGS } = require("../build-images");

const ROOT = path.join(__dirname, "..");
const OUT_FILE = path.join(__dirname, "README.md");

const PAGES = [
  ["index.html", "Home"],
  ["about.html", "About"],
  ["menu.html", "Menu"],
  ["events.html", "Events"],
  ["gallery.html", "Gallery"],
  ["order.html", "Order"],
];

// slug -> source file in /assets. The Home hero uses its own "hero-*" sizes
// built from the same source as hero-outdoor-tray.
const sourceOf = {};
for (const [file, slug] of Object.entries(photos)) sourceOf[slug] = file;
sourceOf.hero = "Sun on Alfajores outside.jpg";
// Campaign exports retain their relative source path beneath assets/generated.
for (const file of fs.readdirSync(path.join(ROOT, "assets/generated"), {
  recursive: true,
})) {
  if (!file.endsWith(".png")) continue;
  const slug = "generated/" + file.replace(/\.png$/, "");
  sourceOf[slug] = "generated/" + file;
}

// Files in /assets that aren't photos on their own: provenance the HTML
// can't tell us.
const SOURCE_ONLY_NOTES = {
  "Final_Original_GordasGoodies.png":
    'Logo master. Becomes the header/footer logo and favicons (see "Site-wide").',
  "sticky date.jpg":
    'Uncropped original of "Sticky Toffee Pudding Cropped.jpg" (the crop is what the site uses).',
};

const text = (html) =>
  html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const attr = (tag, name) => {
  const m = tag.match(new RegExp(`${name}="([^"]*)"`));
  return m ? m[1] : "";
};

// "images/cookie-platter-700.jpg" -> "cookie-platter"; "images/hero-1200.jpg" -> "hero"
const slugFromSrc = (src) => {
  const m = src.match(/images\/([a-z0-9/-]+?)-\d+\.(?:jpg|webp|png)/);
  return m ? m[1] : null;
};

function sectionsOf(html) {
  const opens = [...html.matchAll(/<section\b[^>]*>/g)];
  const closes = [...html.matchAll(/<\/section>/g)];
  return opens.map((o, i) => ({
    start: o.index,
    end: closes[i] ? closes[i].index : html.length,
    cls: attr(o[0], "class"),
  }));
}

function describe(html, pos, imgTag, sections) {
  const sec = sections.find((s) => pos >= s.start && pos < s.end);
  if (!sec) return { section: "(outside a section)", item: "" };
  const body = html.slice(sec.start, sec.end);

  if (/\bhero\b/.test(sec.cls)) {
    const h1 = body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
    const row = /hero-photo-row/.test(body) ? " — photo strip" : "";
    return { section: `Top banner${row}`, item: h1 ? text(h1[1]) : "" };
  }

  // Nearest heading above the photo. Side-by-side layouts put the photo
  // before its text, so fall back to the section's first heading.
  const offset = pos - sec.start;
  const nearest = (re) => {
    const all = [...body.matchAll(re)];
    const above = all.filter((m) => m.index < offset);
    const m = above.length ? above[above.length - 1] : all[0];
    return m ? text(m[1]) : "";
  };
  const eyebrow = nearest(/<span class="eyebrow"[^>]*>([\s\S]*?)<\/span>/g);
  const h2 = nearest(/<h2[^>]*>([\s\S]*?)<\/h2>/g);
  let section = [eyebrow, h2].filter(Boolean).join(" — ");
  if (!section && /gallery-grid/.test(body))
    section = "Photo grid (click to enlarge)";
  if (!section) section = "(untitled section)";

  // A card's title comes right after its photo.
  const after = html.slice(pos + imgTag.length, sec.end);
  const nextImg = after.search(/<img\b/);
  const h3 = after.match(/<h3[^>]*>([\s\S]*?)<\/h3>/);
  const menuName = after.match(/class="menu-item-name"[^>]*>([\s\S]*?)<\/div>/);
  let item = "";
  if (h3 && (nextImg === -1 || h3.index < nextImg)) item = text(h3[1]);
  else if (menuName && (nextImg === -1 || menuName.index < nextImg))
    item = text(menuName[1]);
  return { section, item };
}

function collectUsage() {
  const byPage = {};
  const bySlug = {};
  for (const [file, label] of PAGES) {
    const html = fs.readFileSync(path.join(ROOT, file), "utf8");
    const sections = sectionsOf(html);
    byPage[label] = [];
    for (const m of html.matchAll(/<img\b[^>]*>/g)) {
      const slug = slugFromSrc(attr(m[0], "src"));
      if (!slug || slug.startsWith("logo") || slug.startsWith("favicon"))
        continue;
      const where = describe(html, m.index, m[0], sections);
      byPage[label].push({ slug, alt: attr(m[0], "alt"), ...where });
      (bySlug[slug] ||= new Set()).add(label);
    }
  }
  return { byPage, bySlug };
}

const thumb = (slug) => {
  const file = slug.startsWith("generated/")
    ? `${slug}-400.webp`
    : slug === "hero"
      ? "hero-480.jpg"
      : `${slug}-400.jpg`;
  return `<img src="../images/${file}" width="140" alt="">`;
};
const assetLink = (file) => `[\`${file}\`](../assets/${encodeURI(file)})`;
const cell = (s) => String(s || "").replace(/\|/g, "\\|");

async function sizeOf(file) {
  try {
    const m = await sharp(path.join(ROOT, "assets", file))
      .rotate()
      .metadata();
    return {
      w: m.autoOrient ? m.autoOrient.width : m.width,
      h: m.autoOrient ? m.autoOrient.height : m.height,
    };
  } catch (e) {
    return null;
  }
}

(async () => {
  const { byPage, bySlug } = collectUsage();
  const L = [];

  L.push("# Photo Guide");
  L.push("");
  L.push(
    "Every photo on the Gorda's Goodies site: what it looks like, which page and section it's on, and where its files live.",
  );
  L.push("");
  L.push(
    "> **This file is generated — don't edit it by hand.** After changing photos or pages, run `npm run photo-guide` and commit the result. It reads the actual HTML pages, so it always matches the live site.",
  );
  L.push("");

  L.push("## How photos are organized");
  L.push("");
  L.push("| Folder | What's in it | Edit it? |");
  L.push("|---|---|---|");
  L.push(
    "| [`assets/`](../assets/) | **Originals.** Full-size photos as they came off the camera / Google Drive, with human-readable names. | Yes — this is where new photos go. |",
  );
  L.push(
    "| [`images/`](../images/) | **Web-ready copies** the pages actually load. Generated from `assets/` — never hand-edited. | No — regenerate it instead. |",
  );
  L.push("| `photo-guide/` | This guide. | No — regenerate it instead. |");
  L.push("");
  L.push(
    '**Naming in `images/`:** each original gets a short lowercase name (a "slug") plus a width, in two formats:',
  );
  L.push("");
  L.push("- `<slug>-400` — thumbnails (gallery grid, photo strips)");
  L.push("- `<slug>-700` — cards and side-by-side sections");
  L.push("- `<slug>-1200` — gallery click-to-enlarge, and most top banners");
  L.push(
    `- \`<slug>-2000\` — extra-wide, only for full-width banners that need it (${[...HERO_SLUGS].map((s) => `\`${s}\``).join(", ")})`,
  );
  L.push(
    "- each size exists as `.jpg` and `.webp` (smaller; browsers that support it get it automatically)",
  );
  L.push(
    "- campaign photos under `generated/` use WebP exports and retain their PNG originals in `assets/generated/`",
  );
  L.push("");
  L.push(
    "The list of which original becomes which slug lives in [`build-images.js`](../build-images.js) (the `photos` map).",
  );
  L.push("");

  L.push("### To add or swap a photo");
  L.push("");
  L.push("1. Put the original in `assets/`.");
  L.push(
    "2. Add a line for it to the `photos` map in `build-images.js` (`'File Name.jpg': 'short-slug'`).",
  );
  L.push(
    "3. Run `npm run build-images` — this writes all its sizes into `images/`.",
  );
  L.push("4. Point the page at it, e.g. `images/short-slug-700.jpg`.");
  L.push(
    "5. Run `npm run photo-guide` to refresh this file, then commit everything.",
  );
  L.push("");

  L.push("## Photos by page");
  L.push("");
  for (const [, label] of PAGES) {
    const rows = byPage[label];
    L.push(
      `### ${label} (${rows.length} photo${rows.length === 1 ? "" : "s"})`,
    );
    L.push("");
    L.push(
      "| Photo | Where on the page | Name in `images/` | Original in `assets/` |",
    );
    L.push("|---|---|---|---|");
    for (const r of rows) {
      const where = r.item
        ? `**${cell(r.section)}**<br>${cell(r.item)}`
        : `**${cell(r.section)}**<br><sub>${cell(r.alt)}</sub>`;
      const src = sourceOf[r.slug];
      L.push(
        `| ${thumb(r.slug)} | ${where} | \`${r.slug}\` | ${src ? assetLink(src) : "—"} |`,
      );
    }
    L.push("");
  }

  L.push("## Every original, and where it's used");
  L.push("");
  L.push(
    "Sizes are the original's pixel dimensions. Anything under ~800px wide will look soft if used as a full-width banner — fine for thumbnails and cards.",
  );
  L.push("");
  L.push(
    "| Photo | Original in `assets/` | Name in `images/` | Size | Used on |",
  );
  L.push("|---|---|---|---|---|");
  const entries = Object.entries(sourceOf)
    .filter(([slug]) => slug !== "hero")
    .map(([slug, file]) => [file, slug])
    .sort((a, b) => a[1].localeCompare(b[1]));
  const unused = [];
  for (const [file, slug] of entries) {
    const used = new Set(bySlug[slug] || []);
    if (slug === "hero-outdoor-tray" && bySlug.hero)
      bySlug.hero.forEach((p) => used.add(`${p} (banner)`));
    const dims = await sizeOf(file);
    const size = dims
      ? `${dims.w}×${dims.h}${dims.w < 800 ? " ⚠️ low-res" : ""}`
      : "?";
    const usedOn = used.size ? [...used].join(", ") : "**Not used**";
    if (!used.size) unused.push([file, slug]);
    L.push(
      `| ${thumb(slug)} | ${assetLink(file)} | \`${slug}\` | ${size} | ${usedOn} |`,
    );
  }
  L.push("");

  L.push("## Not currently on any page");
  L.push("");
  if (unused.length) {
    L.push(
      "These are processed and ready in `images/` but no page shows them right now — safe to use, or to remove from `build-images.js` if they're not wanted.",
    );
    L.push("");
    for (const [file, slug] of unused)
      L.push(`- ${assetLink(file)} → \`${slug}\``);
  } else {
    L.push("Every processed photo is in use.");
  }
  L.push("");

  const assetFiles = fs
    .readdirSync(path.join(ROOT, "assets"))
    .filter((f) => !f.startsWith("."));
  const unmapped = assetFiles.filter((f) => f !== "generated" && !photos[f]);
  if (unmapped.length) {
    L.push("### Other files in `assets/`");
    L.push("");
    L.push("Not in the `photos` map, so they don't get web sizes generated:");
    L.push("");
    for (const f of unmapped)
      L.push(
        `- ${assetLink(f)} — ${SOURCE_ONLY_NOTES[f] || "No note yet; not used on the site."}`,
      );
    L.push("");
  }

  L.push("## Site-wide");
  L.push("");
  L.push("| Image | Files | Where |");
  L.push("|---|---|---|");
  L.push(
    '| <img src="../images/logo-crisp-320.png" width="100" alt=""> | `logo-crisp-320.png` (also `logo-crisp-640.png`, `logo-crisp-1280.png`) | Header and footer, every page |',
  );
  L.push(
    '| <img src="../images/favicon-32.png" width="32" alt=""> | `favicon-32.png`, `apple-touch-icon.png`, `favicon-512.png` | Browser tab icon / phone home-screen icon |',
  );
  L.push("");
  L.push(
    `All of these come from ${assetLink("Final_Original_GordasGoodies.png")}.`,
  );
  L.push("");

  fs.writeFileSync(OUT_FILE, L.join("\n"));
  const total = Object.values(byPage).reduce((n, r) => n + r.length, 0);
  console.log(
    `Wrote ${path.relative(ROOT, OUT_FILE)}: ${total} photo placements across ${PAGES.length} pages, ${unused.length} unused.`,
  );
})();
