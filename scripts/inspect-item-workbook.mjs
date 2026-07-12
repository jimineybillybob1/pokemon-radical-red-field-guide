import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';
import fs from 'node:fs/promises';

const path = 'C:/Users/james/Downloads/Item, TM, and Move Tutor Locations v4.1 - Radical Red.xlsx';
const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(path));
const names = ['TMs & HMs', 'Overworld Items', 'Mega Stones', 'Z-Crystals', 'Shops', 'Care Packages', 'Other Useful Items'];
const output = {};
for (const name of names) output[name] = workbook.worksheets.getItem(name).getUsedRange().values;
await fs.writeFile('work/item-workbook-raw.json', JSON.stringify(output));
console.log(names.map((name) => `${name}: ${output[name].length} rows`).join('\n'));
