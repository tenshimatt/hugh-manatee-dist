# 02 — Google Play Console (first-timer walkthrough)

Audience: Matt, first Android release. Never used Play Console.

## Before you start

You will need:

- A **Google account** you control (Workspace or personal both work).
- **Two-factor auth enabled** on that Google account. Check at `https://myaccount.google.com/security`.
- A **credit/debit card** for the $25 fee.
- **Government-issued photo ID.** Google now requires identity verification for all new developer accounts (introduced late 2023). They check the ID against the name on your account.
- **~1 hour of clicking**, spread across 1–2 days.

### Money costs upfront

- **$25 one-time** developer registration. No annual renewal (unlike Apple).
- Internal Testing distribution is **free**.
- Play review: **free**.

### Time costs upfront

- Registration clicking: **~30 min**.
- Identity verification: **typically 1–2 business days** for individuals. Can stretch to a week in edge cases.
- First internal track build to tester device: **~30 min** once approved.
- Full Play Store review (if/when you go public): **a few hours to a few days**; usually faster than Apple.

## Sign up

1. Open `https://play.google.com/console/signup`.
2. Sign in with the Google account you want to own this app.
3. Choose account type:
   - **Yourself (individual)** — recommended for MVP. Account shows "Matt Wright" as developer.
   - **An organization** — requires business verification, D-U-N-S or similar. More time.
