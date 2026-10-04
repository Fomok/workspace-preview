# Svelte preview

Live website: https://fomok.github.io/zonebench/
Preview: https://fomok.github.io/zonebench-preview/

The svelte-preview branch is deployed through a separate zonebench-preview repository. The workflow has a repository guard and cannot deploy over the live site. Do not push this branch to the production main branch until migration testing is complete.

Svelte owns the application shell, navigation, Home, Downloads, Help, installation checklist and Patch Notes. The established editor, introduction, community and account screens currently run through an explicit compatibility boundary in svelte/bootstrap.js. Their conversion into smaller Svelte components is the next migration phase; this is not a claim that every screen has already been rewritten.

The preview uses zonebench-svelte-preview-v1 for editor storage, separate patch-note state and intro state. Existing live projects are not automatically copied or modified. Use Save project on the live site and Open project on preview to test with a copy.

The public community library is readable/importable. Publication, moderation, account changes and global text edits are blocked by the preview client. Production server authorization remains in force. This is an accidental-write guard, not a server security boundary.

Use npm ci, npm test, npm run check, npm run build. npm run dev starts local Vite. Built preview assets live in dist; production source assets remain in web.
