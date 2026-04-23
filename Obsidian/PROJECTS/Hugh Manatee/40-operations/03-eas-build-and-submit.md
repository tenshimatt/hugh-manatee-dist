# 03 — EAS Build + EAS Submit

Audience: Matt, first Expo-to-stores pipeline. This runbook slots between "Expo app on your laptop" and "TestFlight / Play Internal."

Assumes you have already completed [[01-apple-developer-and-testflight]] and [[02-google-play-console]] up to the point where both account dashboards are live and the app records exist.

## Concept

- **EAS Build** = Expo's cloud build service. Expo runs the iOS build on their Macs and the Android build on their Linux boxes, then hands you back a `.ipa` (iOS) or `.aab` (Android). You do not need Xcode locally. You do not need to deal with keystores manually.
- **EAS Submit** = Expo uploads that `.ipa` / `.aab` straight to App Store Connect (TestFlight) or Play Console (Internal track).
- **Slug:** `hugh-manatee` — this is the EAS project slug, defined in `app.json` / `app.config.ts` and linked at project init time.

## Costs

- **Free tier:** roughly 30 builds/month, 1 concurrent build, 15-minute max build time. Plenty for MVP.
- **Paid tiers** start around $19/month and scale from there for teams and faster queues. Check current pricing at `https://expo.dev/pricing` — numbers above are TBD-verify-before-quoting; they have historically shifted yearly.
- Submit to stores: **no extra EAS charge**. Store fees ($99/yr Apple, $25 Google) are separate.

## Time costs

- First-time setup (login, init, configure): **~20 min**.
- Each iOS build: **~15–25 min** in the queue + build.
- Each Android build: **~10–15 min**.
- Submit upload: **~2–5 min** per platform.
- Apple processing after upload (before TestFlight shows build): **10–30 min**.
- Google processing: **a few minutes**.

## First-time setup

Run these from the Expo app root:

```bash
cd /Users/mattwright/pandora/lifebook/app
npx eas-cli login         # opens browser, one-time. use the same Expo account across the team.
npx eas-cli init          # links the local project to an EAS project; writes projectId into app.json
npx eas-cli build:configure    # creates/updates eas.json with build profiles
```

### Sanity check after setup

- `eas.json` exists at `/Users/mattwright/pandora/lifebook/app/eas.json` with at least `development`, `preview`, `production` profiles.
- `app.json` (or `app.config.ts`) now has an `extra.eas.projectId` field populated.
- `https://expo.dev/accounts/<your-account>/projects/hugh-manatee` loads in the browser and shows the project.

## First iOS build

```bash
cd /Users/mattwright/pandora/lifebook/app
npx eas-cli build --platform ios --profile preview
```

What to expect on first run — the CLI prompts:

1. **"Do you want to log in to your Apple account?"** → Yes. Enter your Apple ID + password + 2FA code. Expo uses this to manage provisioning profiles.
2. **"Generate a new Apple Distribution Certificate?"** → Yes.
3. **"Generate a new Apple Provisioning Profile?"** → Yes.
4. **"Which bundle identifier?"** → confirm `com.beyondpandora.hughmanatee`. If mismatch, fix `app.json` and re-run.
5. Build is queued at Expo. Terminal prints a URL like `https://expo.dev/accounts/.../builds/<uuid>`. Open it to watch progress.

Choose **"Let Expo handle it"** whenever offered — Expo's credential management is the path of least resistance. If you ever need to move off EAS, you can download the certs later.

### Sanity check

Build page at `expo.dev/.../builds/<uuid>` shows green **Finished** status and a download button for the `.ipa`. If it fails, the log usually points at either (a) bundle ID not matching Developer portal, or (b) a native dependency missing from the Expo prebuild.

## First Android build

```bash
cd /Users/mattwright/pandora/lifebook/app
npx eas-cli build --platform android --profile preview
```

On first run:

1. **"Generate a new Android keystore?"** → Yes. Expo stores the keystore server-side and signs every future build with it. **This keystore is critical: once you publish to the Play Store, losing it means you cannot update the app.** Download a backup after first build (see next section).
2. Build queues. URL printed. Wait ~10–15 min.

### Back up the Android keystore (do this once, do not skip)

```bash
cd /Users/mattwright/pandora/lifebook/app
npx eas-cli credentials
# Select Android → Keystore → Download credentials
```

Save the downloaded keystore + the printed passwords somewhere durable (1Password, encrypted backup). Replace-lost-keystore is an ordeal on Play — you essentially have to publish a new app under a new package name.

### Sanity check

Expo credentials page at `expo.dev/.../projects/hugh-manatee/credentials/android` shows a keystore present and its SHA-1/SHA-256 fingerprints.

## Submit to TestFlight

```bash
cd /Users/mattwright/pandora/lifebook/app
npx eas-cli submit --platform ios
```

First run prompts for App Store Connect API credentials:

### Generate an App Store Connect API key (one-time)

