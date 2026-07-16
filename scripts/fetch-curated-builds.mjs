import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const ROOT = new URL('../', import.meta.url);
const SOURCE = 'https://movesets.radicalred.net';
const MAX_ID = 195;

function decode(value = '') {
  return value
    .replace(/<!--.*?-->/gs, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:#x([0-9a-f]+)|#(\d+)|amp|quot|apos|lt|gt|nbsp);/gi, (match, hex, dec) => {
      if (hex) return String.fromCodePoint(parseInt(hex, 16));
      if (dec) return String.fromCodePoint(parseInt(dec, 10));
      return ({ '&amp;': '&', '&quot;': '"', '&apos;': "'", '&lt;': '<', '&gt;': '>', '&nbsp;': ' ' })[match.toLowerCase()] || match;
    })
    .replace(/\s+/g, ' ')
    .trim();
}

function capture(html, pattern) {
  return decode(html.match(pattern)?.[1] || '');
}

function modeFor(evs, description) {
  const text = `${evs} ${description}`.toLowerCase();
  if (/doesn.?t work.*(?:hardcore|\bhc\b)|only works? in (?:easy|normal)/.test(text)) return 'Normal / Easy only';
  if (/\bhardcore\b|\bhc\b/.test(text)) return 'Hardcore';
  if (/\bmgm\b|minimal grinding/.test(text)) return 'Minimal Grinding';
  return 'General / check mode';
}

function parsePage(id, html) {
  const pokemon = capture(html, /<h1[^>]*class="rt-Heading py-1[^>]*>(.*?)<\/h1>/s);
  if (!pokemon) return [];
  const marker = '<div class="rt-reset rt-Card px-3 pt-2 mb-8';
  return html.split(marker).slice(1).map((card, setIndex) => {
    const setName = capture(card, /<span class="rt-Text rt-r-size-7 rt-r-weight-bold">(.*?)<\/span>/s);
    const author = capture(card, /<i>- By<\/i>\s*(.*?)<\/span>/s);
    const moves = Array.from({ length: 4 }, (_, index) => {
      const pattern = new RegExp(`Move\\s*(?:<!--.*?-->)?${index + 1}(?:<!--.*?-->)?\\s*:<\\/span>.*?text-rose-300[^>]*>(.*?)<\\/span>`, 's');
      const raw = capture(card, pattern);
      return raw ? raw.split(/\s*\/\s*/).map(option => option.trim()).filter(Boolean) : [];
    });
    const item = capture(card, /<div class="w-16">Item:<\/div>.*?text-rose-300[^>]*>(.*?)<\/span>/s);
    const ability = capture(card, /<div class="w-16">Ability:<\/div>.*?text-rose-300[^>]*>(.*?)<\/span>/s);
    const nature = capture(card, /<div class="w-16">Nature:<\/div>.*?rt-HoverCardTrigger[^>]*>(.*?)<\/span>/s);
    const evs = capture(card, /<div class="w-16">EVs:<\/div><div class="pl-3">(.*?)<\/div>/s);
    const description = capture(card, />Description<\/h1><span[^>]*>(.*?)<\/span>/s);
    if (!setName || !moves.some(slot => slot.length)) return null;
    return { id: `${id}-${setIndex + 1}`, sourceId: id, pokemon, setName, author, moves, item, ability, nature, evs, mode: modeFor(evs, description), url: `${SOURCE}/${id}/` };
  }).filter(Boolean);
}

async function fetchPage(id) {
  const response = await fetch(`${SOURCE}/${id}/`);
  if (!response.ok) throw new Error(`${id}: HTTP ${response.status}`);
  return parsePage(id, await response.text());
}

async function main() {
  const ids = Array.from({ length: MAX_ID }, (_, index) => index + 1);
  const builds = [];
  for (let start = 0; start < ids.length; start += 8) {
    const batch = await Promise.all(ids.slice(start, start + 8).map(fetchPage));
    builds.push(...batch.flat());
  }
  builds.sort((a, b) => a.pokemon.localeCompare(b.pokemon) || a.sourceId - b.sourceId || a.id.localeCompare(b.id));
  const data = { meta: { source: SOURCE, fetchedAt: new Date().toISOString(), pageCount: MAX_ID, buildCount: builds.length }, builds };
  const jsonPath = fileURLToPath(new URL('data/curated-builds.json', ROOT));
  const jsPath = fileURLToPath(new URL('data/curated-builds.js', ROOT));
  await fs.writeFile(jsonPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  await fs.writeFile(jsPath, `window.CURATED_BUILD_DATA=${JSON.stringify(data)};\n`, 'utf8');
  console.log(`Wrote ${builds.length} builds from ${MAX_ID} pages.`);
}

await main();
