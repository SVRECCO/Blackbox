const v = require("@discordjs/voice");
const djs = require("discord.js");
const pth = require("path");
const { addDJRole: add_dj, removeDJRole: rm_dj } = require("./utils");
const st = {
 player: null,
 isPlaying: false,
 queue: [],
};
async function nxt(vc, int) {
 if (st.queue.length > 0) {
  st.isPlaying = true;
  const trk = st.queue.shift();
  await ply(vc, trk.path, int, trk.requester, trk.genre);
 } else {
  st.isPlaying = false;
  int.client.user.setActivity(null);
  rm_dj(int.guild);
 }
}
async function ply(vc, fp, int) {
 const con = v.joinVoiceChannel({
  channelId: vc.id,
  guildId: vc.guild.id,
  adapterCreator: vc.guild.voiceAdapterCreator,
 });
 try {
  await v.entersState(con, v.VoiceConnectionStatus.Ready, 30_000);
 } catch (e) {
  await con.destroy();
  return int.followUp("Failed to join voice channel!");
 }
 con.on(v.VoiceConnectionStatus.Disconnected, async () => {
  try {
   await Promise.race([
    v.entersState(con, v.VoiceConnectionStatus.Signalling, 5_000),
    v.entersState(con, v.VoiceConnectionStatus.Connecting, 5_000),
   ]);
  } catch (e) {
   con.destroy();
  }
 });
 st.player = v.createAudioPlayer();
 try {
  const res = v.createAudioResource(fp);
  st.player.play(res);
  const sub = con.subscribe(st.player);
  if (!sub) {
   return int.followUp("Failed to play audio due to subscription error.");
  }
  st.player.on(v.AudioPlayerStatus.Playing, () => {
   st.isPlaying = true;
   const fn = pth.basename(fp);
   int.client.user.setPresence({
    activities: [
     {
      name: fn,
      type: djs.ActivityType.Listening,
     },
    ],
   });
   add_dj(int.guild);
  });
  st.player.on(v.AudioPlayerStatus.Idle, () => {
   st.isPlaying = false;
   int.client.user.setActivity(null);
   con.destroy();
   nxt(vc, int);
  });
  st.player.on("error", (e) => {
   console.error("Player error:", e);
   st.isPlaying = false;
   int.client.user.setActivity(null);
   con.destroy();
  });
 } catch (e) {
  console.error("Play error:", e);
  int.followUp("An error occurred while playing the audio.");
  con.destroy();
 }
}
module.exports = {
 state: st,
 playNext: nxt,
 playAudio: ply,
};