1. Open `https://appstoreconnect.apple.com/access/integrations/api`.
2. Click **+** to generate a new API key.
3. **Name:** `EAS Submit — Hugh Manatee`.
4. **Access:** `App Manager` (minimum needed to upload builds).
5. Click **Generate**.
6. **Download the `.p8` file immediately.** Apple only lets you download it once. Losing it means revoking and regenerating.
7. Also copy the **Key ID** (shown next to the key) and the **Issuer ID** (at the top of the page).

Save the `.p8` somewhere stable (not in the repo). Suggested: `~/.eas-credentials/AuthKey_<KEYID>.p8`.

Paste the Key ID, Issuer ID, and path to the `.p8` when EAS Submit asks. Expo stores these server-side for future submits — you won't be asked again.

### Sanity check after submit

- Terminal prints **"Submitted"** and a link to App Store Connect.
- Within 10–30 min, App Store Connect → Hugh Manatee → TestFlight tab shows the build in **"Processing"**, then **"Ready to Test"**.
- Your Internal Testing group (created in [[01-apple-developer-and-testflight]]) has the build auto-distributed; testers get a TestFlight push.

## Submit to Play Internal

```bash
cd /Users/mattwright/pandora/lifebook/app
npx eas-cli submit --platform android
```

First run prompts for a **Google Play service account JSON**:

### Generate a Play service account (one-time, fiddly)

1. Open `https://play.google.com/console` → **Setup → API access** (left sidebar, bottom).
2. If you've never done this, Google prompts you to **link a Google Cloud project**. Create a new GCP project called `hugh-manatee-play` if you don't already have one.
3. Scroll to **Service accounts** section → **Create new service account**.
4. A new tab opens in Google Cloud Console → **Service Accounts**. Click **Create Service Account**.
   - **Name:** `eas-submit-hugh-manatee`.
   - **Role:** skip (assign in Play Console, not GCP).
   - Click **Done**.
5. In GCP Service Accounts list, click the new account → **Keys** tab → **Add Key → Create new key → JSON**. The JSON downloads. Save it somewhere stable, e.g. `~/.eas-credentials/hugh-manatee-play-service-account.json`.
6. Go back to Play Console → **API access** → the new service account should appear in the list. Click **Grant access**.
7. **Permissions** → tick:
   - `Release manager` — or the finer-grained equivalent: `Release to production, exclude devices, and use Play App Signing`, `Release apps to testing tracks`, `View app information`. Release manager is simpler.
8. Click **Invite user** → **Send invite**.

Paste the JSON path when EAS Submit asks. Expo stores it server-side.

### Sanity check after submit

- Terminal prints **"Submitted to Google Play"**.
- Within minutes, Play Console → Hugh Manatee → **Testing → Internal testing → Releases** shows the new release **"Available on Google Play."**
- Testers who have accepted the opt-in link see the app available on their Play Store within ~10 min.

## After submission

| | iOS | Android |
|---|---|---|
| **Processing time before testers can install** | 10–30 min (internal) | ~5–10 min |
| **Review required for internal track?** | No | No |
| **Review required for external tester links?** | Yes — Apple Beta App Review, 24–48h first time | No for Internal/Closed; Yes for Open Testing |
| **Production App Store review** | 24–72h typical | A few hours to a few days |

## Ongoing workflow (after first time)

Day-to-day it boils down to:

```bash
cd /Users/mattwright/pandora/lifebook/app
npx eas-cli build --platform all --profile preview    # or --platform ios / android
npx eas-cli submit --platform all --latest
```

`--latest` tells Submit to use the most recent successful build without prompting.

## What is human-only vs. automatable

| Step | Who |
|---|---|
| `eas login`, `eas init`, `eas build:configure` | Matt first time |
| First `eas build` (chooses credentials) | Matt first time (interactive) |
| Back up Android keystore | Matt (one-time) |
| Generate App Store Connect API key + Play service account | Matt (one-time, involves external consoles) |
| Subsequent `eas build` + `eas submit` | **CLI agent can run these non-interactively** once credentials are saved |
| Bumping version + build number in `app.json` before each build | CLI agent (with the release script) |
| Reviewing build failures | Matt (judgment) or CLI agent (for common failures: bundle id mismatch, missing native module, version collision) |

## Common first-build failures and fixes

- **"No bundle identifier for iOS configured."** → add `ios.bundleIdentifier: "com.beyondpandora.hughmanatee"` to `app.json`.
- **"Build version X has already been used."** → bump `ios.buildNumber` (iOS) or `android.versionCode` (Android) in `app.json`. Apple rejects duplicate build numbers even for failed uploads.
- **"Invalid signing certificate."** → run `npx eas-cli credentials` and regenerate. Usually happens after the Apple cert expires (yearly).
- **Android build fails on SDK mismatch** → upgrade Expo SDK, or set `compileSdkVersion` explicitly in `eas.json`.

## Next

Once you have a working TestFlight build and Play Internal build, the last piece is the voice/AI backend — see [[04-elevenlabs-setup]].
