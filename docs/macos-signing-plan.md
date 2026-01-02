# GitHub Actions Release Pipeline with macOS Signing

## Background

**agi-ivrit** is a project that creates Hebrew translations for classic Sierra AGI (Adventure Game Interpreter) games from the 1980s, such as Space Quest I, Space Quest II, and Manhunter: New York.

### Repository Structure

- **agi-ivrit** (this repo): Contains the translation tooling, build scripts, and translation source files. This is where development happens.
- **Translation repos** (e.g., `agi-ivrit-sq1`, `agi-ivrit-sq2`, `agi-ivrit-mh1`): Separate public repositories where releases are published. Each contains only the patcher executables for one game—no source code or copyrighted game assets.

This separation exists because:
1. The main repo contains build tooling that end users don't need
2. Each game gets its own clean release page
3. Users can download patchers without navigating a monorepo

### What We're Building

The release process creates **patcher executables** for each platform (Linux, Windows, macOS). Users download the patcher, point it at their original game files, and it applies the Hebrew translation patch.

Currently, patchers are built locally on Linux. The problem: **macOS patchers are unsigned**, which triggers Gatekeeper warnings and makes them difficult for users to run.

### Goal

This plan implements a GitHub Actions workflow that:
1. Builds all patchers (Linux, Windows, macOS) in CI
2. Signs and notarizes the macOS patchers with an Apple Developer certificate
3. Publishes everything to the appropriate translation repo

The local `npm run release <game>` command will orchestrate the entire process, waiting for the GitHub Actions workflow to complete before reporting success.

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

## Authentication Setup

### GitHub App (for cross-repo access)

Using a GitHub App instead of a PAT provides:
- Short-lived tokens (8 hours vs up to 1 year)
- Independent identity (not tied to your personal account)
- Higher rate limits (15,000/hour vs 5,000/hour)

**Setup:**
1. Go to GitHub Settings → Developer settings → GitHub Apps → New GitHub App
2. Name: e.g., "agi-ivrit-release-bot"
3. Homepage URL: your repo URL
4. Uncheck "Webhook → Active" (not needed)
5. Permissions:
   - Repository permissions → Contents: Read and write
   - Repository permissions → Metadata: Read-only
6. "Where can this GitHub App be installed?" → Only on this account
7. Create the app
8. Note the **App ID** from the app's settings page
9. Generate a **Private Key** (.pem file) and download it
10. Install the app on translation repos (agi-ivrit-sq1, agi-ivrit-sq2, agi-ivrit-mh1)

**Secrets to add:**
| Secret | Description |
|--------|-------------|
| `APP_ID` | GitHub App ID (numeric) |
| `APP_PRIVATE_KEY` | Contents of the .pem file |

### App Store Connect API Key (for notarization)

Using an API key instead of app-specific password is Apple's recommended approach:
- Not tied to personal Apple ID
- More suitable for automation
- Works with `notarytool`

