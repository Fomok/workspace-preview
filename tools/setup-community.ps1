$ErrorActionPreference = 'Stop'
$zonebenchRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $zonebenchRoot
Write-Host 'ZoneBench community backend setup'
Write-Host 'Target: project 6abfefea000040e18b74 in Frankfurt.'
Write-Host 'This creates the private database, pack storage and community function.'
Write-Host 'The API key is entered privately and is not saved to disk.'
$zonebenchSecret = Read-Host 'Temporary Appwrite setup key' -AsSecureString
try {
    $env:APPWRITE_API_KEY = [System.Net.NetworkCredential]::new('', $zonebenchSecret).Password
    & node (Join-Path $PSScriptRoot 'setup-community.mjs') --apply
    if ($LASTEXITCODE -ne 0) { throw 'Setup did not complete. Keep the output for troubleshooting; it does not contain the API key.' }
}
finally {
    Remove-Item Env:APPWRITE_API_KEY -ErrorAction SilentlyContinue
    $zonebenchSecret.Dispose()
}
Write-Host 'Keep the website publishing switch off until deployment and sign-in are checked.'
