// Export the unchanged original logo without its large empty margins.
const sharp = require("sharp");
const path = require("node:path");
async function buildLogo() {
  const source = path.join(
    __dirname,
    "assets",
    "Final_Original_GordasGoodies.png",
  );
  const cropped = await sharp(source).trim({ threshold: 15 }).toBuffer();
  await sharp(cropped)
    .png({ compressionLevel: 9 })
    .toFile(path.join(__dirname, "images", "logo-master.png"));
  for (const width of [320, 640, 1280]) {
    await sharp(cropped)
      .resize({ width, withoutEnlargement: true })
      .png({ compressionLevel: 9 })
      .toFile(path.join(__dirname, "images", `logo-crisp-${width}.png`));
  }
}
buildLogo().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
