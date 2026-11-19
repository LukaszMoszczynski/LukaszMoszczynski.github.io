// Writes the Unbounded files the site serves into src/assets/fonts (run: npm run fonts).
// fontsource's latin-ext file is 116 KiB and loads on every page only for the Polish letters
// in the name and the PL copy; the subset keeps just those letters, with the full weight axis.
import { copyFile, readFile, writeFile } from 'node:fs/promises';
import subsetFont from 'subset-font';

const source = 'node_modules/@fontsource-variable/unbounded/files';
const target = 'src/assets/fonts';
/** Must match the unicode-range of the Polish face in src/styles/fonts.css. */
export const POLISH = 'ĄąĆćĘęŁłŃńŚśŹźŻż';

await copyFile(`${source}/unbounded-latin-wght-normal.woff2`, `${target}/unbounded-latin-wght.woff2`);
const latinExt = await readFile(`${source}/unbounded-latin-ext-wght-normal.woff2`);
const polish = await subsetFont(latinExt, POLISH, { targetFormat: 'woff2' });
await writeFile(`${target}/unbounded-polish-wght.woff2`, polish);
console.log(`unbounded-polish-wght.woff2: ${(latinExt.length / 1024).toFixed(0)} KiB → ${(polish.length / 1024).toFixed(1)} KiB`);
