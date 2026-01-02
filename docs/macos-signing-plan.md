# macOS Code Signing and Notarization via GitHub Actions

## Overview
Enable signed and notarized macOS patchers by integrating GitHub Actions into the release workflow. Local `npm run release` will orchestrate everything, with macOS patchers built and signed on a macOS runner.

## Architecture

```
Local (Linux)                          GitHub Actions (macOS)
─────────────────                      ─────────────────────────
1. Build patches
2. Build Linux/Windows patchers
3. Create DRAFT release with:
   - Linux/Windows patchers
   - patches.zip
4. Trigger GHA workflow ───────────────> 5. Download patches.zip
5. Wait for completion                    6. Download graft for macOS
         ↑                                7. Build macos-x64/arm64 patchers
         │                                8. Sign with Developer ID cert
         │                                9. Notarize with Apple
         │                               10. Staple notarization ticket
         │                               11. Zip .app bundles
         │                               12. Upload to release
         └─────────────────────────────  13. Publish release (draft → public)
6. Report success
```

## Secrets Required

Store these in `agi-ivrit` repo settings:

| Secret | Description |
|--------|-------------|
| `MACOS_CERTIFICATE` | Base64-encoded Developer ID Application certificate (.p12) |
| `MACOS_CERTIFICATE_PWD` | Password for the .p12 file |
| `APPLE_ID` | Apple Developer account email |
| `APPLE_ID_PASSWORD` | App-specific password (not account password) |
| `APPLE_TEAM_ID` | Apple Developer Team ID |
| `TRANSLATION_REPOS_TOKEN` | PAT with `repo` scope for translation repos |

## Files to Create/Modify

### 1. `.github/workflows/sign-macos.yml` (new)

Workflow triggered by `workflow_dispatch` with inputs:
- `translation` - e.g., "sq1"
- `release_tag` - e.g., "v1"
- `repo` - e.g., "sam-mfb/agi-ivrit-sq1"

**Security:** Uses a protected environment ("release") requiring manual approval before secrets are accessible.

Steps:
1. Download `patches.zip` from draft release using `gh release download`
2. Extract patches
3. Download graft binary for macOS
4. Run `graft build` for `macos-x64` and `macos-arm64`
5. Import signing certificate using `apple-actions/import-codesign-certs@v3`
6. Sign each .app with `codesign --deep --force --options runtime --sign "Developer ID Application: ..." *.app`
7. Create zip for each .app
8. Submit for notarization with `xcrun notarytool submit --wait`
9. Staple with `xcrun stapler staple`
10. Upload signed zips to release with `gh release upload`
11. Delete patches.zip from release with `gh release delete-asset`
12. Publish release with `gh release edit --draft=false`

### 2. `scripts/release.ts` (modify)

Changes:
- Skip macOS targets when building patchers locally
- Zip `project/patches` directory and include in release assets
- After creating draft release, trigger GHA workflow:
  ```typescript
  execSync(`gh workflow run sign-macos.yml \
    --ref main \
    -f translation=${translationSubdir} \
    -f release_tag=${versionTag} \
    -f repo=${config.repo}`, { stdio: 'inherit' });
  ```
- Wait for workflow completion using `gh run watch` or polling
- Report success (GHA handles patches.zip cleanup)

### 3. `scripts/utils/graft.ts` (modify)

Split `PATCHER_TARGETS` into:
```typescript
export const LOCAL_PATCHER_TARGETS = [
  'linux-x64',
  'linux-arm64',
  'windows-x64',
] as const;

export const MACOS_PATCHER_TARGETS = [
  'macos-x64',
  'macos-arm64',
] as const;
```

## Phased Implementation

### Phase 1: Basic Workflow (unsigned macOS patchers)
**Goal:** Verify GHA can download patches.zip and build macOS patchers

1. Create minimal `.github/workflows/sign-macos.yml`:
   - Manual trigger (`workflow_dispatch`) with inputs
   - Download patches.zip from draft release
   - Download graft for macOS
   - Build macos-x64 and macos-arm64 patchers
   - Upload to release (unsigned)

2. Test manually:
   - Create a draft release in agi-ivrit-sq1 with patches.zip
   - Trigger workflow manually via GitHub UI
   - Verify .app.zip files appear in release

**No secrets needed yet. No local script changes.**

---

### Phase 2: Add Code Signing
**Goal:** Sign the .app bundles with Developer ID certificate

1. Set up credentials:
   - Export Developer ID Application certificate as .p12
   - Base64-encode: `base64 -i certificate.p12 | pbcopy`
   - Add secrets: `MACOS_CERTIFICATE`, `MACOS_CERTIFICATE_PWD`

2. Create protected environment:
   - Go to repo Settings → Environments → New: "release"
   - Add required reviewer (yourself)
   - Move signing secrets to this environment

3. Update workflow:
   - Add `environment: release`
   - Import certificate with `apple-actions/import-codesign-certs@v3`
   - Sign .app bundles with `codesign`

4. Test:
   - Trigger workflow, approve environment
   - Download signed .app, verify on Mac: `codesign -dv --verbose=4 *.app`
   - Should show your Developer ID but will warn "not notarized"

---

### Phase 3: Add Notarization
**Goal:** Submit to Apple for notarization and staple

1. Set up credentials:
   - Generate app-specific password at appleid.apple.com
   - Find Team ID in Apple Developer portal
   - Add secrets: `APPLE_ID`, `APPLE_ID_PASSWORD`, `APPLE_TEAM_ID`

2. Update workflow:
   - Submit .app.zip to notarization with `xcrun notarytool submit --wait`
   - Staple with `xcrun stapler staple`
   - Re-zip after stapling

3. Test:
   - Trigger workflow
   - Download .app, verify on Mac: should open without Gatekeeper warning
   - Check: `spctl -a -vv *.app` should say "accepted" and "Notarized Developer ID"

---

### Phase 4: Integrate with Local Release Script
**Goal:** `npm run release sq1` triggers GHA and waits

1. Add secret: `TRANSLATION_REPOS_TOKEN` (PAT with repo scope)

2. Modify `scripts/utils/graft.ts`:
   - Split `PATCHER_TARGETS` into `LOCAL_PATCHER_TARGETS` and `MACOS_PATCHER_TARGETS`

3. Modify `scripts/release.ts`:
   - Build only Linux/Windows patchers locally
   - Zip patches directory and include in release
   - Create **draft** release (add `--draft` flag)
   - Trigger GHA: `gh workflow run sign-macos.yml ...`
   - Wait for completion: `gh run watch`
   - Report result

4. Update workflow to:
   - Delete patches.zip after uploading signed patchers
   - Publish release (remove draft status)

5. Test end-to-end:
   - Run `npm run release sq1`
   - Verify it waits for GHA
   - Verify final release has all signed patchers

## Security Notes

- `workflow_dispatch` can only be triggered by users with write access to `agi-ivrit`
- Protected environment ("release") requires your manual approval before secrets are accessible
- Signing certificate and Apple credentials are never exposed in logs
- `TRANSLATION_REPOS_TOKEN` PAT should have minimal scope (just `repo` for translation repos)

## Other Notes

- macOS runners are slower than Linux, but required for `codesign`
- Notarization typically takes 1-5 minutes
- The workflow needs `GITHUB_TOKEN` (automatic) + `TRANSLATION_REPOS_TOKEN` (secret) to access translation repos
