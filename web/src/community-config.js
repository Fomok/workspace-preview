/* Public project identifiers. No API key belongs in this file. */
const COMMUNITY_CONFIG=Object.freeze({
 // Preview access is a UI switch, not authorization; the server enforces all permissions.
 enabled:new URLSearchParams(globalThis.location.search).get('community-preview')==='1',
 endpoint:'https://fra.cloud.appwrite.io/v1',
 project:'6abfefea000040e18b74',
 functionId:'zonebench-community'
});
