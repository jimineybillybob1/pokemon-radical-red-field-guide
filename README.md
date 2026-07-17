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
- Normal and shiny Pokémon sprites: https://github.com/PokeAPI/sprites

Shiny sprites are stored locally for offline use. Run `node scripts/fetch-shiny-sprites.mjs` to refresh the sprite manifest and assets; the build script then attaches verified form-specific paths to the guide data. Radical Red-only forms without a trustworthy published shiny sprite remain explicitly unavailable instead of falling back to an incorrect form.

## Encrypted Save & Sync

Export/import works without configuration. Cross-device sync encrypts caught progress in the browser and sends only encrypted data to the same generic sync service used by the other field guides. Radical Red uses its own domain-separated storage IDs, so saves from different guides cannot collide. The private `XXXX-XXXX-XXXX` code is the recovery key; keep it private and safe. Cloud saves expire after 400 days without a new upload.

The GitHub Actions variable `RADICAL_RED_SYNC_ENDPOINT` supplies the service URL when Pages deploys. No additional Cloudflare setup is currently required. If the guide moves to a custom domain, that origin must be added to the Worker's `ALLOWED_ORIGINS` setting.
- Pokémon Locations & Raid Dens v4.1 - Radical Red.xlsx
