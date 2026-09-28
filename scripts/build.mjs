import { cp, mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.join(projectRoot, "dist");

const publicFiles = [
  "index.html",
  "_redirects",
];

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });

for (const file of publicFiles) {
  await cp(path.join(projectRoot, file), path.join(outputDirectory, file));
}

await cp(path.join(projectRoot, "assets"), path.join(outputDirectory, "assets"), {
  recursive: true,
});

await cp(path.join(projectRoot, "src"), path.join(outputDirectory, "src"), {
  recursive: true,
});

console.log("Build concluido: arquivos publicos gerados em dist/.");
