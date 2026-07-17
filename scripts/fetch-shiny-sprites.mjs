import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = new URL('../', import.meta.url);
const guide = JSON.parse(fs.readFileSync(new URL('data/guide-data.json', ROOT), 'utf8'));
const outputDir = new URL('assets/pokemon-shiny/', ROOT);
const manifestPath = new URL('data/shiny-sprites.json', ROOT);
const auditOnly = process.argv.includes('--audit');
const API_URL = 'https://pokeapi.co/api/v2/pokemon?limit=2000';
const FORM_API_URL = 'https://pokeapi.co/api/v2/pokemon-form?limit=3000';
const RAW_ROOT = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny';

if (auditOnly && fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const entries = Object.values(manifest.sprites || {});
  const missingFiles = entries.filter(entry => !fs.existsSync(new URL(entry.path, ROOT)));
  console.log(`Manifest contains ${entries.length}/${guide.pokemon.length} shiny sprites (${manifest.unmatched?.length || 0} intentionally unmatched forms)`);
  console.log(`Missing local files: ${missingFiles.length}`);
  process.exit(missingFiles.length ? 1 : 0);
}

const explicitAliases = {
  deoxysattack: 'deoxys-attack',
  deoxysdefense: 'deoxys-defense',
  deoxysspeed: 'deoxys-speed',
  giratinaorigin: 'giratina-origin',
  shayminsky: 'shaymin-sky',
  tornadusincarnate: 'tornadus-incarnate',
  tornadustherian: 'tornadus-therian',
  thundurusincarnate: 'thundurus-incarnate',
  thundurustherian: 'thundurus-therian',
  landorusincarnate: 'landorus-incarnate',
  landorustherian: 'landorus-therian',
  basculinblue: 'basculin-blue-striped',
  basculinwhite: 'basculin-white-striped',
  darmanitanzen: 'darmanitan-zen',
  darmanitangalar: 'darmanitan-galar-standard',
  darmanitangalarzen: 'darmanitan-galar-zen',
  meloettapirouette: 'meloetta-pirouette',
  aegislashblade: 'aegislash-blade',
  pumpkaboosmall: 'pumpkaboo-small',
  pumpkaboolarge: 'pumpkaboo-large',
  pumpkaboosuper: 'pumpkaboo-super',
  gourgeistsmall: 'gourgeist-small',
  gourgeistlarge: 'gourgeist-large',
  gourgeistsuper: 'gourgeist-super',
  zygarde10: 'zygarde-10',
  zygardecomplete: 'zygarde-complete',
  wishiwashischool: 'wishiwashi-school',
  miniorcore: 'minior-red-meteor',
  mimikyubusted: 'mimikyu-busted',
  toxtricitylowkey: 'toxtricity-low-key',
  eiscueiceface: 'eiscue-ice',
  eiscueniceface: 'eiscue-noice',
  indeedeefemale: 'indeedee-female',
  morpekohangry: 'morpeko-hangry',
  zaciancomplete: 'zacian-crowned',
  zamazentacomplete: 'zamazenta-crowned',
  eternatuseternamax: 'eternatus-eternamax',
  urshifusingle: 'urshifu-single-strike',
  urshifurapid: 'urshifu-rapid-strike',
  calyrexice: 'calyrex-ice',
  calyrexshadow: 'calyrex-shadow',
  ursalunabloodmoon: 'ursaluna-bloodmoon',
  mausholdfour: 'maushold-family-of-four',
  squawkabillygreen: 'squawkabilly-green-plumage',
  squawkabillyblue: 'squawkabilly-blue-plumage',
  squawkabillyyellow: 'squawkabilly-yellow-plumage',
  squawkabillywhite: 'squawkabilly-white-plumage',
  palafinhero: 'palafin-hero',
  tatsugiridroopy: 'tatsugiri-droopy',
  tatsugiristretchy: 'tatsugiri-stretchy',
  dudunsparcethreesegment: 'dudunsparce-three-segment',
  gimmighoulroaming: 'gimmighoul-roaming',
  ogerponwellspring: 'ogerpon-wellspring-mask',
  ogerponhearthflame: 'ogerpon-hearthflame-mask',
  ogerponcornerstone: 'ogerpon-cornerstone-mask',
  terapagosstellar: 'terapagos-stellar',
  oricoriopau: 'oricorio-pau',
  necrozmaduskmane: 'necrozma-dusk',
  necrozmadawnwings: 'necrozma-dawn',
  dialgaprimal: 'dialga-origin',
  farfetchdgalar: 'farfetchd-galar',
  taurospaldeacombat: 'tauros-paldea-combat-breed',
  taurospaldeaaqua: 'tauros-paldea-aqua-breed',
  taurospaldeablaze: 'tauros-paldea-blaze-breed',
  butterfreemega: 'butterfree-gmax',
  machampmega: 'machamp-gmax',
  kinglermega: 'kingler-gmax',
  laprasmega: 'lapras-gmax',
  snorlaxmega: 'snorlax-gmax',
  garbodormega: 'garbodor-gmax',
  orbeetlemega: 'orbeetle-gmax',
  drednawmega: 'drednaw-gmax',
  coalossalmega: 'coalossal-gmax',
  flapplemega: 'flapple-gmax',
  appletunmega: 'appletun-gmax',
  sandacondamega: 'sandaconda-gmax',
  toxtricitymega: 'toxtricity-amped-gmax',
  centiskorchmega: 'centiskorch-gmax',
  alcremiemega: 'alcremie-gmax',
  copperajahmega: 'copperajah-gmax',
  pikachuoriginal: 'pikachu-original-cap',
  pikachuhoenn: 'pikachu-hoenn-cap',
  pikachusinnoh: 'pikachu-sinnoh-cap',
  pikachuunova: 'pikachu-unova-cap',
  pikachukalos: 'pikachu-kalos-cap',
  pikachualola: 'pikachu-alola-cap',
  pikachupartner: 'pikachu-partner-cap',
  pikachuphd: 'pikachu-phd',
};

