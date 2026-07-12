import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const source = vm.runInNewContext(`(${fs.readFileSync('work/radical-red-dex-data.js', 'utf8')})`);
const workbook = JSON.parse(fs.readFileSync('work/item-workbook-raw.json', 'utf8'));
const values = (value) => Array.isArray(value) ? value : Object.values(value || {});
const rawItems = values(source.items).filter((item) => item?.name && !/^Free Space|^\?+$|^Unused/i.test(item.name));
const sourceTypes = new Map(values(source.types).map((type) => [type.ID, type.name]));
const sourceMoves = new Map(values(source.moves).map((move) => [move.ID, move]));
const norm = (value) => String(value || '').toLowerCase().replace(/pok[eé]mon/g, 'pokemon').replace(/[^a-z0-9]/g, '');
const assetRoot = 'C:/Users/james/Documents/Pokemon Unbound Guide/assets/items';
const outputRoot = 'assets/item-dex';
fs.mkdirSync(outputRoot, { recursive: true });

const spriteFiles = [];
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.png$/i.test(entry.name)) spriteFiles.push(full);
  }
}
walk(assetRoot);
const spriteLookup = new Map();
for (const file of spriteFiles) {
  const key = norm(path.basename(file, '.png'));
  if (!spriteLookup.has(key)) spriteLookup.set(key, []);
  spriteLookup.get(key).push(file);
}

const byNorm = new Map(rawItems.map((item) => [norm(item.name), item]));
const records = new Map(rawItems.map((item) => [item.ID, { ...item, locations: [], costs: [] }]));
const recordByNorm = new Map([...records.values()].map((item) => [norm(item.name), item]));
const tmItem = (number) => recordByNorm.get(norm(`TM${String(number).padStart(2, '0')}`));
const hmItem = (number) => recordByNorm.get(norm(`HM${String(number).padStart(2, '0')}`));

function resolveItem(label) {
  const cleaned = String(label || '')
    .replace(/\s*\[x\d+\]\s*/gi, '')
    .replace(/\s*\(Need[^)]*\)|\s*\(once\)/gi, '')
    .trim();
  const tm = cleaned.match(/^TM\s*0*(\d+)/i);
  if (tm) return tmItem(Number(tm[1]));
  const hm = cleaned.match(/^HM\s*0*(\d+)/i);
  if (hm) return hmItem(Number(hm[1]));
  const exact = recordByNorm.get(norm(cleaned));
  if (exact) return exact;
  if (/ium$/i.test(cleaned)) {
    const prefix = norm(cleaned).slice(0, 5);
    return [...records.values()].find((item) => norm(item.name).startsWith(prefix) && /iumz$/i.test(norm(item.name)));
  }
  return null;
}

function addLocation(item, location) {
  if (!item || !location) return;
  const cleaned = String(location).replace(/\s+/g, ' ').trim();
  if (cleaned && !item.locations.includes(cleaned)) item.locations.push(cleaned);
}

function addCost(item, location, rawCost) {
  if (!item || rawCost == null || rawCost === '') return;
  const text = String(rawCost).trim();
  const amount = Number(text.replace(/[^0-9]/g, ''));
  if (!amount) return;
  const currency = /BP/i.test(text) ? 'BP' : '₽';
  const display = currency === 'BP' ? `${amount} BP` : `₽${amount.toLocaleString('en-US')}`;
  if (!item.costs.some((cost) => cost.location === location && cost.display === display)) item.costs.push({ location, amount, currency, display });
}

// TM/HM location tables.
for (const row of workbook['TMs & HMs'] || []) {
  if (row[0] && /^\d+$/.test(String(row[0]))) {
    const item = tmItem(Number(row[0]));
    addLocation(item, row[4]);
    const price = String(row[4] || '').match(/\$([\d ]+)/);
    if (price) addCost(item, String(row[4]).split(' for ')[0], price[1]);
  }
  if (row[11] && /^\d+$/.test(String(row[11]))) addLocation(hmItem(Number(row[11])), row[15]);
}

// Overworld lists use a location heading in column B and item names in column D.
let currentLocation = '';
for (const row of workbook['Overworld Items'] || []) {
  if (row[1]) currentLocation = String(row[1]).trim();
  if (!row[3] || !currentLocation) continue;
  for (const part of String(row[3]).split(/\s*\/\s*/)) addLocation(resolveItem(part), currentLocation);
}

// Mega Stones are displayed as paired name/location blocks.
const megaRows = workbook['Mega Stones'] || [];
for (let rowIndex = 0; rowIndex < megaRows.length - 1; rowIndex += 1) {
  const row = megaRows[rowIndex], next = megaRows[rowIndex + 1] || [];
  for (const [nameColumn, locationColumn] of [[5, 4], [22, 21]]) addLocation(resolveItem(row[nameColumn]), next[locationColumn]);
}

