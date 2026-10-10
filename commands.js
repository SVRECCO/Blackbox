const djs = require("discord.js");
const fs = require("fs");
const pth = require("path");
const web = require("https");
const { state: st, playNext: nxt } = require("./audioPlayer");
const a_f = pth.resolve(process.env.AUDIO_FOLDER || "./audio");
const AUDIO_EXT = [".mp3", ".wav", ".ogg", ".flac", ".m4a"];
const isAudio = (f) => AUDIO_EXT.includes(pth.extname(f).toLowerCase());
// Lists folders or audio files anywhere under the audio folder, as paths relative to it.
// ponytail: walks the whole library on every call, cache it if a huge library makes autocomplete slow
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
const folderOption = {
 name: "folder",
 description: "Folder inside the music library (leave empty for the whole library)",
 type: djs.ApplicationCommandOptionType.String,
 required: false,
 autocomplete: true,
};
const cmd = [
 {
  name: "play",
  description: "Play a local audio file",
  options: [
   {
    name: "filename",
    description: "Start typing a song name",
    type: djs.ApplicationCommandOptionType.String,
    required: true,
    autocomplete: true,
   },
  ],
 },
 {
  name: "playall",
  description: "Play all audio files in a folder (including its subfolders)",
  options: [
   folderOption,
   {
    name: "shuffle",
    description: "Shuffle the songs before playing",
    type: djs.ApplicationCommandOptionType.Boolean,
    required: false,
   },
   {
    name: "loop",
    description: "Loop the playlist when finished",
    type: djs.ApplicationCommandOptionType.Boolean,
    required: false,
   },
  ],
 },
 {
  name: "upload",
  description: "Upload an audio file",
  options: [
   {
    name: "file",
    description: "The audio file to upload",
    type: djs.ApplicationCommandOptionType.Attachment,
    required: true,
   },
   folderOption,
  ],
 },
 {
  name: "pause",
  description: "Pause the current song",
 },
 {
  name: "resume",
  description: "Resume the current song",
 },
 {
  name: "stop",
  description: "Stop the current song and clear the queue",
 },
 {
  name: "skip",
  description: "Skip to the next song in the queue",
 },
 {
  name: "clearqueue",
  description: "Clear the current queue",
 },
];
// Autocomplete must answer within 3 seconds, so it reads from a cached scan instead of the disk.
// ponytail: rescans every 5 minutes and after uploads, so new files can take up to 5 minutes to appear
const cache = { files: [], dirs: [] };
function refreshLibrary() {
 const t = Date.now();
 cache.files = listLibrary(false);
 cache.dirs = listLibrary(true);
 console.log(
  `Scanned library: ${cache.files.length} songs, ${cache.dirs.length} folders (${Date.now() - t}ms)`,
 );
}
async function handleAutocomplete(int) {
 const opt = int.options.getFocused(true);
 const q = opt.value.toLowerCase();
 // Discord caps choice names/values at 100 chars, so longer paths are skipped
 const lst = (opt.name === "folder" ? cache.dirs : cache.files)
  .filter((p) => p.length <= 100 && p.toLowerCase().includes(q))
  .slice(0, 25);
 try {
  await int.respond(lst.map((p) => ({ name: p, value: p })));
 } catch (e) {
  console.error("Autocomplete error:", e.message);
 }
}
async function handleCommands(int) {
 const { commandName, options } = int;
 if (commandName === "play") {
  const fn = options.getString("filename");
  const vc = int.member.voice.channel;
  if (!vc) {
   return int.reply({
    content: "You need to be in a voice channel to play audio!",
    ephemeral: true,
   });
  }
  try {
   await int.deferReply({ ephemeral: true });
   const fp = inLibrary(fn);
   if (!fp || !fs.existsSync(fp) || !fs.statSync(fp).isFile()) {
    return int.followUp({
     content: "The specified audio file does not exist.",
     ephemeral: true,
    });
   }
   st.queue.push({ path: fp, requester: int.user });
   int.followUp({
    content: `Added "${pth.basename(fp)}" to the queue.`,
    ephemeral: true,
   });
   if (!st.isPlaying) {
    nxt(vc, int);
   }
  } catch (e) {
   console.error("Error in play command:", e);
   int.followUp({
    content:
     "An error occurred while processing your request. Please try again later.",
    ephemeral: true,
   });
  }
 } else if (commandName === "playall") {
  const folder = options.getString("folder") || "";
  const shuffle = options.getBoolean("shuffle") || false;
  const loop = options.getBoolean("loop") || false;
  const label = folder || "the library";
  const vc = int.member.voice.channel;

  if (!vc) {
   return int.reply({
    content: "You need to be in a voice channel to play audio!",
    ephemeral: true,
   });
  }

  try {
   await int.deferReply({ ephemeral: true });
   const dir = inLibrary(folder);

   if (!dir || !fs.existsSync(dir)) {
    return int.followUp({
     content: `The folder "${folder}" does not exist.`,
     ephemeral: true,
    });
   }

   const audioFiles = listLibrary(false, pth.relative(a_f, dir)).map((f) =>
    pth.join(a_f, f),
   );

   if (audioFiles.length === 0) {
    return int.followUp({
     content: `No audio files found in ${label}.`,
     ephemeral: true,
    });
   }

   if (shuffle) {
    for (let i = audioFiles.length - 1; i > 0; i--) {
     const j = Math.floor(Math.random() * (i + 1));
     [audioFiles[i], audioFiles[j]] = [audioFiles[j], audioFiles[i]];
    }
   }

   st.loopMode = loop;
   st.loopFiles = loop ? [...audioFiles] : [];

   for (const file of audioFiles) {
    st.queue.push({ path: file, requester: int.user });
   }

   int.followUp({
    content: `Added ${audioFiles.length} songs from ${label} to the queue${
     shuffle ? " (shuffled)" : ""
    }${loop ? " (looping enabled)" : ""}.`,
    ephemeral: true,
   });

   if (!st.isPlaying) {
    nxt(vc, int);
   }
  } catch (e) {
   console.error("Error in playall command:", e);
   int.followUp({
    content:
     "An error occurred while processing your request. Please try again later.",
    ephemeral: true,
   });
  }
 } else if (commandName === "upload") {
  const f = options.getAttachment("file");
  const folder = options.getString("folder") || "";
  if (!f) {
   return int.reply({
    content: "Please provide an audio file to upload.",
    ephemeral: true,
   });
  }
  if (!f.contentType || !f.contentType.startsWith("audio/")) {
   return int.reply({
    content: "The uploaded file is not an audio file.",
    ephemeral: true,
   });
  }
  const dir = inLibrary(folder);
  if (!dir) {
   return int.reply({
    content: "That folder is outside the music library.",
    ephemeral: true,
   });
  }
  await int.deferReply({ ephemeral: true });
  const fn = `${Date.now()}_${pth.basename(f.name)}`;
  const fp = pth.join(dir, fn);
  fs.mkdirSync(dir, { recursive: true });
  web
   .get(f.url, (res) => {
    const ws = fs.createWriteStream(fp);
    res.pipe(ws);

    ws.on("finish", () => {
     ws.close();
     refreshLibrary();
     int.followUp({
      content: `File "${fn}" has been uploaded successfully to ${folder || "the library"}!`,
      ephemeral: true,
     });
    });
   })
   .on("error", (e) => {
    console.error("Error downloading file:", e);
    int.followUp({
     content: "An error occurred while uploading the file.",
     ephemeral: true,
    });
   });
 } else if (commandName === "pause") {
  if (!st.player) {
   return int.reply({
    content: "There is no audio playing.",
    ephemeral: true,
   });
  }
  st.player.pause();
  int.reply({
   content: "Paused the current audio.",
   ephemeral: true,
  });
 } else if (commandName === "resume") {
  if (!st.player) {
   return int.reply({
    content: "There is no audio playing.",
    ephemeral: true,
   });
  }
  st.player.unpause();
  int.reply({
   content: "Resumed the current audio.",
   ephemeral: true,
  });
 } else if (commandName === "stop") {
  if (!st.player && st.queue.length === 0) {
    return int.reply({
      content: "There is no audio playing or in the queue.",
      ephemeral: true,
    });
  }
  if (st.player) {
    st.player.stop();
  }
  st.queue.length = 0;
  st.loopMode = false;
  st.loopFiles = [];
  int.client.user.setPresence({
    activities: [
      { name: "Nothing is currently playing", type: djs.ActivityType.Listening },
    ],
  });
  int.reply({
    content: "Stopped the current audio and cleared the queue.",
    ephemeral: true,
  });
 } else if (commandName === "skip") {
  if (!st.player) {
   return int.reply({
    content: "There is no audio playing.",
    ephemeral: true,
   });
  }
  st.player.stop();
  int.reply({
   content: "Skipped the current audio.",
   ephemeral: true,
  });
 } else if (commandName === "clearqueue") {
  if (st.queue.length === 0) {
   return int.reply({
    content: "The queue is already empty.",
    ephemeral: true,
   });
  }
  st.queue.length = 0;
  int.reply({ content: "Cleared the queue.", ephemeral: true });
 }
}
module.exports = {
 commands: cmd,
 handleCommands,
 handleAutocomplete,
 refreshLibrary,
 AUDIO_FOLDER: a_f,
 listLibrary,
 inLibrary,
};
