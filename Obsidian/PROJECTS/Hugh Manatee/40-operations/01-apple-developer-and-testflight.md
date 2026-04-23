# 01 — Apple Developer + TestFlight (first-timer walkthrough)

Audience: Matt, first iOS release. Technically confident but brand new to Apple Developer Program and App Store Connect.

## Before you start

You will need:

- An **Apple ID** you control (ideally a long-lived personal or role account — not a throwaway).
- **Two-factor authentication enabled** on that Apple ID. Enable it at `https://appleid.apple.com` → Sign-In and Security → Two-Factor Authentication. Apple will refuse enrollment without this.
- A **credit card** that matches the name / billing address on the Apple ID.
- **~2 hours of attention spread across 1–3 calendar days.** The clicking is fast. The waiting is not.
- (Organization path only) A **D-U-N-S number** for "Beyond Pandora." Free to request from Dun & Bradstreet, but takes 1–14 business days.

### Money costs upfront

- **$99/year** Apple Developer Program membership. Auto-renews unless cancelled.
- TestFlight distribution is **free** once you are enrolled.
- App review: **free**.

### Time costs upfront

- Enrollment clicking: **~30 min**.
- Apple identity verification: **1–3 business days** (individual) / **3–7 business days** (organization).
- First TestFlight build to tester inbox: **~1 hour** once the account is live (most of that is the build).
- First App Store review (if/when you submit publicly): **24–72 hours** typically, longer for voice AI apps.

## Option A vs Option B — pick your account type

| | Option A: Individual | Option B: Organization |
|---|---|---|
| Seller name shown in App Store | "Matt Wright" | "Beyond Pandora" |
| Needs D-U-N-S? | No | Yes |
| Needs legal entity verification? | No | Yes |
| Time to approval | 1–3 business days | 3–7 business days (sometimes weeks) |
| Cost | $99/yr | $99/yr |
| Can switch later? | Yes — migrate to org when ready | N/A |

**Recommendation: start Option A for MVP and TestFlight.** You can beta test, collect feedback, and iterate. Migrate to an Organization account before the first public App Store listing if you want "Beyond Pandora" to be the public seller name. Apple supports account transfer; the app record migrates with you.

## Step-by-step Apple Developer enrollment

1. Open `https://developer.apple.com/programs/enroll/` in a browser.
2. Click **Start Your Enrollment** (bottom of page).
3. Sign in with your Apple ID. If prompted for 2FA, approve the push.
4. Choose **Individual / Sole Proprietor** (Option A) or **Organization** (Option B).
5. Fill in your legal name and address exactly as they appear on government ID. Apple cross-checks this.
6. For Organization: enter the D-U-N-S number and legal entity name. Apple contacts D&B to verify.
7. Review the Apple Developer Program License Agreement. Scroll to the bottom, tick the box, **Continue**.
8. Pay **$99** (card or Apple Pay). You will see an order confirmation screen.
9. Close the browser. Apple now emails you when verification completes.

### Sanity check

You should now see an email titled **"Your enrollment is being processed"** from `developer@apple.com`. If you do not see this within 10 minutes, check spam, then sign back in to `https://developer.apple.com/account` — it will show your enrollment status.

## Wait state — what "pending review" looks like

- `https://developer.apple.com/account` will say **"We are reviewing your enrollment."**
- No action required from you unless Apple emails asking for documentation (more common for Organization enrollments).
- **If it stalls past 5 business days** (individual) or **10 business days** (organization): call Apple Developer Support at `https://developer.apple.com/contact/` → Enrollment. Phone is faster than email. Have your enrollment ID ready (in the confirmation email).
- **Common stall reason:** name on credit card does not exactly match name on Apple ID. Fix the Apple ID side (at `appleid.apple.com`), then reply to their email.

### Sanity check — approval

You should now receive an email **"Welcome to the Apple Developer Program."** You can also sign in to `https://developer.apple.com/account` and see no "pending" banner.

## Once approved — sign in to App Store Connect

