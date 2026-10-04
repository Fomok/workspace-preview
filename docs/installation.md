# Squared Away / ZoneBench installation

## Current editor baseline

ZoneBench targets Squared Away 2.0.1 (the localization hotfix). Item definitions, recipes, trader templates and shared world models match the tested current mod. The older public 3.48.0 download is not compatible with these exports. The 2.0 mod and matching engine are available in the website Downloads tab.

## Install the mod

Use Anomaly 1.5.3 or your GAMMA installation. Install the full Squared Away FOMOD ZIP with MO2. Replace an older Squared Away installation rather than merging it, and disable previous preview or hotfix copies. Preserve your chosen optional patches.

## Install the required engine

Squared Away 2.0 uses custom engine commit 10379de91577b0cd3a513547a6ef5473d43a3b37 and its matching DB0. With the game closed, back up your existing files and extract the engine ZIP into the Anomaly game folder: executables and PDBs go under bin, and the DB0 under db/mods. The engine package is installed in the game folder, not as a normal MO2 mod. Stock Anomaly or upstream Monolith executables are not supported for this native rebuild.

## Saves and upgrades

The 2.0.1 localization hotfix supports existing 2.0 saves and uses the same engine package. Replace the full mod in MO2 and choose the same optional patches.

Start a new game when moving from the old public mod to the native rebuild. Back up saves before changing item configurations and test custom exports on a disposable save.

## SOTA UI and HD Icons

SOTA UI is optional. Check SOTA UI compatibility only when SOTA and its requirements are installed. With SOTA, use the SOTA-patched HD Inventory Icons Framework; without SOTA, use the non-SOTA variant. Never enable both variants. Squared Away must win the relevant UI conflicts: put it below those mods in the MO2 left pane. Both UI choices use Field Kit artwork and support the two inventory layouts in MCM.

## Wearable Devices support

Select this FOMOD option only with the separately installed Wearable Devices pack. It adds device controls below the backpack and keeps equipped devices out of the bag grid.

## Tarkov-like corpse looting

Select this FOMOD option only with Looting Takes Time Redux by Priler. Turn OFF its "Pre-sort items on grid" MCM option. The patch changes corpse looting; stashes and living NPCs keep their usual behavior.

## Magazine support

The baseline is Mags Reloaded Fork by Priler UPDATE 6. Install it separately for magazine support and the three stock expansion pouches. GAMMA recipes and trader integrations require the corresponding GAMMA content; a plain Anomaly setup does not supply those dependencies automatically. Use the direct download message below.

## Create and install an add-on

Save a project backup, edit your items, then open Check and resolve errors. Use Export mod to create the ZIP and install it as a separate MO2 mod below Squared Away and all its patches. Enable only one ZoneBench export; combine desired community items in one project before exporting. Existing browser customizations are preserved when the baseline updates. Exports include item configuration and selected assets, not the inventory runtime or engine.

## Settings and context menus

Squared Away settings are grouped in MCM, including layout, appearance, controls, rig rules and drops. Saved MCM choices override exported drop and condition defaults. Box and rig context-menu support is included for vanilla Anomaly and GAMMA; no additional context-menu FOMOD patch is needed.

## Browse and publish

Community previews show item textures, layouts and properties before import. Signed-in creators can publish, update and unpublish their own add-ons. Administrator removal has been tested. Community access is available through the website.

## Keep your work

Editing and exports happen in your browser. Save project downloads a portable backup. Reset item customizations clears local edits, not your account or published add-ons. Email sign-in and community listings use Appwrite. No analytics or bug-report uploads are included.

[Magazine mod download message](https://discord.com/channels/912320241713958912/1322655858240262304/1524208180135989459)