4. Accept the Google Play Developer Distribution Agreement. Scroll fully, tick box.
5. Pay **$25** (card).
6. **Identity verification:** upload a photo of your government ID (driver's license or passport). Google emails when verified.

### Sanity check

You should now see a confirmation page **"Your account is being reviewed."** Email from `googleplay-developer-support@google.com` follows within 24h.

## Wait state

- While pending, you **cannot create apps** but you can browse the Play Console UI.
- If verification stalls past 5 business days: open the **Help** icon (top-right of Play Console) → Contact support. Google's phone line is not available for free accounts; email is the only channel.

### Sanity check — approval

Email subject **"Your Google Play Developer account is verified."** Play Console now shows **Create app** as an active button.

## Create the app

1. Open `https://play.google.com/console`.
2. Click **Create app** (top-right).
3. Fill in:
   - **App name:** `Hugh Manatee`
   - **Default language:** `English – United States (en-US)`
   - **App or game:** `App`
   - **Free or paid:** `Free`
   - Tick both declarations: **Developer Program Policies** and **US export laws**.
4. Click **Create app**.

### Sanity check

You should now see the Play Console dashboard with a task list titled **"Set up your app"** — about 10 mandatory items. You cannot upload a build until enough of these are green.

## Pre-launch declarations (mandatory before any upload)

Work through every row in **Dashboard → Set up your app**. Most are 3-minute questionnaires. Hugh Manatee answers:

### App access

- Is any part of your app gated behind login? **No** (v1 is local-only, no account).

### Ads

- Does your app contain ads? **No**.

### Content rating

1. Click **Start questionnaire**.
2. Email: your Play account email.
3. Category: **Utility, Productivity, Communication, or Other**.
4. Answer every question. Hugh Manatee: no violence, no sex, no drugs, no gambling, no user-generated content shared publicly (v1), no location sharing, no unrestricted internet access exposed to the user.
5. Submit. Rating is calculated instantly.

### Target audience and content

- **Target age groups:** `13–15`, `16–17`, `18+` (Hugh's primary users are elderly, but minimum target is 13+ to avoid COPPA/kids-category rules).
- Do children use this app? **No**.

### News app

- Is this a news app? **No**.

### COVID-19 contact tracing / status

- **No**.

### Data safety

This is Google's equivalent of Apple's Privacy Nutrition Label. It is a **separate form** with overlapping but not identical questions. Answers must agree with the Apple version (see [[01-apple-developer-and-testflight]]).

Fill in:

- **Does your app collect or share any of the required user data types?** **Yes.**
- **Audio files:** Collected? **Yes.** Shared? **Yes** (with ElevenLabs). Purpose: App functionality. Is this data collection required or optional? **Required** (app doesn't work without voice). Is the data processed ephemerally? **Yes** (not stored server-side by Hugh Manatee). Is the data encrypted in transit? **Yes** (TLS).
- **Personal info, financial info, location, messages, photos, contacts, calendar, health, etc.:** **Not collected.**
- **Crash logs / diagnostics:** declare if Expo/Sentry is enabled in production.
- **Data deletion:** provide a URL where users can request deletion. For Hugh Manatee v1 this is `https://<your-site>/privacy#delete` — content-wise, "all data lives on your device; uninstall the app to delete it." Even though there's no server, Google requires a URL.

### Government apps

- **No**.

### Privacy policy URL

- **Required.** Hugh Manatee privacy policy must be hosted at a stable URL. Simplest: GitHub Pages or a plain static page on `beyondpandora.com`. Paste the URL here. Must be reachable without login.

### Sanity check

**Dashboard → Set up your app** shows all mandatory items green. The **Production** track card becomes clickable (though you won't use Production yet).

## Internal Testing track (equivalent of Apple TestFlight internal)

Internal Testing is the Android equivalent of TestFlight Internal: up to **100 testers**, no Play review required, builds go live within **a few minutes** of upload.

1. Play Console → left sidebar **Testing → Internal testing**.
2. **Testers tab** → **Create email list**.
3. Name the list: `Hugh Manatee Internal`.
4. Add tester emails (comma-separated). They must be the **Google account emails** the testers will use to install (usually their primary Gmail).
5. Save.
6. Tick **Copy link** at the bottom — this is the opt-in URL you send to testers. They click it, tap **Become a tester**, then get Hugh Manatee available in the Play Store on any device signed in with that account.

The actual build upload happens via EAS Submit — see [[03-eas-build-and-submit]].

### Sanity check after first build

- **Releases tab** in Internal Testing shows 1 release with status **"Available on Google Play"**.
- Testers can install within a few minutes of release creation.

## Closed / Open Testing tracks (not needed for MVP)

- **Closed Testing:** like Internal but with unlimited testers and Google Play review is lighter. Useful once you outgrow 100 internal testers.
- **Open Testing:** public opt-in beta. Listing appears on the Play Store. Requires full Play review. Skip for MVP.

## Pre-launch report — free QA from Google

When you upload any build to any track, Google automatically runs it on a set of real physical devices in their lab for **~30 minutes** and emails you:

- Crash stack traces
- Screenshots on different screen sizes
- Performance issues
- Accessibility warnings
- Security warnings

This is free and extremely useful. You do nothing to opt in — it runs by default.

Find the report at: Play Console → your app → **Testing → Pre-launch report → Overview**.

### Sanity check

Within 1–2 hours of your first upload, the Pre-launch report tab shows test results. If it shows no results after 4 hours, check the build for obvious install failures.

## What is human-only vs. automatable later

| Step | Who |
|---|---|
| Google account + 2FA | Matt (human — identity) |
| Play Console registration + $25 + ID verification | Matt (human) |
| App creation | Matt first time, **CLI agent can use Play Developer API for future apps** |
| Pre-launch declarations | Matt (policy decisions — not automatable) |
| Data Safety form | Matt (policy — not automatable; must be kept in sync with Apple version manually) |
| Privacy policy URL | Matt (write once, host) |
| Internal testing list | Matt or **CLI agent via API** |
| Build upload | **CLI agent via EAS Submit** — see [[03-eas-build-and-submit]] |
| Pre-launch report review | Matt (human judgment on what to fix) |

## Next

Once the Play Console account is verified, the app record exists, all mandatory declarations are green, and the Internal Testing list has at least one tester: proceed to [[03-eas-build-and-submit]].
