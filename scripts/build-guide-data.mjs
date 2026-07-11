import fs from "node:fs";
import vm from "node:vm";

const raw = fs.readFileSync("work/radical-red-dex-data.js", "utf8");
const source = vm.runInNewContext(`(${raw})`);
const values = value => Array.isArray(value) ? value : Object.values(value || {});
const byId = value => new Map(values(value).map(item => [item.ID, item]));
const types = byId(source.types);
const abilities = byId(source.abilities);

const pokemon = values(source.species).map(entry => {
  const sprite = source.sprites?.[entry.ID] || source.sprites?.[entry.ID - 1] || "";
  const abilityList = (entry.abilities || []).map(slot => {
    if (typeof slot === "string") return { name: slot, description: "" };
    const id = Array.isArray(slot) ? slot[0] : slot;
    const ability = abilities.get(id);
    return ability ? { name: ability.names?.[0] || `Ability ${id}`, description: ability.description || "" } : null;
  }).filter(Boolean);
  return {
    id: entry.ID,
    dexId: entry.dexID || entry.ID,
    key: entry.key || entry.name,
    name: entry.name,
    types: (entry.type || []).map(id => types.get(id)?.name || "Unknown"),
    typeColours: (entry.type || []).map(id => types.get(id)?.color || "#64748b"),
    stats: entry.stats || [],
    bst: (entry.stats || []).reduce((sum, stat) => sum + stat, 0),
    abilities: abilityList,
    sprite,
  };
});

const locations = JSON.parse(fs.readFileSync("work/grass-cave-locations.json", "utf8"));
const output = { meta: { version: "4.1", source: "https://dex.radicalred.net/" }, pokemon, locations };
fs.mkdirSync("data", { recursive: true });
fs.writeFileSync("data/guide-data.json", JSON.stringify(output));
fs.writeFileSync("data/guide-data.js", `window.GUIDE_DATA=${JSON.stringify(output)};`);
console.log(`Built ${pokemon.length} forms and ${locations.length} day/night locations`);