1. Open `https://appstoreconnect.apple.com`.
2. Sign in with the same Apple ID you enrolled with.
3. Accept the App Store Connect agreement (one-time click-through).
4. Fill in **Agreements, Tax, and Banking** (left sidebar → Business → Agreements, Tax, and Banking). You can skip tax/banking if the app is free (Hugh Manatee v1 is free), but the Paid Apps agreement must be signed before you can ever charge money. Leave it for now.

### Sanity check

You should now see **My Apps** in the top nav at `appstoreconnect.apple.com`. If not, your agreement acceptance didn't save — re-accept.

## Pre-register the Bundle ID (before creating the app record)

App Store Connect will reject a new app if the bundle ID is not pre-registered in the Developer portal.

1. Open `https://developer.apple.com/account/resources/identifiers/list`.
2. Click the blue **+** next to "Identifiers."
3. Select **App IDs** → Continue → **App** → Continue.
4. **Description:** `Hugh Manatee`
5. **Bundle ID:** `Explicit` → `com.beyondpandora.hughmanatee`
6. **Capabilities:** leave defaults for now. You will add things like Push Notifications, Sign in with Apple, Associated Domains later as needed. For TestFlight MVP, defaults are fine.
7. Click **Continue** → **Register**.

### Sanity check

You should now see `com.beyondpandora.hughmanatee` listed at `https://developer.apple.com/account/resources/identifiers/list`.

## Create the app record in App Store Connect

1. Open `https://appstoreconnect.apple.com/apps`.
2. Click the blue **+** → **New App**.
3. Fill in:
   - **Platforms:** tick `iOS`
   - **Name:** `Hugh Manatee`
   - **Primary Language:** `English (U.S.)`
   - **Bundle ID:** pick `com.beyondpandora.hughmanatee` from the dropdown (appears because you registered it above)
   - **SKU:** `hughmanatee001` (internal only, never shown; must be unique across your account)
   - **User Access:** Full Access
4. Click **Create**.

### Sanity check

You should now see **Hugh Manatee** in your My Apps list. Clicking it shows tabs: App Store, TestFlight, Services, Distribution.

## TestFlight — concept

TestFlight is Apple's free beta distribution tool, bundled with Developer Program membership.

- **Internal Testing:** up to **100 testers** who are members of your App Store Connect team. No Apple review required. Builds appear within minutes of upload. This is what you use for daily-driver dogfooding.
- **External Testing:** up to **10,000 testers** by email or public link. **Requires a "Beta App Review" from Apple** (lighter than full App Store review, usually 24–48h, first time per build).
- Builds expire after **90 days** — testers get nudged to update.

For MVP you only care about **Internal Testing**.

The actual upload happens via EAS Submit — see [[03-eas-build-and-submit]]. This runbook just covers the App Store Connect side.

## Add internal testers

1. Open `https://appstoreconnect.apple.com` → **Users and Access** (top nav).
2. Click **+** next to the user list.
3. For each tester: enter first name, last name, **Apple ID email** (must be a real Apple ID they own).
4. **Role:** `Developer` is enough for TestFlight access. `Admin` only for co-owners.
5. Tick **Access to Certificates, Identifiers & Profiles** only for people who need to sign builds locally. For pure TestFlight testers, leave it off.
6. Click **Invite**. They get an email from Apple. They must accept before they appear in TestFlight.

### Sanity check

The tester's status changes from **"Invited"** to **"Active"** in Users and Access once they accept.

## Create the Internal Testing group

1. Open your app in App Store Connect → **TestFlight** tab → left sidebar **Internal Testing**.
2. Click **+** next to "Internal Testing."
3. Name the group: `Hugh Manatee Internal`.
4. Add the testers you invited above (pick from the list — they must already be Active).
5. Tick **Enable automatic distribution** so new builds auto-push to this group without you manually approving each one.
6. Save.

Once a build is uploaded and has finished Apple's automated processing (**~10–30 min** after upload), the testers get a push notification from the **TestFlight iOS app** (they install it from the App Store — one-time) and can install Hugh Manatee from there.

