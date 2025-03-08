require("dotenv").config();
const djs = require("discord.js");
const fs = require("fs");
const pth = require("path");
const {
 handleCommands,
 GENRES: g_s,
 AUDIO_FOLDER: a_f,
} = require("./commands");
const bot = new djs.Client({
 intents: [
  djs.GatewayIntentBits.Guilds,
  djs.GatewayIntentBits.GuildMessages,
  djs.GatewayIntentBits.GuildVoiceStates,
  djs.GatewayIntentBits.MessageContent,
 ],
});
g_s.forEach((gen) => {
 const dir = pth.join(a_f, gen);
 if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
 }
});
bot.once("ready", async () => {
 console.log(`Bot is ready! Logged in as ${bot.user.tag}`);
 await bot.application.commands.set(require("./commands").commands);
});
bot.on("interactionCreate", async (int) => {
 if (int.isCommand()) {
  await handleCommands(int);
 } else if (int.isAutocomplete()) {
  if (int.commandName === "play") {
   const opt = int.options.getFocused(true);
   if (opt.name === "filename") {
    const gen = int.options.getString("genre");
    const val = opt.value;
    const dir = pth.join(a_f, gen);
    if (fs.existsSync(dir)) {
     const lst = fs
      .readdirSync(dir)
      .filter((f) => f.toLowerCase().includes(val.toLowerCase()))
      .slice(0, 25);
     await int.respond(lst.map((c) => ({ name: c, value: c })));
    } else {
     await int.respond([]);
    }
   }
  }
 }
});
bot.login(process.env.DISCORD_TOKEN);
