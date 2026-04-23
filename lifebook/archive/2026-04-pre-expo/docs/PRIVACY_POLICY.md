# Privacy Policy for MemoirGuide

**Last Updated:** September 30, 2025
**Effective Date:** September 30, 2025

---

## Introduction

MemoirGuide ("we," "our," or "the app") is a memoir recording application designed to help elderly users capture and preserve their life stories through AI-guided conversations. This Privacy Policy explains how we collect, use, store, and protect your personal information.

**Your privacy is our highest priority.** MemoirGuide is built with a privacy-first architecture:
- All data stored locally on your device first
- Optional iCloud sync uses your private iCloud account
- No third-party data sharing
- No tracking or analytics
- No advertisements
- You own and control all your data

---

## Information We Collect

### 1. Audio Recordings
- **What:** Voice recordings you create through the app
- **Purpose:** Preserve your spoken memories
- **Storage:** Encrypted on your device in a secure directory with FileProtectionType.complete
- **Retention:** Until you delete them
- **Sharing:** Never shared with anyone except you

### 2. Transcriptions
- **What:** Text transcriptions of your audio recordings
- **How:** Generated on-device using Apple's Speech Recognition framework
- **Storage:** Encrypted in Core Data with FileProtectionType.complete
- **Retention:** Until you delete them
- **Sharing:** Never shared except via your explicit export/share actions

### 3. User Profile Information
- **What:** Your name, language preference, recording quality settings
- **Purpose:** Personalize your app experience
- **Storage:** Encrypted locally in Core Data
- **Retention:** Until you delete your profile
- **Sharing:** Never shared with third parties

### 4. Story Metadata
- **What:** Story titles, chapter organization, recording dates/times, word counts
- **Purpose:** Organize and display your memories
- **Storage:** Encrypted locally in Core Data
- **Retention:** Until you delete stories
- **Sharing:** Only when you explicitly share stories

### 5. iCloud Sync Data (Optional)
- **What:** All above data if you enable iCloud sync
- **Purpose:** Backup and sync across your devices
- **Storage:** Encrypted in your private iCloud account using Apple's CloudKit
- **Access:** Only accessible by you, not by us
- **Control:** Can be disabled in iOS Settings > iCloud

---

## Information We Do NOT Collect

We explicitly DO NOT collect:
- ❌ Usage analytics or telemetry
- ❌ Crash reports (unless you report via App Store)
- ❌ Device identifiers for tracking
- ❌ Location data
- ❌ Contacts or address book
- ❌ Photos or videos
- ❌ Health data (unless you voluntarily discuss it in recordings)
- ❌ Financial information
- ❌ Browsing history
- ❌ Any personally identifiable information beyond what you provide

---

## How We Use Your Information

We use your information solely for:

1. **Core Functionality**
   - Storing and playing back your recordings
   - Transcribing audio to text
   - Organizing stories into chapters
   - Syncing across your devices (if enabled)

2. **AI Story Generation** (Future Feature)
   - Using your transcriptions to generate narrative summaries
   - Processing happens on-device or via privacy-focused AI services
   - You control what gets processed

3. **App Improvement**
   - We do NOT collect usage data
   - Improvements based on user feedback only
   - No automated tracking or analytics

---

## Data Storage & Security

### Encryption at Rest
All data stored locally is protected with:
- **Core Data:** FileProtectionType.complete (iOS encryption)
- **Audio Files:** Stored in secure directory with FileProtectionType.complete
- **Access:** Data only accessible when device is unlocked
- **Protection:** Data encrypted with device passcode/biometrics

### Encryption in Transit
If using iCloud sync:
- Data transmitted over TLS/SSL (HTTPS)
- CloudKit provides end-to-end encryption
- Apple cannot access your data in meaningful form
- We cannot access your iCloud data

### Device Security
- App respects iOS security features
- Requires device passcode/biometrics to unlock device
- Data protected by iOS Secure Enclave (if available)
- No backdoors or special access methods

---

## Data Sharing & Disclosure

### We Never Share Your Data
We DO NOT:
- Sell your data to third parties
- Share data with advertisers
- Provide data to analytics companies
- Send data to external servers (except iCloud if you enable it)
- Use your data for marketing