const explicitIdAliases = {
  704: 'frillish-female',
  705: 'jellicent-female',
  831: 'pyroar-female',
  832: 'meowstic-female',
  849: 'oinkologne-female',
  853: 'pumpkaboo-small',
  854: 'pumpkaboo-large',
  855: 'pumpkaboo-super',
  856: 'gourgeist-small',
  857: 'gourgeist-large',
  858: 'gourgeist-super',
  1065: 'minior-red',
  1066: 'minior-orange',
  1067: 'minior-yellow',
  1068: 'minior-green',
  1069: 'minior-blue',
  1070: 'minior-indigo',
  1071: 'minior-violet',
  1202: 'indeedee-female',
  1306: 'basculegion-female',
};

const explicitIdSpriteUrls = {
  704: `${RAW_ROOT}/female/592.png`,
  705: `${RAW_ROOT}/female/593.png`,
  831: `${RAW_ROOT}/female/668.png`,
};

function compact(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function slug(value) {
  return String(value || '')
    .replace(/♀/g, '-f')
    .replace(/♂/g, '-m')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function expandedCandidates(value) {
  const direct = slug(value);
  const candidates = [direct];
  const suffixes = [
    [/-a$/, '-alola'],
    [/-g$/, '-galar'],
    [/-h$/, '-hisui'],
    [/-p$/, '-paldea'],
    [/-i$/, '-incarnate'],
    [/-t$/, '-therian'],
    [/-o$/, '-origin'],
    [/-s$/, '-sky'],
  ];
  suffixes.forEach(([pattern, replacement]) => {
    if (pattern.test(direct)) candidates.push(direct.replace(pattern, replacement));
  });
  return candidates;
}

const [response, formResponse] = await Promise.all([
  fetch(API_URL, { headers: { 'User-Agent': 'Radical-Red-Field-Guide' } }),
  fetch(FORM_API_URL, { headers: { 'User-Agent': 'Radical-Red-Field-Guide' } }),
]);
if (!response.ok) throw new Error(`PokeAPI list failed: ${response.status}`);
if (!formResponse.ok) throw new Error(`PokeAPI form list failed: ${formResponse.status}`);
const [listing, formListing] = await Promise.all([response.json(), formResponse.json()]);
const apiEntries = listing.results.map(entry => ({
  name: entry.name,
  id: Number(entry.url.match(/\/(\d+)\/$/)?.[1]),
  kind: 'pokemon',
})).filter(entry => Number.isFinite(entry.id));
const byName = new Map(apiEntries.map(entry => [entry.name, entry]));
const byId = new Map(apiEntries.map(entry => [entry.id, entry]));
const formByName = new Map(formListing.results.map(entry => [entry.name, { name: entry.name, apiUrl: entry.url, kind: 'form' }]));
const firstByDex = new Map();
guide.pokemon.forEach(pokemon => {
  const key = String(pokemon.dexId);
  if (!firstByDex.has(key)) firstByDex.set(key, pokemon.id);
});

function resolveEntry(pokemon) {
  const idAlias = explicitIdAliases[pokemon.id];
  const keyMatchesName = compact(pokemon.key) === compact(pokemon.name);
  const alias = explicitAliases[compact(pokemon.key)] || (keyMatchesName ? explicitAliases[compact(pokemon.name)] : null);
  const candidates = [idAlias, alias, ...expandedCandidates(pokemon.key), ...(keyMatchesName ? expandedCandidates(pokemon.name) : [])].filter(Boolean);
  for (const candidate of candidates) {
    if (byName.has(candidate)) return byName.get(candidate);
    if (formByName.has(candidate)) return formByName.get(candidate);
  }
  if (firstByDex.get(String(pokemon.dexId)) === pokemon.id) {
    const base = byId.get(Number(pokemon.dexId));
    if (base) return base;
  }
  return null;
}

const resolved = guide.pokemon.map(pokemon => ({ pokemon, entry: resolveEntry(pokemon) }));
const unmatched = resolved.filter(item => !item.entry).map(item => ({
  id: item.pokemon.id,
  dexId: item.pokemon.dexId,
  key: item.pokemon.key,
  name: item.pokemon.name,
}));

if (auditOnly) {
  console.log(`Matched ${resolved.length - unmatched.length}/${resolved.length} guide forms to PokeAPI sprite IDs`);
  console.log(JSON.stringify(unmatched, null, 2));
  process.exit(0);
}

fs.mkdirSync(outputDir, { recursive: true });
const manifest = {
  meta: {
    source: 'https://github.com/PokeAPI/sprites',
    sourcePath: 'sprites/pokemon/shiny',
    generatedAt: new Date().toISOString(),
  },
  sprites: {},
  unmatched,
};

let cursor = 0;
let downloaded = 0;
let unavailable = 0;
async function worker() {
  while (cursor < resolved.length) {
    const current = resolved[cursor++];
    if (!current.entry) continue;
    let url = explicitIdSpriteUrls[current.pokemon.id] || (current.entry.kind === 'pokemon' ? `${RAW_ROOT}/${current.entry.id}.png` : '');
    if (!url && current.entry.kind === 'form') {
      const formResponse = await fetch(current.entry.apiUrl, { headers: { 'User-Agent': 'Radical-Red-Field-Guide' } });
      if (formResponse.ok) url = (await formResponse.json()).sprites?.front_shiny || '';
    }
    if (!url) {
      unavailable++;
      manifest.unmatched.push({
        id: current.pokemon.id,
        dexId: current.pokemon.dexId,
        key: current.pokemon.key,
        name: current.pokemon.name,
        pokeapiName: current.entry.name,
        reason: 'PokeAPI form has no front shiny sprite',
      });
      continue;
    }
    const result = await fetch(url, { headers: { 'User-Agent': 'Radical-Red-Field-Guide' } });
    if (!result.ok) {
      unavailable++;
      manifest.unmatched.push({
        id: current.pokemon.id,
        dexId: current.pokemon.dexId,
        key: current.pokemon.key,
        name: current.pokemon.name,
        pokeapiId: current.entry.id || null,
        pokeapiName: current.entry.name,
        reason: `Sprite returned ${result.status}`,
      });
      continue;
    }
    const filename = `${current.pokemon.id}.png`;
    fs.writeFileSync(new URL(`assets/pokemon-shiny/${filename}`, ROOT), Buffer.from(await result.arrayBuffer()));
    manifest.sprites[current.pokemon.id] = {
      path: `assets/pokemon-shiny/${filename}`,
      pokeapiId: current.entry.id || null,
      pokeapiName: current.entry.name,
      source: url,
    };
    downloaded++;
  }
}

await Promise.all(Array.from({ length: 12 }, worker));
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log(`Downloaded ${downloaded}/${resolved.length} shiny sprites (${unmatched.length} unmatched IDs, ${unavailable} unavailable files)`);
console.log(`Manifest: ${path.relative(process.cwd(), fileURLToPath(manifestPath))}`);
