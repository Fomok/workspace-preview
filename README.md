# ZoneBench

The browser workbench for **Squared Away**. Edit rigs, containers, expansion pouches and backpacks, then export an MO2-ready add-on.

**[Open ZoneBench](https://fomok.github.io/zonebench/)**

## What is included

- Pocket and compartment layout editing, item size, prices and weight.
- PNG inventory icons and automatic DDS atlas export.
- Crafting ingredients, repair components, disassembly parts and trader supplies.
- Drop and condition defaults, with saved in-game MCM settings taking precedence.
- Shared dropped rig/case models, or a custom installed model path.
- Browser autosave, portable JSON projects and selective item-pack imports.
- A curated public add-on catalog. Initially empty; no fabricated community packs.

Editing and ZIP generation happen in the browser. GitHub Pages hosts the site; the opt-in community preview uses Appwrite email-code accounts and public add-on publishing. No analytics or bug-report feature is included.

## Compatibility and installation

The bundled baseline is **Squared Away 3.49.2, native-grid Preview 40**, with its matching custom engine. The magazine mod supplies the three stock expansion pouches. GAMMA-specific recipes and trader integrations still need their respective mods.

1. Make changes and inspect **Check**.
2. Choose **Export mod** → **Write the files**.
3. Install the ZIP as a separate MO2 mod after Squared Away and its patches.
4. Enable only one ZoneBench export. Combine desired add-ons in one project first.
5. Test a disposable new game before applying custom exports to a playthrough.

Exports do **not** include engine binaries or replace `zzz_armor_mag_pouches.script`. A small `zzz_amp_zonebench.script` registers drop items through the existing `amp_wd_seam` interface; a late DLTX patch assigns real rig slot 15, native container classes, pouch grants and models. The bridge executes before the inventory module's startup, matching the ordering used by the existing wearable-device patch.

Removing a stock item removes distribution entries but preserves its section definition so installed native-slot and model patches do not reference a missing section. Existing objects are not destroyed.

Old ZoneBench project files are accepted. Embedded old runtime/config templates are discarded in favor of the bundled baseline. Unknown custom model assets are not bundled automatically.

## Development

Node 22 or newer; no package installation is required.

```sh
npm test
npm run build
npm run serve
```

Optional Lua 5.1 smoke test (Python with `lupa` installed): `python tests/runtime_smoke.py`.

Open `http://127.0.0.1:8768`. Production files are in `web/`; GitHub Actions tests and publishes that directory on pushes to `main`.

- `web/src/emit.js`: existing LTX/XML emitters, ported out of the legacy HTML; retired inventory-layout emitters and whole-runtime rewriting removed.
- `web/src/archive.js`: image atlas, DDS and ZIP utilities.
- `web/src/editor.js`: ported editing controls and project persistence.
- `web/src/compatibility.js`: current native-engine export integration and input validation.
- `web/src/catalog.js`: public pack browser and world-model controls.
- `web/data/baseline.js`: current item data, icon images and trusted config templates.
- `web/assets/models/`: accepted shared rig and box world assets.

The first web version preserves the established editing controls; further UI refactoring can proceed without changing the exporter.

## Public catalog

Maintainers add reviewed `zonebench-items` JSON files under `web/catalog/`, then list them in `index.json`:

```json
{
  "version": 1,
  "addons": [
    {
      "name": "Your pack name",
      "author": "Creator",
      "version": "1.0",
      "description": "What it adds and which mods it requires.",
      "file": "your-pack.json"
    }
  ]
}
```

Generate the pack with **Share items**. Previewing a catalog entry opens the existing item-selection and name-conflict review before import. Do not include arbitrary scripts, executables or external image URLs in catalog files. Pack authors must have permission to distribute included artwork.

## Validation status

Automated tests cover native slots, preservation of stock section definitions, pouch grants, import rejection, DDS channels and ZIP structure. Browser checks cover page startup and actual ZIP export. Lua checks use a mocked runtime interface; exported custom items still need in-game testing against the target mod/engine combination.

This repository does not grant a new license to third-party game or mod assets. Attribution and existing permissions remain applicable.

## Community library preview

Account and community publishing use Appwrite; creator publishing and administrator removal have been tested. See [setup instructions](docs/community-setup.md). The feature flag remains off until the backend is provisioned and live authentication and access checks pass. Creators can publish immediately, update one listing and unpublish their own packs. Maintainers can remove listings, block publishing and save exact versions privately for the next mod release. Bug reporting remains excluded.

## Clean Armory site and releases

The default page is Home. Main navigation separates Editor, Community, Downloads, Help and Account. Editor project autosave and exports are unchanged. Community account/publishing access remains opt-in with `?community-preview=1`.

The Downloads page reads public releases from `Fomok/xray-monolith-inventory-edits`. It only offers complete mod/engine pairs from the same release, excludes drafts, labels previews explicitly, and keeps older releases available. Publish an updated version to that repository to update the site automatically. New asset names must match the conventions in `web/src/releases.js`; ambiguous or incomplete pairs are not offered. `web/data/releases.json` is a last-verified fallback for GitHub API outages/rate limits, clearly labelled when used; update it alongside a new release.

The editor baseline is now Preview 40, verified against all 47 embedded configuration templates and all four shared model assets. Item configs are unchanged from Preview 28; later previews add runtime/UI changes that exports deliberately do not replace. Source identity and content hashes are recorded in `web/data/baseline-manifest.json`.

The matching custom engine is `75cbdbc8436d1f5d0fe4ee774ae3913b910f3373`, with its matching DB0. The draft mod release remains hidden and its assets still need refreshing before publication; updating the editor does not publish or update the mod download.

See [installation guide](docs/installation.md) for the current setup and FOMOD choices. Home and Introduction use actual gameplay screenshots, with region outlines explaining the mechanics.

## Publishing patch notes

Player-facing notes live in `web/src/patch-notes.js`. Add the next entry at the beginning of `entries` with a new unique `id`; keep old entries below it. The newest ID controls the amber New badge. Opening Patch Notes marks that ID read locally, including direct links. Minor spelling edits can keep the ID; a new patch must use a new ID. This preference is per browser and does not require an account. If browser storage is unavailable, it lasts only until reload. Notes do not publish the mod release.