### You Control Sharing
You can share your stories through:
- **Export Feature:** Share text or audio via iOS share sheet (Messages, Email, etc.)
- **Family Sharing:** (Future feature) Invite family members to view stories
- **Your Choice:** You explicitly initiate all sharing

### Legal Disclosures (Rare)
We may disclose information only if:
- Required by valid legal process (court order, subpoena)
- Necessary to protect rights, property, or safety
- With your explicit consent

**However:** Since all data is on your device or your iCloud, we typically have no access to provide.

---

## Your Rights & Controls

### Access Your Data
- All data visible within the app
- Stories, recordings, transcriptions accessible anytime
- Export feature provides complete data portability

### Delete Your Data
You have the right to delete:
1. **Individual Recordings:** Swipe to delete in app
2. **Entire Stories:** Delete from My Stories tab
3. **All Data:** Settings > Delete All Data (future feature)
4. **App Deletion:** Uninstalling app deletes local data

**iCloud Data:** Delete from iOS Settings > iCloud > Manage Storage > MemoirGuide

### Control iCloud Sync
- Enable/disable: iOS Settings > iCloud > MemoirGuide
- Delete cloud data: iOS Settings > iCloud > Manage Storage
- Local-only mode: Keep iCloud sync disabled

### Data Portability
- Export stories as text or audio files
- Share via standard iOS methods
- No proprietary lock-in formats
- Audio: Standard M4A format
- Text: Plain text or formatted documents

---

## Third-Party Services

### Apple Services
The app uses Apple's built-in services:

**Speech Recognition:**
- On-device transcription (default)
- Uses iOS Speech Recognition framework
- Processed locally on your device
- Apple's [privacy policy](https://www.apple.com/legal/privacy/)

**iCloud Sync (Optional):**
- Uses your private iCloud account
- Encrypted end-to-end
- Apple's [CloudKit privacy](https://support.apple.com/en-us/HT202303)

**Siri & Voice Control:**
- Standard iOS voice features
- Follows Apple's privacy standards

We do NOT use:
- Google Analytics
- Facebook SDK
- Amazon Web Services
- Any third-party tracking SDKs
- External AI services (processing is local)

---

## Children's Privacy

MemoirGuide is designed for **adults aged 65+** to record their life stories. The app is NOT directed at children under 13.

If a parent/guardian sets up the app for a child to interview an elderly relative:
- Parental consent required
- Child's voice may be recorded if participating in conversations
- Parents responsible for children's use
- Delete recordings if inappropriate

We do not knowingly collect information from children under 13 without parental consent.

---

## Health Information (HIPAA Considerations)

### Potential Protected Health Information (PHI)
If you discuss health topics in your recordings (medical history, medications, conditions), this becomes Protected Health Information under HIPAA.

### Our HIPAA Status
- **Covered Entity:** No (we are not healthcare providers)
- **Business Associate:** No (we don't process health data for covered entities)
- **Personal Health App:** Yes (like Apple Health, Fitness apps)

### Your Health Data
- Health discussions in recordings are **your personal data**
- Stored with same encryption as other data
- Not transmitted to healthcare providers
- Not shared with insurance companies
- Protected under general privacy law, not HIPAA

### Recommendations
If discussing sensitive health information:
1. Keep iCloud sync disabled for maximum privacy
2. Use device with strong passcode
3. Regularly backup data securely
4. Consider legal advice for estate planning with recordings

---

## California Privacy Rights (CCPA)

If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):

### Right to Know
- Categories of personal information collected: See "Information We Collect"
- Sources: You (via recordings and profile)
- Business purpose: App functionality as described
- Third parties: None

### Right to Delete
- Request deletion of personal information
- Method: Use in-app delete features or contact support
- We delete within 30 days of request

### Right to Opt-Out
- We do NOT sell personal information
- No opt-out needed as there's nothing to opt out of

### Non-Discrimination
- We do not discriminate based on privacy rights exercise

### Contact for CCPA Requests
Email: privacy@tenshimatt.com
Subject: "CCPA Privacy Request"

