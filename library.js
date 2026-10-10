const fs = require("fs");
const pth = require("path");
const { parseFile } = require("music-metadata");
const a_f = pth.resolve(process.env.AUDIO_FOLDER || "./audio");
const AUDIO_EXT = [".mp3", ".wav", ".ogg", ".flac", ".m4a"];
const isAudio = (f) => AUDIO_EXT.includes(pth.extname(f).toLowerCase());
// Lists folders or audio files anywhere under the audio folder, as paths relative to it.
function listLibrary(dirs, base = "") {
 try {
  return fs
   .readdirSync(pth.join(a_f, base), { recursive: true, withFileTypes: true })
   .filter((e) => (dirs ? e.isDirectory() : e.isFile() && isAudio(e.name)))
   .map((e) => pth.relative(a_f, pth.join(e.parentPath ?? e.path, e.name)));
 } catch (e) {
  console.error("Error reading audio folder:", e);
  return [];
 }
}
// Resolves a user-supplied relative path, refusing anything outside the audio folder.
function inLibrary(rel) {
 const p = pth.resolve(a_f, rel || "");
 return p === a_f || p.startsWith(a_f + pth.sep) ? p : null;
}
// Autocomplete must answer within 3 seconds, so it reads from a cached scan instead of the disk.
// ponytail: rescans every 5 minutes and after uploads, so new files can take up to 5 minutes to appear
const cache = { files: [], dirs: [] };
// relative path -> "Title - Artist" from the file's tags, or null if it has none
const tags = new Map();
let readingTags = false;
function refreshLibrary() {
 const t = Date.now();
 cache.files = listLibrary(false);
 cache.dirs = listLibrary(true);
 console.log(
  `Scanned library: ${cache.files.length} songs, ${cache.dirs.length} folders (${Date.now() - t}ms)`,
 );
 readTags();
}
// Reads tags in the background; songs show their filename until their tags are read.
// ponytail: tags are re-read from disk on every restart, save them to a file if big libraries start slowly
async function readTags() {
 if (readingTags) return;
 readingTags = true;
 const t = Date.now();
 let n = 0;
 for (const f of cache.files) {
  if (tags.has(f)) continue;
  try {
   const { common } = await parseFile(pth.join(a_f, f), {
    duration: false,
    skipCovers: true,
   });
   const title = common.title?.trim();
   const artist = common.artist?.trim();
   tags.set(f, title ? (artist ? `${title} - ${artist}` : title) : null);
  } catch {
   tags.set(f, null);
  }
  n++;
 }
 readingTags = false;
 if (n) console.log(`Read tags for ${n} songs (${Date.now() - t}ms)`);
}
// Display name for a song: its tag title, or the filename without extension.
function songName(fp) {
 const rel = pth.isAbsolute(fp) ? pth.relative(a_f, fp) : fp;
 return tags.get(rel) || pth.basename(fp, pth.extname(fp));
}
module.exports = {
 AUDIO_FOLDER: a_f,
 cache,
 listLibrary,
 inLibrary,
 refreshLibrary,
 readTags,
 songName,
};
