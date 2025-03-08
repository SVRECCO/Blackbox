const djs = require("discord.js");
const dj_id = process.env.DJ_ROLE_ID || "1259544207488585759";
async function add_dj(g) {
 const r = g.roles.cache.get(dj_id);
 if (r) {
  const m = g.members.cache.get(g.client.user.id);
  if (
   m &&
   g.members.me.permissions.has(djs.PermissionsBitField.Flags.ManageRoles)
  ) {
   try {
    await m.roles.add(r);
   } catch (e) {
    console.error("Error adding DJ role:", e);
   }
  }
 }
}
async function rm_dj(g) {
 const r = g.roles.cache.get(dj_id);
 if (r) {
  const m = g.members.cache.get(g.client.user.id);
  if (
   m &&
   g.members.me.permissions.has(djs.PermissionsBitField.Flags.ManageRoles)
  ) {
   try {
    await m.roles.remove(r);
   } catch (e) {
    console.error("Error removing DJ role:", e);
   }
  }
 }
}
module.exports = {
 addDJRole: add_dj,
 removeDJRole: rm_dj,
};
