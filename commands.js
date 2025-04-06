const djs = require("discord.js");
const fs = require("fs");
const pth = require("path");
const web = require("https");
const { state: st, playNext: nxt } = require("./audioPlayer");
const g_s = [
 "pop",
 "rock",
 "alt rock",
 "heavy metal",
 "hip-hop",
 "rap",
 "classical",
 "electronic",
 "other",
];
const a_f = process.env.AUDIO_FOLDER || "./audio";
const cmd = [
 {
  name: "play",
  description: "Play a local audio file",
  options: [
   {
    name: "genre",
    description: "The genre of the song",
    type: djs.ApplicationCommandOptionType.String,
    required: true,
    choices: g_s.map((g) => ({ name: g, value: g })),
   },
   {
    name: "filename",
    description: "The name of the audio file to play",
    type: djs.ApplicationCommandOptionType.String,
    required: true,
    autocomplete: true,
   },
  ],
 },
 {
  name: "playall",
  description: "Play all audio files from a genre",
  options: [
   {
    name: "genre",
    description: "The genre to play all songs from",
    type: djs.ApplicationCommandOptionType.String,
    required: true,
    choices: g_s.map((g) => ({ name: g, value: g })),
   },
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
   {
    name: "genre",
    description: "The genre of the song",
    type: djs.ApplicationCommandOptionType.String,
    required: true,
    choices: g_s.map((g) => ({ name: g, value: g })),
   },
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
async function handleCommands(int) {
 const { commandName, options } = int;
 if (commandName === "play") {
  const gen = options.getString("genre");
  const fn = options.getString("filename");
  if (!fn) {
   return int.reply({
    content: "Please provide a filename to play!",
    ephemeral: true,
   });
  }
  const vc = int.member.voice.channel;
  if (!vc) {
   return int.reply({
    content: "You need to be in a voice channel to play audio!",
    ephemeral: true,
   });
  }
  try {
   await int.deferReply({ ephemeral: true });
   const fp = pth.join(a_f, gen, fn);
   if (!fs.existsSync(fp)) {
    return int.followUp({
     content: "The specified audio file does not exist.",
     ephemeral: true,
    });
   }
   st.queue.push({
    path: fp,
    requester: int.user,
    genre: gen,
   });
   int.followUp({
    content: `Added "${fn}" (${gen}) to the queue.`,
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
  const genre = options.getString("genre");
  const shuffle = options.getBoolean("shuffle") || false;
  const loop = options.getBoolean("loop") || false;
  const vc = int.member.voice.channel;

  if (!vc) {
   return int.reply({
    content: "You need to be in a voice channel to play audio!",
    ephemeral: true,
   });
  }

  try {
   await int.deferReply({ ephemeral: true });
   const genrePath = pth.join(a_f, genre);

   if (!fs.existsSync(genrePath)) {
    return int.followUp({
     content: `The genre folder "${genre}" does not exist.`,
     ephemeral: true,
    });
   }

   const files = fs.readdirSync(genrePath);
   const audioFiles = files.filter((file) => {
    const ext = pth.extname(file).toLowerCase();
    return [".mp3", ".wav", ".ogg", ".flac", ".m4a"].includes(ext);
   });

   if (audioFiles.length === 0) {
    return int.followUp({
     content: `No audio files found in the "${genre}" genre.`,
     ephemeral: true,
    });
   }

   if (shuffle) {
    for (let i = audioFiles.length - 1; i > 0; i--) {
     const j = Math.floor(Math.random() * (i + 1));
     [audioFiles[i], audioFiles[j]] = [audioFiles[j], audioFiles[i]];
    }
   }

   if (loop) {
    st.loopMode = true;
    st.loopGenre = genre;
    st.loopFiles = [...audioFiles];
   } else {
    st.loopMode = false;
    st.loopGenre = null;
    st.loopFiles = [];
   }

   for (const file of audioFiles) {
    st.queue.push({
     path: pth.join(genrePath, file),
     requester: int.user,
     genre: genre,
    });
   }

   int.followUp({
    content: `Added ${audioFiles.length} ${genre} songs to the queue${
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
  const gen = options.getString("genre");
  if (!f) {
   return int.reply({
    content: "Please provide an audio file to upload.",
    ephemeral: true,
   });
  }
  if (!f.contentType.startsWith("audio/")) {
   return int.reply({
    content: "The uploaded file is not an audio file.",
    ephemeral: true,
   });
  }
  await int.deferReply({ ephemeral: true });
  const fn = `${Date.now()}_${f.name}`;
  const fp = pth.join(a_f, gen, fn);
  const dir = pth.join(a_f, gen);
  if (!fs.existsSync(dir)) {
   fs.mkdirSync(dir, { recursive: true });
  }
  web
   .get(f.url, (res) => {
    const ws = fs.createWriteStream(fp);
    res.pipe(ws);

    ws.on("finish", () => {
     ws.close();
     int.followUp({
      content: `File "${fn}" has been uploaded successfully to the ${gen} genre!`,
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
  st.loopGenre = null;
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
 GENRES: g_s,
 AUDIO_FOLDER: a_f,
};
