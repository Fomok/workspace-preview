# Editor update notices

Preview builds automatically fingerprint editor scripts and static styles. Do not replace this with a fixed cache tag. Open tabs check build.json on focus and once per minute; refreshing saves pending editor changes first.

For a user-visible editor update, increment revision in svelte/editor-release.json and set a short title/message. Dismissal is saved per browser, independently from mod patch notes.

Only when generated add-on files change in a way that needs reinstalling, increment exportRevision and set requiresRedownload to true. Explain what needs re-downloading in message. Interface-only changes do not require new ZIPs. Export revision is included in addon.json and remembered download records; Account flags older exports for re-download. Retain exportRevision on later interface-only updates. Old downloads without a revision are treated as older exports once a required export update occurs.

Deploy to zonebench-preview only until the preview is approved for the live site. Do not clear users' project storage as a cache fix.
