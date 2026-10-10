require("dotenv").config();
const djs = require("discord.js");
const fs = require("fs");
const {
 handleCommands,
 handleAutocomplete,
 refreshLibrary,
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
fs.mkdirSync(a_f, { recursive: true });
refreshLibrary();
setInterval(refreshLibrary, 5 * 60 * 1000);
bot.once("clientReady", async () => {
 console.log(`Bot is ready! Logged in as ${bot.user.tag}`);
 console.log(`Music library: ${a_f}`);
 await bot.application.commands.set(require("./commands").commands);
});
bot.on("interactionCreate", async (int) => {
 if (int.isCommand()) {
  await handleCommands(int);
 } else if (int.isAutocomplete()) {
  await handleAutocomplete(int);
 }
});
bot.login(process.env.DISCORD_TOKEN);