### Sanity check after the first real build lands

- Group shows **1 build** with a green "Ready to Test" status.
- Testers see Hugh Manatee in their TestFlight app on their iPhone.

## What Apple review is actually like (honest)

For **external TestFlight** and full **App Store submission**, Apple reviews the build. First-time apps commonly bounce on:

- **Guideline 2.1 — App Completeness.** Metadata gaps. Fix: fill every field in App Store Connect including screenshots at required sizes, app description, keywords, support URL, marketing URL (optional), privacy policy URL (**required** for any app that handles user data — Hugh Manatee does, so this is non-optional).
- **Guideline 5.1.1 — Privacy.** Missing privacy nutrition label answers, missing privacy policy, or privacy policy that contradicts the nutrition label. Fix: nutrition label and policy must agree.
- **Voice AI specifically:** expect scrutiny on (a) what is recorded, (b) where it goes, (c) how long it is retained, (d) whether the user can delete it. Have a clean answer ready for each.

**Budget 1 resubmission.** It is normal. Apple's rejection emails are specific — read them carefully and reply in Resolution Center with a clear explanation of what you changed.

Hugh-Manatee-specific risk: we stream audio to ElevenLabs for Conversational AI. That is a third-party data flow we **must** declare. See next section.

## Privacy nutrition label — fill this in BEFORE submitting

Open your app in App Store Connect → **App Privacy** (left sidebar on the App Store tab) → **Get Started**.

Apple asks: "Do you or your third-party partners collect data from this app?" — **answer Yes.** Even though v1 stores nothing server-side, ElevenLabs processes audio in-flight to generate the AI responses. That counts as collection under Apple's definition.

Declarations for Hugh Manatee v1:

| Data Type | Collected? | Linked to user? | Used for tracking? | Purposes | Notes |
|---|---|---|---|---|---|
| **Audio Data** (user voice) | Yes | No | No | App Functionality | Streamed to ElevenLabs during session. Not stored by Hugh Manatee. Not stored by ElevenLabs when retention is set to 0. Declare as **third-party data used**. |
| **User Content — other audio files** | No | — | — | — | We only collect live voice, not uploaded files |
| **Diagnostics — crash data** | Yes (if Sentry/Expo diagnostics on) | No | No | App Functionality | Confirm before submitting whether Expo crash reporting is enabled in production build |
| **Identifiers** | No | — | — | — | No accounts, no device ID upload in v1 |
| **Contact Info** | No | — | — | — | No email, no phone, no name server-side |
| **Location** | No | — | — | — | Not used |
| **Contacts / Photos / Health / Financial** | No | — | — | — | Not touched |

**Third-party partner section:** declare **ElevenLabs** as a third-party that receives Audio Data for the purpose of providing the conversational AI service.

### Sanity check

The App Privacy section shows a green tick and at least one data type listed. Contradictions between this and your privacy policy (on your support website) are the #1 rejection reason for voice apps. Make them match word for word.

## What is human-only vs. automatable later

| Step | Who |
|---|---|
| Apple ID + 2FA setup | Matt (human — identity) |
| Developer Program enrollment + $99 payment | Matt (human — legal agreement + card) |
| D-U-N-S request (if Option B) | Matt (human) |
| Bundle ID pre-registration | Matt first time, then **CLI agent can automate via `fastlane produce` or App Store Connect API for future apps** |
| App record creation | Matt first time, **CLI agent can automate for future apps** |
| Tester invites | Matt or CLI agent (API supports this) |
| Internal testing group + auto-distribution toggle | Matt or CLI agent |
| Build upload | **CLI agent via EAS Submit** — see [[03-eas-build-and-submit]] |
| Privacy nutrition label answers | Matt (policy decision, not automatable) |
| Review response in Resolution Center | Matt (human judgment) |

## Next

Once you have the Apple Developer account approved, the app record created, and at least one internal tester invited: proceed to [[03-eas-build-and-submit]] to produce and upload the first build.
