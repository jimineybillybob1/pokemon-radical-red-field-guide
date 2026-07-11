# Radical Red Field Guide

**Live guide:** https://jimineybillybob1.github.io/pokemon-radical-red-field-guide/

An offline-friendly Pokédex and encounter companion for Pokémon Radical Red v4.1. The initial build includes the complete Radical Red Dex dataset, form switching, detailed stats and abilities, persistent caught tracking, and day/night grass and cave locations.

## Preview

```powershell
python -m http.server 8877 --bind 127.0.0.1
```

Then open `http://127.0.0.1:8877/`.

## Rebuild data

The Dex source is `work/radical-red-dex-data.js`. The location extractor reads the official/community v4.1 workbook from Downloads.

```powershell
python scripts\extract_locations.py
node scripts\build-guide-data.mjs
```

## Sources

- https://dex.radicalred.net/
- https://radicalred.miraheze.org/wiki/Main_Page
- Pokémon Locations & Raid Dens v4.1 - Radical Red.xlsx
