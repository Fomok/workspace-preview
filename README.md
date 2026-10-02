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

The bundled baseline is **Squared Away 3.49.2, native-grid preview 28**, with its matching custom engine. The magazine mod supplies the three stock expansion pouches. GAMMA-specific recipes and trader integrations still need their respective mods.

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

## Community library integration (pending activation)

Account and community publishing code is prepared for Appwrite. See [setup instructions](docs/community-setup.md). The feature flag remains off until the backend is provisioned and live authentication and access checks pass. Creators can publish immediately, update one listing and unpublish their own packs. Maintainers can remove listings, block publishing and save exact versions privately for the next mod release. Bug reporting remains excluded.

## Clean Armory site and releases

The default page is Home. Main navigation separates Editor, Community, Downloads, Help and Account. Editor project autosave and exports are unchanged. Community account/publishing access remains opt-in with `?community-preview=1`.

The Downloads page reads public releases from `Fomok/xray-monolith-inventory-edits`. It only offers complete mod/engine pairs from the same release, excludes drafts, labels previews explicitly, and keeps older releases available. Publish an updated version to that repository to update the site automatically. New asset names must match the conventions in `web/src/releases.js`; ambiguous or incomplete pairs are not offered. `web/data/releases.json` is a last-verified fallback for GitHub API outages/rate limits, clearly labelled when used; update it alongside a new release.

Prepared draft release (kept private until website completion): `v3.49.2-native-preview`, engine `75cbdbc8436d1f5d0fe4ee774ae3913b910f3373`. Mod archive combines unchanged Preview28 gameplay and the accepted rig v4 / box v1 model patches. New game required when migrating from the old public release.

Hero artwork: `web/assets/site/clean-armory-hero.png`, generated using the built-in image-generation tool from the approved Clean Armory mockup. Prompt: recreate only the cinematic hero background with worn black chest rig, olive hard case and utility pouch on a wooden workbench inside an abandoned industrial workshop; gear on the right, dark negative space on the left, warm side lighting, no words or UI. This is atmospheric artwork, not an in-game screenshot.
