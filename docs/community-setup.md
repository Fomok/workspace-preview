# Community backend setup

Prepared for project `6abfefea000040e18b74` at `https://fra.cloud.appwrite.io/v1`.
The GitHub Pages platform hostname is `fomok.github.io` and has been verified.

## Current status

Backend deployment 6abff8c2651e3143fb03 is running. Live guest browsing succeeds; anonymous publishing and private selections are denied. Community features are enabled at https://fomok.github.io/zonebench/ without a preview parameter. Sign-in, publishing and administrator removal have been tested. The project ID and endpoint do not grant permission to create tables, buckets or functions.

## Temporary setup access

In the ZoneBench Appwrite project, create a short-lived API key named `ZoneBench setup` with these project scopes:

- `databases.read`, `databases.write`
- `tables.read`, `tables.write`
- `columns.read`, `columns.write`
- `indexes.read`, `indexes.write`
- `buckets.read`, `buckets.write`
- `functions.read`, `functions.write`

This key is for provisioning this project only. No user-account, team, billing or project-key management scopes are needed. Do not paste the key in chat, source code, GitHub, or the website configuration.

Run the reviewed setup from the repository root. In PowerShell the key can be entered without displaying it or putting it into command history:

```powershell
$zonebenchSecret = Read-Host 'Temporary Appwrite setup key' -AsSecureString
$env:APPWRITE_API_KEY = [System.Net.NetworkCredential]::new('', $zonebenchSecret).Password
try { node tools/setup-community.mjs --apply }
finally { Remove-Item Env:APPWRITE_API_KEY -ErrorAction SilentlyContinue }
```

The tool creates one serverless database, four private tables (`addons`, `profiles`, `locks`, `selections`), one private JSON bucket and the `zonebench-community` function. It does not select a paid compute specification, expose storage publicly or touch other projects. Running without `--apply` prints a plan without making network requests. It is safe to rerun after partial setup; unexpected public permissions cause it to stop.

The function uses Appwrite's automatically issued execution key with only `rows.read`, `rows.write`, `files.read`, `files.write`. No permanent server key is bundled in the function or browser.

## Enablement and moderator account

1. Check the function deployment completes successfully.
2. Ensure **Email OTP** authentication is enabled in Appwrite Auth settings.
3. Serve a staging copy with community enabled and the staging hostname registered, or coordinate a brief controlled live test.
4. Sign in to ZoneBench with your email. The Appwrite console account created through GitHub is separate from a project end-user account.
5. Under ZoneBench **Account → Account details**, copy your account ID. Set it as the function variable `ZONEBENCH_ADMIN_IDS` in Appwrite. Multiple moderator IDs are comma-separated. This variable is server-only; never let users set it through the website.
6. Confirm guest browsing, email sign-in, creator update/unpublish, another user's denied edit, moderator removal, and next-update snapshots with disposable test packs.
7. Enable `COMMUNITY_CONFIG.enabled` in `web/src/community-config.js`, publish the validated site, and revoke the temporary setup API key.

## Behavior and limits

- New packs publish immediately; no approval queue and no bug reports.
- Stable listing IDs; revisions increase when content or publication status changes.
- Users explicitly preview and import newer revisions. Imported items retain source IDs even after renaming, so future updates can match them.
- Unpublishing hides the listing and blocks guest downloads. Already imported items stay in local projects.
- Moderators can remove a listing and block future publishing/updates by its creator. Blocking does not automatically hide all existing listings; removal is a separate action.
- Selecting for the next mod update stores a private copy of that exact pack. Creator edits/unpublishing cannot change the copy. Nothing merges into the base mod automatically.
- Initial limits: 20 items / 2 MB per pack, PNG icons up to 512 KB and 2048×2048, 25 listings per creator, 10 seconds between publishing operations.
- Custom 3D models are dependencies, not executable/file uploads.
- Database and storage permissions are empty. All access passes through the function, which verifies the invoking account JWT and enforces ownership. A creator cannot overwrite moderation state or another creator's ownership.
- A unique per-creator lock serializes conflicting mutations, with revision checks to reject stale updates. If a process is terminated while holding a lock, an administrator must inspect the `locks` row and remove it only after confirming no execution remains active. No automatic lease-stealing is used.
- Old current-version files are cleaned up after successful updates. Private selection files are separate. Review storage use periodically; free-tier limits still apply.

## Tests

`npm test` includes isolated service tests; these do not prove live email or Appwrite deployment behavior. No private keys or real user emails are stored in the test fixtures.
