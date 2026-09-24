// Export campaign images at actual responsive widths without enlarging originals.
const sharp = require("sharp");
const fs = require("node:fs/promises");
const path = require("node:path");
async function buildDirectory(relative = "") {
  const source = path.join(__dirname, "assets", "generated", relative);
  const destination = path.join(__dirname, "images", "generated", relative);
  await fs.mkdir(destination, { recursive: true });
  for (const entry of await fs.readdir(source, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      await buildDirectory(path.join(relative, entry.name));
      continue;
    }
    if (!entry.name.endsWith(".png")) continue;
    const stem = path.basename(entry.name, ".png");
    for (const width of [400, 700, 1200, 1600]) {
      await sharp(path.join(source, entry.name))
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: width >= 1200 ? 88 : 84, effort: 6 })
        .toFile(path.join(destination, `${stem}-${width}.webp`));
    }
  }
}
buildDirectory().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
