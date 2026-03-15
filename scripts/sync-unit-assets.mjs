import { copyFile, mkdir, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const sourceDir = resolve('src/assets/units');
const targetDir = resolve('public/assets/units');

await mkdir(targetDir, { recursive: true });

for (const entry of await readdir(sourceDir, { withFileTypes: true })) {
  if (!entry.isFile()) {
    continue;
  }

  await copyFile(resolve(sourceDir, entry.name), resolve(targetDir, entry.name));
}

console.log(`Synced unit assets from ${sourceDir} to ${targetDir}`);
