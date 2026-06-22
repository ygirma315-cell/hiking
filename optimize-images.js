const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

async function optimize() {
  const assets = path.join(__dirname, "assets");

  // Hero image — max 1600px
  await sharp(path.join(assets, "hero", "hero-bg.jpg"))
    .resize(1600)
    .webp({ quality: 80 })
    .toFile(path.join(assets, "hero", "hero-bg.webp"));
  console.log("✓ hero-bg.webp");

  // Hiking card images — max 900px
  const hikingDir = path.join(assets, "hikings");
  for (const file of fs.readdirSync(hikingDir)) {
    if (file.endsWith(".jpg") || file.endsWith(".jpeg") || file.endsWith(".png")) {
      const name = path.parse(file).name;
      await sharp(path.join(hikingDir, file))
        .resize(900)
        .webp({ quality: 80 })
        .toFile(path.join(hikingDir, `${name}.webp`));
      console.log(`✓ hikings/${name}.webp`);
    }
  }

  // Gallery thumbnails — max 600px
  const galleryDir = path.join(assets, "gallery");
  for (const place of fs.readdirSync(galleryDir)) {
    const placeDir = path.join(galleryDir, place);
    if (!fs.statSync(placeDir).isDirectory()) continue;
    fs.mkdirSync(path.join(placeDir, "thumb"), { recursive: true });
    for (const file of fs.readdirSync(placeDir)) {
      if (!file.endsWith(".jpg") && !file.endsWith(".jpeg") && !file.endsWith(".png")) continue;
      const name = path.parse(file).name;
      // Skip if already in thumb folder
      if (placeDir.includes("thumb")) continue;
      await sharp(path.join(placeDir, file))
        .resize(600)
        .webp({ quality: 75 })
        .toFile(path.join(placeDir, "thumb", `${name}.webp`));
      console.log(`✓ gallery/${place}/thumb/${name}.webp`);
    }
  }

  // Logo
  await sharp(path.join(assets, "logo", "logo.png"))
    .resize(120)
    .webp({ quality: 90 })
    .toFile(path.join(assets, "logo", "logo.webp"));
  console.log("✓ logo.webp");

  console.log("\nDone! All images optimized.");
}

optimize().catch(err => { console.error(err); process.exit(1); });
