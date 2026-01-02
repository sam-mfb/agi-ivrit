# GitHub Actions Release Pipeline with macOS Signing

## Overview
Build all patchers (Linux, Windows, macOS) in GitHub Actions, with macOS patchers signed and notarized. Local `npm run release` builds patches and orchestrates the GHA workflow.

## Architecture

```
Local (Linux)                          GitHub Actions (macOS runner)
─────────────────                      ─────────────────────────────
1. Build patches
2. Create DRAFT release with
   patches.zip only
3. Trigger GHA workflow ──────────────> 4. Download patches.zip
4. Wait for completion                   5. Download graft
         ↑                               6. Build ALL patchers:
         │                                  - linux-x64, linux-arm64
         │                                  - windows-x64
         │                                  - macos-x64, macos-arm64
         │                               7. Sign macOS .app bundles
         │                               8. Notarize with Apple
         │                               9. Staple notarization ticket
         │                              10. Zip .app bundles
         │                              11. Upload all patchers
         │                              12. Delete patches.zip
         └───────────────────────────── 13. Publish release
5. Report success
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

### 1. `.github/workflows/build-release.yml` (new)

Workflow triggered by `workflow_dispatch` with inputs:
- `translation` - e.g., "sq1"
- `release_tag` - e.g., "v1"
- `repo` - e.g., "sam-mfb/agi-ivrit-sq1"
- `patcher_name` - e.g., "sq1-heb"

**Security:** Uses a protected environment ("release") requiring manual approval before secrets are accessible.

Steps:
1. Download `patches.zip` from draft release using `gh release download`
2. Extract patches
3. Download graft binary for macOS
4. Build ALL patchers with `graft build`:
   - `linux-x64`, `linux-arm64`, `windows-x64`
   - `macos-x64`, `macos-arm64`
5. Import signing certificate using `apple-actions/import-codesign-certs@v3`
6. Sign each .app with `codesign --deep --force --options runtime --sign "Developer ID Application: ..." *.app`
7. Submit each .app for notarization with `xcrun notarytool submit --wait`
8. Staple with `xcrun stapler staple`
9. Zip .app bundles
10. Upload all patchers to release with `gh release upload`
11. Delete patches.zip from release with `gh release delete-asset`
12. Publish release with `gh release edit --draft=false`

### 2. `scripts/release.ts` (modify)

Changes:
- Remove local patcher building entirely
- Zip `project/patches` directory
- Create **draft** release with only patches.zip
- Trigger GHA workflow:
  ```typescript
  execSync(`gh workflow run build-release.yml \
    --ref main \
    -f translation=${translationSubdir} \
    -f release_tag=${versionTag} \
    -f repo=${config.repo} \
    -f patcher_name=${translationSubdir}-heb`, { stdio: 'inherit' });
  ```
- Wait for workflow completion using `gh run watch` or polling
- Report success

### 3. `scripts/release-patch.ts` (modify)

Changes:
- Remove patcher building steps (only create patches now)
- Keep patch creation with graft
- Remove PATCHERS_DIR creation/cleanup

## Phased Implementation

### Phase 1: Basic Workflow (all patchers, unsigned)
**Goal:** Verify GHA can download patches.zip and build all patchers

1. Create minimal `.github/workflows/build-release.yml`:
   - Manual trigger (`workflow_dispatch`) with inputs
   - Download patches.zip from draft release
   - Download graft for macOS
   - Build all 5 platform targets
   - Upload to release (macOS unsigned)

2. Test manually:
   - Run `npm run release:patch sq1` locally to create patches
   - Zip patches: `cd project && zip -r patches.zip patches`
   - Create a draft release in agi-ivrit-sq1 with patches.zip
   - Trigger workflow manually via GitHub UI
   - Verify all patchers appear in release

**Only needs `TRANSLATION_REPOS_TOKEN` secret. No signing yet.**

---

### Phase 2: Local Signing & Notarization Test
**Goal:** Verify credentials and notarization process work on your local Mac

1. Download an unsigned .app.zip from the Phase 1 release

2. Unzip and sign locally:
   ```bash
   unzip sq1-heb-macos-arm64.app.zip
   codesign --deep --force --options runtime \
     --sign "Developer ID Application: Your Name (TEAMID)" \
     sq1-heb-macos-arm64.app
   ```

3. Verify signature:
   ```bash
   codesign -dv --verbose=4 sq1-heb-macos-arm64.app
   ```

4. Zip and submit for notarization:
   ```bash
   zip -r sq1-heb-macos-arm64.app.zip sq1-heb-macos-arm64.app
   xcrun notarytool submit sq1-heb-macos-arm64.app.zip \
     --apple-id "your@email.com" \
     --team-id "TEAMID" \
     --password "app-specific-password" \
     --wait
   ```

5. If successful, staple:
   ```bash
   xcrun stapler staple sq1-heb-macos-arm64.app
   ```

6. Verify notarization:
   ```bash
   spctl -a -vv sq1-heb-macos-arm64.app
   # Should say "accepted" and "Notarized Developer ID"
   ```

**If this fails:** Fix credential issues before proceeding. Common problems:
- Wrong certificate type (need "Developer ID Application", not "Apple Development")
- App-specific password not generated correctly
- Team ID incorrect

---

### Phase 3: Add Code Signing to Workflow
**Goal:** Sign the .app bundles with Developer ID certificate in GHA

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

### Phase 4: Add Notarization to Workflow
**Goal:** Submit to Apple for notarization and staple in GHA

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

### Phase 5: Integrate with Local Release Script
**Goal:** `npm run release sq1` triggers GHA and waits

1. Modify `scripts/release.ts`:
   - Remove patcher building
   - Zip patches directory
   - Create **draft** release with patches.zip only
   - Trigger GHA: `gh workflow run build-release.yml ...`
   - Wait for completion: `gh run watch`
   - Report result

2. Modify `scripts/release-patch.ts`:
   - Remove patcher building steps
   - Only create patches

3. Test end-to-end:
   - Run `npm run release sq1`
   - Verify it waits for GHA
   - Verify final release has all patchers (Linux, Windows, macOS signed)

## Security Notes

- `workflow_dispatch` can only be triggered by users with write access to `agi-ivrit`
- Protected environment ("release") requires your manual approval before secrets are accessible
- Signing certificate and Apple credentials are never exposed in logs
- `TRANSLATION_REPOS_TOKEN` PAT should have minimal scope (just `repo` for translation repos)

## Other Notes

- macOS runners are slower and more expensive than Linux, but simplify the architecture
- Notarization typically takes 1-5 minutes
- All patchers are built in GHA for consistency
- The workflow uses `TRANSLATION_REPOS_TOKEN` to access translation repos for release management
