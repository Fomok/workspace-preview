# Admin website text editing

Account → Edit site text is available to the verified accounts in ZONEBENCH_ADMIN_IDS. Navigate to the desired page, refresh the text list, select wording, and use Save for everyone. Saved edits also lists overrides no longer used by current pages. Restore original deletes one override. No item-project reset or GitHub change is involved.

Copy overrides are plain text. Existing markup, links, event handlers, option values and item exports are preserved. Matching uses the original wording with normalized whitespace: identical phrases share an override, while newly rewritten defaults do not inherit an unrelated override. Text embedded in images and the editor's item input values are not website copy. Edit item fields through the item editor instead.

The private sitecopy table holds source, value and revision columns. Only the server function can access it. Public reads use siteText; saveSiteText and resetSiteText require verified administrator identity server-side. A shared lock and expected revisions reject simultaneous/stale saves. Guests get defaults if the service is unavailable. Website updates leave stored overrides intact. A reload retrieves current wording.

Deployment: run the existing tools/setup-community.ps1 with a temporary setup key to create the missing table and deploy the updated function. Existing tables and admin IDs are preserved. Then publish the website. Verify public reads, non-admin denial, a temporary admin edit, and restoration.