---

## European Union Privacy Rights (GDPR)

If you are in the EU/EEA, you have rights under the General Data Protection Regulation (GDPR):

### Legal Basis for Processing
- **Consent:** You consent to app functionality by using it
- **Contract:** Processing necessary to provide app services
- **Legitimate Interest:** Improving app based on feedback

### Your GDPR Rights
1. **Right to Access:** Export your data anytime
2. **Right to Rectification:** Edit stories and profile in app
3. **Right to Erasure:** Delete data as described above
4. **Right to Restrict Processing:** Disable iCloud sync
5. **Right to Data Portability:** Export feature provides this
6. **Right to Object:** Uninstall app or disable features
7. **Right to Withdraw Consent:** Delete data and uninstall

### Data Protection Officer
Contact: privacy@tenshimatt.com

### Supervisory Authority
You may lodge complaints with your local data protection authority.

---

## Data Retention

### Active Use
- Data retained as long as you use the app
- No automatic deletion
- You control retention through delete features

### Inactive Accounts
- No "accounts" - all data is local
- Data remains until device is wiped or app deleted

### Backups
- iCloud backups include app data (if enabled)
- Managed through iOS backup settings
- Delete via iOS Settings > iCloud > Manage Storage

### After App Deletion
- Local data deleted with app
- iCloud data persists until manually deleted
- iOS backups may retain data until overwritten

---

## International Data Transfers

### Primary Storage
- All data stored locally on your device
- Device location determines data location
- No cross-border transfers by us

### iCloud Sync
- If enabled, data stored in Apple's iCloud infrastructure
- Apple operates data centers worldwide
- Data location governed by your Apple ID country
- See Apple's [data transfer policies](https://www.apple.com/legal/privacy/en-ww/governance/)

### No Independent Servers
- We do not operate servers
- No backend infrastructure
- No data transfers to our control

---

## Changes to Privacy Policy

### Notification of Changes
We may update this Privacy Policy for:
- New features
- Legal requirements
- Clarifications

Changes announced via:
1. In-app notification
2. App Store update notes
3. Updated policy date at top of document

### Material Changes
For significant privacy changes:
- Prominent in-app notice
- Require consent before new data collection
- Option to decline and stop using new features

### Review Periodically
Check policy periodically at: [app settings or website URL]

---

## Contact Us

### Questions or Concerns
- Email: tenshimatt@mac.com
- Subject: "MemoirGuide Privacy Inquiry"
- Response time: Within 7 days

### Data Requests
- Access, deletion, correction requests
- CCPA or GDPR rights
- Contact via email above

### Support
- In-app: Settings > Help & Support
- Email: support@tenshimatt.com

### Developer Information
- Name: Matt Wright
- Email: tenshimatt@mac.com
- App Store: [Link to app listing]

---

## Consent

By using MemoirGuide, you consent to:
- This Privacy Policy
- Collection and use of information as described
- Storage of data on your device and optionally in iCloud

**You may withdraw consent by:**
- Deleting all data in Settings
- Uninstalling the app
- Disabling iCloud sync

---

## Summary (TL;DR)

✅ **What We Do:**
- Store your recordings securely on your device
- Encrypt everything with iOS security
- Let you optionally sync to your private iCloud
- Give you complete control over your data

❌ **What We DON'T Do:**
- Track you
- Sell your data
- Share with third parties
- Collect analytics
- Show ads

🔒 **Your Data is YOURS:**
- You own it
- You control it
- You can export it
- You can delete it anytime

---

**Questions?** Email: tenshimatt@mac.com

**Your memories. Your privacy. Your control.**

---

*This privacy policy applies to MemoirGuide iOS app version 1.0 and later. For previous versions, contact us for applicable policy.*

<!-- OPENCLAW_TRELLO_CONTEXT:START -->
## Trello Integration Context
- Last inject: 2026-02-17 00:02 GMT+2
- Trello crawl status: pending valid API key+token (current key returned `invalid key`)
- Master sync note: [[openclaw/TRELLO_SYNC]]
<!-- OPENCLAW_TRELLO_CONTEXT:END -->

