export const blocks=[
  [
    "Squared Away 2.0 Update",
    "ZoneBench targets Squared Away 2.0.3. Update both the mod in MO2 and the matching engine in your Anomaly folder. Existing 2.0.x saves are supported. Home introduces the mod, Introduction explains its mechanics, and Patch Notes covers what changed. The 2.0 Update is available in Downloads. Install both the mod and its matching engine. Downloads only lists published packages. An older download is not the version this editor targets."
  ],
  [
    "Install the mod",
    "Use Anomaly 1.5.3 or your GAMMA installation. Install the full Squared Away ZIP through Mod Organizer 2 (MO2). Its FOMOD installer lets you choose optional patches. Replace an older Squared Away installation instead of merging files, and disable old copies and hotfixes. Select only patches for mods you actually have."
  ],
  [
    "Install the matching engine",
    "The 2.0 Update requires the Squared Away custom engine and its matching DB0 file. Close the game and back up your existing engine files, then extract the engine ZIP into your Anomaly game folder. The bin folder contains the executables and PDB files; db/mods contains the DB0. Preserve that folder structure. Install this package in Anomaly itself, not as an MO2 mod. Stock Anomaly and unmodified Monolith executables are not supported."
  ],
  [
    "Engine choices and developer files",
    "The all-DX engine package includes DX8, DX9, DX10 and DX11 executables, each with AVX and non-AVX versions. Choose a renderer supported by your setup, and use AVX only if your CPU supports it. The separate For Developers ZIP is for engine authors merging changes; players do not need it. Always use the engine paired with your mod release in Downloads. Bodycam users can choose the optional combined Bodycam engine for 2.0.3 instead of the standard package. It supports DX11-AVX only and includes its matching DB0. Install both bin and db/mods from that ZIP. For PiP scopes, keep the matching external 3DSS PiP compatibility content required by Bodycam."
  ],
  [
    "Saves and upgrades",
    "Updating from 2.0, 2.0.1 or 2.0.2 to 2.0.3 does not require a new game. Install the updated engine as well as the mod. Upgrading from the old public version (before 2.0) to 2.0 requires a new game. Do not continue an old playthrough with the rewrite. Back up saves before changing custom item configurations, and test add-ons on a separate save."
  ],
  [
    "SOTA UI and HD Inventory Icons",
    "SOTA UI is optional. Select SOTA UI compatibility in the installer only if SOTA and its usual requirements are installed. HD Inventory Icons Framework is required so item icons display correctly in the inventory. Choose its SOTA-patched version with SOTA, or its non-SOTA version without it. Never enable both. Place Squared Away below those UI mods in the MO2 left pane so its files win conflicts. Both UI choices use the Field Kit artwork and support the Tarkov-like and Anomaly default layouts."
  ],
  [
    "Wearable Devices support",
    "Select Wearable Devices support in the installer only with the separate Wearable Devices pack installed. It adds device controls below the backpack, keeps worn devices out of the bag grid, and adds the relevant settings to Squared Away in MCM."
  ],
  [
    "Tarkov-like corpse looting",
    "This installer option requires Looting Takes Time Redux by Priler. In that mod’s MCM settings, turn OFF Pre-sort items on grid so it does not compete with Squared Away for item placement. The patch adds equipment slots above scattered loot, with a Pockets divider and remembered positions and rotations. Stashes and living NPCs keep their normal behavior. Direct equipping from bodies works in the base mod, even with a full backpack; this visual patch is optional."
  ],
  [
    "Magazine support",
    "The baseline is Mags Reloaded Fork by Priler UPDATE 6. Install it separately for magazine support and the three stock expansion pouches. It also requires Dynamic Reload Speeds. Select the optional Mags Reloaded ammo fix in the FOMOD with Mags Reloaded Fork by Priler UPDATE 6 and its Dynamic Reload Speeds dependency installed. It requires the 2.0.3 engine. Let Squared Away win their file conflicts in MO2. The direct download message is linked below. GAMMA recipes and trader integrations also need their corresponding GAMMA content; plain Anomaly does not include those dependencies automatically."
  ],
  [
    "Inventory, rigs and containers",
    "Drag and rotate items to fit the grid. Equipped rigs provide accessible storage above the backpack; spare rigs and boxes keep their contents inside when dropped or stored. Expansion pouches attach below the equipped rig, and amber borders mark the extra storage they provide. See Introduction for the illustrated guide."
  ],
  [
    "Reloading, quick use and crafting",
    "By default, keep magazines in the equipped rig to reload, medicine there for quick use, and loose ammunition there for weapons that reload without magazines. Medicine and loose-ammo restrictions can be adjusted in MCM. Crafting and NPC item hand-ins can use items inside carried containers without unpacking them first. A non-empty rig cannot be disassembled."
  ],
  [
    "Appearance and controls",
    "Open Squared Away in MCM to choose your inventory layout, adjust background opacity, and configure controls, rig rules and drops. The backpack and rig equipment slots scroll with the inventory. White key prompts show available actions. The Swap toggle is beside the weight display. Box and rig context-menu actions are included for Anomaly and GAMMA; they do not need a separate installer patch."
  ],
  [
    "Create and install your own add-on",
    "In Editor, choose Rigs, Containers, Pouches, Backpacks or Drops and make your changes. Save project downloads a backup. Undo and Redo recover recent edits within the current tab (history resets on refresh); Changes lists customized items and available Community updates. Compare with default lets you inspect or reset one item. Export mod guides you through Review, Fix issues and Download. Resolve blocking errors before downloading your ZIP. Install that ZIP as a separate MO2 mod below Squared Away and its optional patches. Keep only one ZoneBench export enabled: combine everything you want in one project before exporting. Exports contain item configuration and selected assets, not the inventory scripts or engine. Saved MCM settings take priority over exported drop and condition defaults."
  ],
  [
    "Browse Community add-ons",
    "Community lets you browse optional player-made add-ons. Open View items to inspect their icons, storage layouts, descriptions, prices and crafting details before importing. Choose what to bring into your project, then export the combined result. Imports do not install anything into your game, and creator updates do not automatically overwrite your project."
  ],
  [
    "Publish and update your add-ons",
    "Sign in through Account using a code sent to your email. Your email is not shown on listings. Use Share items in Editor to select customizations and publish an add-on. In My add-ons, use Edit / update to revise the same listing instead of publishing duplicate versions, or Unpublish to remove it from public browsing. Other users keep items they already imported."
  ],
  [
    "Keep your work",
    "Item editing and exports happen in your browser. Use Save project regularly and Open project to restore a downloaded backup. Account → Reset item customizations clears local item edits and imported items only. It does not delete your account, sign you out, or remove published add-ons or installed game files."
  ],
  [
    "Administrator controls",
    "Your admin account has Manage public add-ons for removing unwanted listings and blocking abusive publishers. Next mod update keeps selected add-ons for later review. Account → Edit site text lets you change website wording: navigate to a page, select Refresh list, choose text, and Save for everyone. Identical phrases share the edit. Restore original returns to the current built-in wording. These controls are restricted to the administrator; website text edits do not change item configurations."
  ]
];