**Setup:**
1. Go to [App Store Connect → Users and Access → Integrations → App Store Connect API](https://appstoreconnect.apple.com/access/integrations/api)
2. Click "+" to generate a new key
3. Name: e.g., "agi-ivrit-notarization"
4. Access: "Developer" role (sufficient for notarization)
5. Download the `.p8` file (can only download once!)
6. Note the **Key ID** and **Issuer ID**

**Secrets to add:**
| Secret | Description |
|--------|-------------|
| `MACOS_CERTIFICATE` | Base64-encoded Developer ID Application certificate (.p12) |
| `MACOS_CERTIFICATE_PWD` | Password for the .p12 file |
| `NOTARY_KEY` | Contents of the .p8 file |
| `NOTARY_KEY_ID` | Key ID from App Store Connect (10-char alphanumeric) |
| `NOTARY_ISSUER` | Issuer ID from App Store Connect (UUID format) |

## Security Hardening

### 1. Graft Binary Verification

To prevent supply chain attacks, pin the graft version and verify its checksum:

```yaml
env:
  GRAFT_VERSION: "1.0.0"  # Update when upgrading graft
  GRAFT_SHA256: "abc123..." # SHA256 of graft-macos-arm64 for this version

steps:
  - name: Download and verify graft
    run: |
      curl -L -o graft "https://github.com/sam-mfb/graft/releases/download/v${GRAFT_VERSION}/graft-macos-arm64"
      echo "${GRAFT_SHA256}  graft" | shasum -a 256 --check
      chmod +x graft
```

When releasing a new graft version, update `GRAFT_VERSION` and `GRAFT_SHA256` in the workflow.

### 2. Action Pinning

Pin all GitHub Actions to full commit SHAs (not mutable version tags):

```yaml
# Bad - mutable tag can be overwritten
uses: actions/create-github-app-token@v1

# Good - immutable commit SHA
uses: actions/create-github-app-token@5d869da34e18e7287c1daad50e0b8ea0cd506b69  # v1.11.0
```

### 3. Inside-Out Code Signing

Apple recommends signing nested content before the outer bundle. Do not use `--deep`:

```bash
# Sign the inner binary first
codesign --force --options runtime \
  --sign "Developer ID Application: ..." \
  MyApp.app/Contents/MacOS/MyApp

# Then sign the outer bundle
codesign --force --options runtime \
  --sign "Developer ID Application: ..." \
  MyApp.app
```

### 4. Secure Secret Handling

Write temporary secret files to `$RUNNER_TEMP` (automatically cleaned up):

```bash
echo "$NOTARY_KEY" > "$RUNNER_TEMP/notary-key.p8"
xcrun notarytool submit ... --key "$RUNNER_TEMP/notary-key.p8" ...
rm -f "$RUNNER_TEMP/notary-key.p8"
```

## Files to Create/Modify

### 1. `.github/workflows/build-release.yml` (new)

Workflow triggered by `workflow_dispatch` with inputs:
- `translation` - e.g., "sq1"
- `release_tag` - e.g., "v1"
- `repo` - e.g., "sam-mfb/agi-ivrit-sq1"
- `patcher_name` - e.g., "sq1-heb"

**Security:** Uses a protected environment ("release") requiring manual approval before secrets are accessible.

Steps:
1. Generate GitHub App token using `actions/create-github-app-token@<SHA>`
2. Download `patches.zip` from draft release using `gh release download`
3. Extract patches
4. Download graft binary, **verify SHA256 checksum**
5. Build ALL patchers with `graft build`:
   - `linux-x64`, `linux-arm64`, `windows-x64`
   - `macos-x64`, `macos-arm64`
6. Import signing certificate using `apple-actions/import-codesign-certs@<SHA>`
7. Sign each .app **inside-out** (inner binary first, then bundle):
   ```bash
   codesign --force --options runtime --sign "Developer ID Application: ..." \
     MyApp.app/Contents/MacOS/MyApp
   codesign --force --options runtime --sign "Developer ID Application: ..." \
     MyApp.app
   ```
8. Write API key to `$RUNNER_TEMP`, submit for notarization:
   ```bash
   echo "$NOTARY_KEY" > "$RUNNER_TEMP/notary-key.p8"
   xcrun notarytool submit app.zip \
     --key "$RUNNER_TEMP/notary-key.p8" \
     --key-id $NOTARY_KEY_ID \
     --issuer $NOTARY_ISSUER \
     --wait
   rm -f "$RUNNER_TEMP/notary-key.p8"
   ```
9. Staple with `xcrun stapler staple`
10. Zip .app bundles
11. Upload all patchers to release with `gh release upload` (using App token)
12. Delete patches.zip from release with `gh release delete-asset`
13. Publish release with `gh release edit --draft=false`

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

**Secrets needed:** `APP_ID`, `APP_PRIVATE_KEY` (GitHub App). No signing secrets yet.

---

### Phase 2: Local Signing & Notarization Test
**Goal:** Verify credentials and notarization process work on your local Mac

1. Download an unsigned .app.zip from the Phase 1 release

2. Unzip and sign locally (inside-out, no `--deep`):
   ```bash
   unzip sq1-heb-macos-arm64.app.zip
   # Sign inner binary first
   codesign --force --options runtime \
     --sign "Developer ID Application: Your Name (TEAMID)" \
     sq1-heb-macos-arm64.app/Contents/MacOS/sq1-heb
   # Then sign outer bundle
   codesign --force --options runtime \
     --sign "Developer ID Application: Your Name (TEAMID)" \
     sq1-heb-macos-arm64.app
   ```

3. Verify signature:
   ```bash
   codesign -dv --verbose=4 sq1-heb-macos-arm64.app
   ```

4. Zip and submit for notarization (using API key):
   ```bash
   zip -r sq1-heb-macos-arm64.app.zip sq1-heb-macos-arm64.app
   xcrun notarytool submit sq1-heb-macos-arm64.app.zip \
     --key /path/to/AuthKey_XXXXXX.p8 \
     --key-id "YOUR_KEY_ID" \
     --issuer "YOUR_ISSUER_ID" \
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
- API key doesn't have "Developer" or "App Manager" role
- Key ID or Issuer ID incorrect
- .p8 file path wrong

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

1. Add secrets (from App Store Connect API key created earlier):
   - `NOTARY_KEY` - contents of .p8 file
   - `NOTARY_KEY_ID` - 10-character key ID
   - `NOTARY_ISSUER` - UUID issuer ID

2. Update workflow:
   - Write .p8 key to temp file
   - Submit .app.zip to notarization with `xcrun notarytool submit --key ... --wait`
   - Staple with `xcrun stapler staple`
   - Re-zip after stapling
   - Clean up temp key file

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

**Access Control:**
- `workflow_dispatch` can only be triggered by users with write access to `agi-ivrit`
- Protected environment ("release") requires your manual approval before secrets are accessible

**Authentication:**
- GitHub App tokens are short-lived (8 hours) and scoped only to installed repos
- App Store Connect API keys are more secure than app-specific passwords for automation

**Supply Chain:**
- All GitHub Actions pinned to immutable commit SHAs (not version tags)
- Graft binary version pinned with SHA256 checksum verification
- Signing certificate and Apple credentials are never exposed in logs

**Code Signing:**
- Inside-out signing (no `--deep`) ensures proper nested bundle signatures
- Secrets written to `$RUNNER_TEMP` for automatic cleanup

## Other Notes

- macOS runners are slower and more expensive than Linux, but simplify the architecture
- Notarization typically takes 1-5 minutes
- All patchers are built in GHA for consistency
- The workflow uses GitHub App tokens to access translation repos for release management
