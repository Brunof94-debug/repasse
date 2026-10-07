import {copyFile, mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const target = new URL('../dist/media/', import.meta.url);
await mkdir(target, {recursive: true});
for (const name of ['repasse-pitch.mp4', 'repasse-demo.mp4', 'repasse-global-pitch.mp4']) {
  await copyFile(new URL(`../docs/media/${name}`, import.meta.url), new URL(name, target));
}
console.log(`Copied presentation videos to ${fileURLToPath(target)}`);
