import fs from "node:fs";
import vm from "node:vm";

const raw = fs.readFileSync("work/radical-red-dex-data.js", "utf8");
const source = vm.runInNewContext(`(${raw})`);
const values = value => Array.isArray(value) ? value : Object.values(value || {});
const byId = value => new Map(values(value).map(item => [item.ID, item]));
const types = byId(source.types);
const abilities = byId(source.abilities);
const items = byId(source.items);
const moves = byId(source.moves);
const spriteDir = "assets/pokemon-dex";
fs.mkdirSync(spriteDir, { recursive: true });

function spriteAsset(value, id) {
  if (!value) return "";
  const match = String(value).match(/^data:image\/(png|webp|jpeg);base64,(.+)$/s);
  if (!match) return value;
  const extension = match[1] === "jpeg" ? "jpg" : match[1];
  const path = `${spriteDir}/${id}.${extension}`;
  fs.writeFileSync(path, Buffer.from(match[2], "base64"));
  return path;
}

function evolutionMethod(evo) {
  const [method, value, , extra] = evo;
  const item = items.get(value)?.name || `item ${value}`;
  const move = moves.get(value)?.name || `move ${value}`;
  const type = types.get(value)?.name || `type ${value}`;
  const partyType = types.get(extra)?.name || `type ${extra}`;
  const methods = {
    1: 'Level up with high friendship',
    2: 'Level up with high friendship during the day',
    3: 'Level up with high friendship at night',
    4: `Reach level ${value}`,
    7: `Use ${item}${value === 101 ? (extra === 254 ? ' (female)' : ' (male)') : ''}`,
    8: `Reach level ${value} with Attack higher than Defense`,
    9: `Reach level ${value} with Attack equal to Defense`,
    10: `Reach level ${value} with Attack lower than Defense`,
    11: `Reach level ${value} (50% branch)`,
    12: `Reach level ${value} (50% branch)`,
    13: `Reach level ${value}`,
    14: 'Evolve Nincada with an open party slot and a Poké Ball',
    16: `Reach level ${value} while it is raining`,
    17: `Level up with high friendship while knowing a ${type}-type move`,
    18: `Reach level ${value} with a ${partyType}-type Pokémon in the party`,
    20: `Reach level ${value} (male)`,
    21: `Reach level ${value} (female)`,
    22: `Reach level ${value} at night`,
    23: `Reach level ${value} during the day`,
    26: `Level up while knowing ${move}`,
    27: `Level up with ${source.species?.[value]?.name || `Pokémon ${value}`} in the party`,
    28: `Reach level ${value} ${extra === 1041 ? 'during the day' : extra === 5144 ? 'at night' : 'at dusk'}`,
    30: `Reach level ${value} with an energetic nature`,
    31: `Reach level ${value} with a composed nature`,
    254: extra === 2 ? `Know ${move}` : `Use ${item}`,
  };
  return methods[method] || `Special evolution method ${method}`;
}

const pokemon = values(source.species).map(entry => {
  const sprite = spriteAsset(source.sprites?.[entry.ID] || source.sprites?.[entry.ID - 1] || "", entry.ID);
  const abilityList = (entry.abilities || []).map(slot => {
    if (typeof slot === "string") return { name: slot, description: "" };
    const id = Array.isArray(slot) ? slot[0] : slot;
    const nameIndex = Array.isArray(slot) ? slot[1] || 0 : 0;
    const ability = abilities.get(id);
    return ability ? { name: ability.names?.[nameIndex] || ability.names?.[0] || `Ability ${id}`, description: ability.description || "" } : null;
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
    learnset: {
      level: (entry.levelupMoves || []).map(([moveId, level]) => ({ moveId, level })).filter(item => moves.has(item.moveId)),
      tm: (entry.tmMoves || []).map(index => source.tmMoves?.[index]).filter(moveId => moves.has(moveId)),
      tutor: (entry.tutorMoves || []).map(index => source.tutorMoves?.[index]).filter(moveId => moves.has(moveId)),
    },
    evolutions: (entry.evolutions || []).map(evo => ({ targetId: evo[2], method: evolutionMethod(evo) })),
    sprite,
  };
});

const moveData = values(source.moves).map(move => ({
  id: move.ID,
  name: move.name,
  type: types.get(move.type)?.name || 'Unknown',
  typeColour: types.get(move.type)?.color || '#64748b',
  category: source.splits?.[move.split] || 'Status',
  power: move.power || null,
  accuracy: move.accuracy || null,
  pp: move.pp || null,
  priority: move.priority || 0,
  description: move.description || '',
}));

const locations = JSON.parse(fs.readFileSync("work/grass-cave-locations.json", "utf8"));
const output = { meta: { version: "4.1", source: "https://dex.radicalred.net/" }, pokemon, moves: moveData, locations };
fs.mkdirSync("data", { recursive: true });
fs.writeFileSync("data/guide-data.json", JSON.stringify(output));
fs.writeFileSync("data/guide-data.js", `window.GUIDE_DATA=${JSON.stringify(output)};`);
console.log(`Built ${pokemon.length} forms, ${moveData.length} moves and ${locations.length} day/night locations`);