// Z-Crystals.
for (const row of workbook['Z-Crystals'] || []) addLocation(resolveItem(row[3]), row[5]);

// Shops: headings are in column F, products in G and prices in AA.
let shop = '';
for (const row of workbook.Shops || []) {
  if (row[5]) shop = String(row[5]).trim();
  if (!row[6] || !shop) continue;
  const item = resolveItem(row[6]);
  addLocation(item, `${shop} shop`);
  addCost(item, shop, row[26]);
}

function chooseSprite(item) {
  const tm = item.name.match(/^TM(\d+)/i), hm = item.name.match(/^HM(\d+)/i);
  if (tm || hm) {
    const number = Number((tm || hm)[1]);
    const moveId = tm ? source.tmMoves?.[number - 1] : [15, 19, 57, 70, 148, 249, 127, 291][number - 1];
    const move = sourceMoves.get(moveId);
    const type = sourceTypes.get(move?.type)?.toLowerCase() || 'normal';
    const candidate = path.join(assetRoot, tm ? 'tm' : 'hm', `${type}.png`);
    if (fs.existsSync(candidate)) return candidate;
  }
  const matches = spriteLookup.get(norm(item.name)) || [];
  const priority = ['mega-stone', 'z-crystals', 'berry', 'ball', 'medicine', 'evo-item', 'key-item', 'hold-item', 'battle-item', 'valuable-item', 'other-item', 'custom'];
  return matches.sort((a, b) => priority.findIndex((part) => a.includes(part)) - priority.findIndex((part) => b.includes(part)))[0] || null;
}

function categoryFor(item, sprite) {
  if (/^TM|^HM/i.test(item.name)) return 'TM & HM';
  if (/Ball$/i.test(item.name) && /catch|wild Pokemon|Poke Ball/i.test(item.description)) return 'Poké Balls';
  const folder = sprite ? path.basename(path.dirname(sprite)) : '';
  const folders = {
    berry: 'Berries', ball: 'Poké Balls', medicine: 'Medicine', 'mega-stone': 'Mega Stones',
    'z-crystals': 'Z-Crystals', 'evo-item': 'Evolution', 'key-item': 'Key Items',
    'battle-item': 'Battle Items', 'valuable-item': 'Valuables', 'hold-item': 'Held Items',
    incense: 'Held Items', plate: 'Held Items', gem: 'Held Items', memory: 'Held Items',
  };
  if (folders[folder]) return folders[folder];
  if (/Berry$/i.test(item.name)) return 'Berries';
  if (/Mega Evolve/i.test(item.description)) return 'Mega Stones';
  if (/ium Z$/i.test(item.name)) return 'Z-Crystals';
  if (/evolve|evolution/i.test(item.description)) return 'Evolution';
  if (/held|holder|held by/i.test(item.description)) return 'Held Items';
  return 'Other';
}

const output = [];
for (const item of [...records.values()]) {
  const sourceSprite = chooseSprite(item);
  let sprite = '';
  if (sourceSprite) {
    const destination = path.join(outputRoot, `${item.ID}.png`);
    fs.copyFileSync(sourceSprite, destination);
    sprite = destination.replaceAll('\\', '/');
  }
  const tm = item.name.match(/^TM(\d+)/i), hm = item.name.match(/^HM(\d+)/i);
  const machine = tm || hm;
  const number = machine ? Number(machine[1]) : null;
  const moveId = tm ? source.tmMoves?.[number - 1] : hm ? [15, 19, 57, 70, 148, 249, 127, 291][number - 1] : null;
  const move = sourceMoves.get(moveId);
  output.push({
    id: item.ID,
    name: machine ? `${tm ? 'TM' : 'HM'} ${String(number).padStart(3, '0')}${move ? ` · ${move.name}` : ''}` : item.name,
    sourceName: item.name,
    description: item.description || 'No description available.',
    category: categoryFor(item, sourceSprite),
    sprite,
    locations: item.locations,
    costs: item.costs,
    move: move ? { id: move.ID, name: move.name, type: sourceTypes.get(move.type) || 'Normal' } : null,
  });
}

fs.writeFileSync('data/items-data.json', `${JSON.stringify(output)}\n`);
fs.writeFileSync('data/items-data.js', `window.ITEM_GUIDE_DATA=${JSON.stringify(output)};\n`);
const located = output.filter((item) => item.locations.length).length;
const priced = output.filter((item) => item.costs.length).length;
const sprites = output.filter((item) => item.sprite).length;
console.log(`Built ${output.length} items: ${located} located, ${priced} priced, ${sprites} sprites`);
