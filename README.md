# ZoneBench

The browser-based item editor and community add-on library for **Squared Away**, the grid inventory mod for **S.T.A.L.K.E.R. Anomaly and G.A.M.M.A.**

**[Open ZoneBench](https://fomok.github.io/zonebench/)**

## What you can do

- Learn how Squared Away works through the illustrated Introduction and installation guide.
- Edit rigs, boxes, pouches and backpack layouts, including item textures, storage rules, prices and crafting recipes.
- Preview your changes and export an add-on ZIP for Mod Organizer 2.
- Browse community add-ons and inspect their items before importing them.
- Sign in to publish, update or remove your own add-ons.
- Read patch notes and find the mod and its matching engine downloads when available.

The editor targets **Squared Away 2.0**. [Download the mod and matching engine](https://fomok.github.io/zonebench/#downloads). Start a new game when upgrading from the previous public release.

## Your projects

Item editing and export run in your browser. Use **Save project** to keep a portable backup of your work. Community accounts and published add-ons use Appwrite. An account is not required for editing your own items.

Install exported add-ons after Squared Away in MO2. ZoneBench exports customizations, not the full mod or engine. See the [installation guide](docs/installation.md) for compatibility and setup.

## Run locally

Requires Node.js 22 or newer. The website has no bundler or production npm dependencies.

```sh
npm run serve
```

Open the local address printed by the server. To check the project:

```sh
npm test
npm run build
```

## Project layout

- `web/` - website, editor, bundled item data and assets.
- `backend/community/` - Appwrite community and moderation service.
- `tests/` - editor, export, release and community checks.
- `docs/` - installation, community setup and site text editing.
- `tools/` - local server, validation and backend setup tools.

GitHub Pages deploys the website from `main`. Backend setup is documented in [community setup](docs/community-setup.md). Never commit API keys or other secrets.

## Related project

[Squared Away custom engine](https://github.com/Fomok/xray-monolith-inventory-edits) - required engine changes and mod release packages.

Created by **Fomok** for the Squared Away community.
