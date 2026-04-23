# CloudKit Schema Configuration

## Container Setup

### Container Identifier
`iCloud.com.tenshimatt.memoirguide`

### Environment
- Development (for testing)
- Production (for App Store)

## Record Types

### 1. MemoirSession

**Purpose:** Tracks recording sessions

| Field | Type | Required | Indexed | Description |
|-------|------|----------|---------|-------------|
| startTime | Date/Time | Yes | Yes | When session started |
| status | String | Yes | No | active/paused/complete |
| totalWordCount | Int64 | No | No | Total words recorded |
| lastActiveDate | Date/Time | Yes | Yes | Last activity time |
| currentChapterID | String | No | No | Current chapter reference |

**Indexes:**
- `lastActiveDate` (SORTABLE)
- `startTime` (SORTABLE)

### 2. MemoirSegment

**Purpose:** Individual recording segments (30-second chunks)

| Field | Type | Required | Indexed | Description |
|-------|------|----------|---------|-------------|
| transcription | String | Yes | No | Transcribed text |
| aiPrompt | String | No | No | AI prompt that triggered |
| timestamp | Date/Time | Yes | Yes | Recording time |
| duration | Double | Yes | No | Length in seconds |
| audioFile | Asset | No | No | Audio file reference |
| chapterID | String | No | Yes | Chapter reference |
| people | String List | No | No | Detected people names |
| places | String List | No | No | Detected place names |
| dates | String List | No | No | Detected dates |
| emotions | String List | No | No | Detected emotions |

**Indexes:**
- `timestamp` (SORTABLE)
- `chapterID` (QUERYABLE)

### 3. Chapter

**Purpose:** Organized story chapters

| Field | Type | Required | Indexed | Description |
|-------|------|----------|---------|-------------|
| title | String | Yes | Yes | Chapter title |
| segments | String List | No | No | Segment IDs |
| summary | String | No | No | AI-generated summary |
| orderIndex | Int64 | Yes | Yes | Display order |
| timelineDates | Date/Time List | No | No | Important dates |

**Indexes:**
- `orderIndex` (SORTABLE)
- `title` (QUERYABLE)

## Security Roles

### Owner (Default)
- Full read/write access to own records
- Cannot access other users' records

### Family Sharing
- Read-only access to shared records
- Configured through iOS Family Sharing

## Subscriptions

### Segment Updates
```swift
let subscription = CKQuerySubscription(
    recordType: "MemoirSegment",
    predicate: NSPredicate(value: true),
    options: [.firesOnRecordCreation, .firesOnRecordUpdate]
)
```

### Push Notifications
- Silent notifications for background sync
- Alert notifications for family shares

## CloudKit Dashboard Setup

### Step 1: Access Dashboard
1. Go to https://icloud.developer.apple.com
2. Sign in with Apple Developer account
3. Select "CloudKit Database"

### Step 2: Create Container
1. Click "Create Container"
2. Enter: `iCloud.com.tenshimatt.memoirguide`
3. Select "Create"

### Step 3: Create Schema
1. Select "Schema" → "Record Types"
2. Click "+" to add new type
3. Create each record type above
4. Add fields with exact names and types

### Step 4: Configure Indexes
1. Select each record type
2. Go to "Indexes" tab
3. Add indexes as specified above

### Step 5: Deploy to Production
1. Select "Deploy Schema Changes"
2. Choose fields to deploy
3. Confirm deployment

## Data Limits

### CloudKit Free Tier
- Storage: 10GB per user
- Transfer: 2GB/month
- Requests: 40 requests/second

### Record Limits
- Max record size: 1MB
- Max asset size: 50MB
- Max records per query: 400

### Audio Storage Strategy
- Compress audio to m4a format
- Target: ~1MB per minute
- Archive old recordings after 90 days

## Migration Strategy

### Schema Updates
1. Always add new fields as optional
2. Never delete fields in production
3. Use versioning for breaking changes

### Backup Strategy
1. Export to local Core Data
2. Backup to iCloud Drive
3. Export as JSON archive

## Error Handling

### Common Errors

#### CKError.networkUnavailable
```swift
// Queue for offline sync
offlineQueue.append(record)
```

#### CKError.quotaExceeded
```swift
// Alert user, offer cleanup
showStorageFullAlert()
```

#### CKError.unknownItem
```swift
// Record doesn't exist, create new
createNewRecord()
```

## Testing

### Development Environment
1. Use Development container
2. Test with multiple iCloud accounts
3. Simulate network conditions

### Test Cases
- [ ] Create new session
- [ ] Save segment
- [ ] Sync across devices
- [ ] Offline queue
- [ ] Family sharing
- [ ] Export data

## Monitoring

### CloudKit Dashboard Metrics
- Request rate
- Storage usage
- Error rate
- Active users

### In-App Analytics
- Sync success rate
- Average segment size
- Session duration
- Chapter count

## Support

CloudKit Issues:
- Apple Developer Forums
- CloudKit Documentation
- Technical Support Incidents (TSI)

<!-- OPENCLAW_TRELLO_CONTEXT:START -->
## Trello Integration Context
- Last inject: 2026-02-17 00:02 GMT+2
- Trello crawl status: pending valid API key+token (current key returned `invalid key`)
- Master sync note: [[openclaw/TRELLO_SYNC]]
<!-- OPENCLAW_TRELLO_CONTEXT:END -->

