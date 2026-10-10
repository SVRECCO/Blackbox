// Uses DJ_ROLE_ID if set, otherwise any role named "DJ".
function findDJRole(g) {
 const id = process.env.DJ_ROLE_ID;
 const r = id
  ? g.roles.cache.get(id)
  : g.roles.cache.find((x) => x.name.toLowerCase() === "dj");
 if (!r) {
  console.warn(
   id
    ? `DJ role: no role with ID ${id} in ${g.name}. Check DJ_ROLE_ID in .env.`
    : `DJ role: no role named "DJ" in ${g.name}. Create one or set DJ_ROLE_ID in .env.`,
  );
  return null;
 }
 // editable = bot has Manage Roles AND its own highest role sits above this one
 if (!r.editable) {
  console.warn(
   `DJ role: can't manage "${r.name}". Give the bot Manage Roles and drag its role above "${r.name}" in Server Settings > Roles.`,
  );
  return null;
 }
 return r;
}
async function setDJRole(g, on) {
 const r = findDJRole(g);
 if (!r) return;
 try {
  if (on) await g.members.me.roles.add(r);
  else await g.members.me.roles.remove(r);
 } catch (e) {
  console.error(`Error ${on ? "adding" : "removing"} DJ role:`, e.message);
 }
}
module.exports = {
 addDJRole: (g) => setDJRole(g, true),
 removeDJRole: (g) => setDJRole(g, false),
};
