# ZoneBench

The item editor and community add-on library for **Squared Away**, for S.T.A.L.K.E.R. Anomaly and G.A.M.M.A.

**[Open ZoneBench](https://fomok.github.io/zonebench/)** · [Preview](https://fomok.github.io/zonebench-preview/)

Create rigs, containers, pouches and backpacks through a guided builder, or edit existing items in the focused editor. Browse community add-ons, inspect their contents and download independent ZIPs for MO2. Crafting, repair and dismantling use GAMMA Database names and icons.

Targets **Squared Away 2.0.4**, using the existing **2.0.3 engines**. Existing 2.0.x saves can continue; first-time installations and pre-2.0 upgrades require a new game. Independent add-ons install below Squared Away and can be combined. Older full-project exports replace shared files.

## Projects and accounts

Editing runs in your browser. Save project keeps a portable backup. Existing live browser projects are retained. Appwrite handles accounts and public add-ons. The preview keeps separate projects and read-only community access.

## Development

Svelte 5, Vite and JavaScript. Node.js 22 or newer.

```sh
npm ci
npm run dev
npm run check
npm test
npm run build
```

Builds default to the preview. Set `ZONEBENCH_TARGET=live` for the production build. GitHub Actions selects the correct target for each repository. Live publishes from main; the preview repository remains separate.

See [installation](docs/installation.md) and [editor update notices](tools/EDITOR-UPDATES.md).
