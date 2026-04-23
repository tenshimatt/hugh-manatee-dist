# 🎨 Complete Visual iOS Pipeline - Xcode Cloud Alternative

## 🚀 Full Capabilities We Can Build on Your CI Server

### Current Reality Check
**No Xcode service running on your Docker container (10.90.10.6)**
- Linux-based container cannot run native Xcode
- But we CAN build a powerful visual pipeline alternative

### What We CAN Build: Visual iOS Development Pipeline

## 1. 🖥️ macOS CI Runner Service (REQUIRED FOR REAL XCODE)

Since Xcode requires macOS, here are your options:

### Option A: Mac Mini CI Runner
```bash
# Add a Mac Mini to your network as CI runner
# Install on Mac Mini:
brew install --cask docker
brew install jenkins gitlab-runner

# Connect to your CI server:
gitlab-runner register \
  --url http://10.90.10.6:3000 \
  --token YOUR_RUNNER_TOKEN \
  --executor shell \
  --tag-list "ios,xcode,macos"
```

### Option B: MacStadium/AWS EC2 Mac
```bash
# Rent a Mac instance in the cloud
# MacStadium: $79/month for Mac Mini
# AWS EC2 Mac: ~$25/day for mac1.metal

# Connect cloud Mac to your CI:
ssh user@mac-instance.cloud
gitlab-runner install
gitlab-runner register --url http://10.90.10.6:3000
```

### Option C: Xcode Cloud Integration
```bash
# Use Apple's native Xcode Cloud ($15-100/month)
# Integrates with your existing Apple Developer account
# No infrastructure needed
```

## 2. 🎯 Visual n8n Workflow for App Packaging

### Access Your Visual Builder
```
http://10.90.10.6:5678
```

### Complete Visual Pipeline Nodes

**Input Node**: Webhook Trigger
- Receives: App specification, version, target device
- URL: `http://10.90.10.6:5678/webhook/build-ios-app`

**Process Nodes** (Visual drag-and-drop):
1. **Spec Parser** → Reads requirements
2. **Code Generator** → Creates Swift files
3. **Project Builder** → Generates Xcode project
4. **Asset Processor** → Icons, launch screens
5. **Dependency Manager** → Swift packages
6. **Configuration** → Info.plist, entitlements
7. **Archive Creator** → Build .xcarchive
8. **IPA Packager** → Export deployable app
9. **Code Signer** → Apply certificates
10. **TestFlight Uploader** → Beta distribution
11. **App Store Submitter** → Production release

**Output Node**: Status Dashboard
- Success/failure notifications
- Download links for IPA
- TestFlight invitation links
- App Store review status

## 3. 📱 App Store Publishing Pipeline (WITH YOUR ACCOUNT)

### Step 1: Configure Your Apple Credentials
```bash
ssh root@10.90.10.6
cat > /opt/lifebook-ci/apple-credentials.sh << 'EOF'
#!/bin/bash
# Your Apple Developer credentials
export APPLE_ID="your-apple-id@email.com"
export APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"  # Generate at appleid.apple.com
export TEAM_ID="XXXXXXXXXX"  # From developer.apple.com
export BUNDLE_ID="com.tenshimatt.memoirguide"
EOF
chmod 600 /opt/lifebook-ci/apple-credentials.sh
```

### Step 2: Create Automated Publishing Script
```bash
cat > /opt/lifebook-ci/publish-to-app-store.sh << 'EOF'
#!/bin/bash
source /opt/lifebook-ci/apple-credentials.sh

# Validate IPA
xcrun altool --validate-app \
  -f LifeBook.ipa \
  -u "$APPLE_ID" \
  -p "$APP_SPECIFIC_PASSWORD" \
  --output-format json

# Upload to App Store Connect
xcrun altool --upload-app \
  -f LifeBook.ipa \
  -u "$APPLE_ID" \
  -p "$APP_SPECIFIC_PASSWORD" \
  --output-format json

# Submit for Review (via App Store Connect API)
curl -X POST https://api.appstoreconnect.apple.com/v1/appStoreVersions \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"data":{"type":"appStoreVersions","attributes":{"platform":"IOS","versionString":"1.0"}}}'
EOF
```

## 4. 🎨 Visual Dashboard Interface

### Create Web UI for App Management
```bash
cat > /opt/lifebook-ci/visual-dashboard/index.html << 'HTML'
<!DOCTYPE html>
<html>
<head>
    <title>iOS App Pipeline Dashboard</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
        .pipeline { display: flex; gap: 20px; padding: 20px; }
        .stage {
            border: 2px solid #007AFF;
            border-radius: 10px;
            padding: 20px;
            min-width: 150px;
        }
        .stage.active { background: #E3F2FD; }
        .stage.complete { background: #C8E6C9; }
        button {
            background: #007AFF;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
        }
    </style>
</head>
<body>
    <h1>🚀 iOS App Publishing Pipeline</h1>

    <div class="pipeline">
        <div class="stage" id="build">
            <h3>1. Build</h3>
            <button onclick="triggerBuild()">Generate Xcode Project</button>
        </div>

        <div class="stage" id="package">
            <h3>2. Package</h3>
            <button onclick="packageIPA()">Create IPA</button>
        </div>

        <div class="stage" id="sign">
            <h3>3. Sign</h3>
            <button onclick="signApp()">Code Sign</button>
        </div>

        <div class="stage" id="test">
            <h3>4. TestFlight</h3>
            <button onclick="uploadTestFlight()">Upload Beta</button>
        </div>

        <div class="stage" id="publish">
            <h3>5. App Store</h3>
            <button onclick="publishAppStore()">Publish</button>
        </div>
    </div>

    <div id="status">
        <h2>Status</h2>
        <pre id="output"></pre>
    </div>

    <script>
        async function triggerBuild() {
            document.getElementById('build').classList.add('active');
            const response = await fetch('http://10.90.10.6:5678/webhook/build-ios-app', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({action: 'build'})
            });
            document.getElementById('output').textContent = await response.text();
            document.getElementById('build').classList.add('complete');
        }

        async function packageIPA() {
            document.getElementById('package').classList.add('active');
            // Trigger packaging webhook
        }

        async function signApp() {
            document.getElementById('sign').classList.add('active');
            // Trigger signing webhook
        }

        async function uploadTestFlight() {
            document.getElementById('test').classList.add('active');
            // Trigger TestFlight upload
        }

        async function publishAppStore() {
            document.getElementById('publish').classList.add('active');
            // Trigger App Store submission
        }
    </script>
</body>
</html>
HTML

# Serve dashboard on port 8085
docker run -d \
  --name ios-dashboard \
  -p 8085:80 \
  -v /opt/lifebook-ci/visual-dashboard:/usr/share/nginx/html \
  nginx:alpine

echo "📊 Dashboard available at: http://10.90.10.6:8085"
```

## 5. 🔗 Complete Integration with App Store Connect

### Using App Store Connect API
```bash
# Generate API Key at appstoreconnect.apple.com
# Users and Access > Keys > Generate API Key

cat > /opt/lifebook-ci/appstore-api.sh << 'EOF'
#!/bin/bash
# App Store Connect API Integration

API_KEY_ID="YOUR_KEY_ID"
ISSUER_ID="YOUR_ISSUER_ID"
PRIVATE_KEY_PATH="/opt/lifebook-ci/AuthKey_YOUR_KEY.p8"

# Generate JWT token
generate_jwt() {
    # Implementation for JWT generation
    echo "JWT_TOKEN_HERE"
}

# List all apps
list_apps() {
    curl -X GET "https://api.appstoreconnect.apple.com/v1/apps" \
      -H "Authorization: Bearer $(generate_jwt)"
}

# Create new version
create_version() {
    curl -X POST "https://api.appstoreconnect.apple.com/v1/appStoreVersions" \
      -H "Authorization: Bearer $(generate_jwt)" \
      -H "Content-Type: application/json" \
      -d '{"data":{"type":"appStoreVersions","attributes":{"versionString":"1.0.1","platform":"IOS"}}}'
}

# Submit for review
submit_for_review() {
    curl -X POST "https://api.appstoreconnect.apple.com/v1/appStoreVersionSubmissions" \
      -H "Authorization: Bearer $(generate_jwt)" \
      -H "Content-Type: application/json" \
      -d '{"data":{"type":"appStoreVersionSubmissions"}}'
}
EOF
```

## 6. 🎯 What You Need to Add for Full Xcode Capabilities

### Required: macOS Environment
Since you want real Xcode capabilities, you need ONE of these:

1. **Local Mac Mini** ($599-899)
   - Connect to your network
   - Install Xcode from App Store
   - Register as GitLab runner
   - Full native iOS builds

2. **Cloud Mac Service** ($79-199/month)
   - MacStadium, AWS EC2 Mac, MacinCloud
   - Xcode pre-installed
   - API access from your CI

3. **GitHub Actions with macOS** (Free for public repos)
   - Use GitHub's Mac runners
   - Integrate with your workflow

### Visual Workflow Access Points

**n8n Visual Builder**: http://10.90.10.6:5678
- Drag-and-drop workflow creation
- Connect all pipeline stages
- Real-time execution monitoring

**Jenkins Blue Ocean**: http://10.90.10.6:3001/blue
- Visual pipeline editor
- Stage-by-stage progress
- Build history visualization

**GitLab CI/CD**: http://10.90.10.6:3000/-/pipelines
- Pipeline graphs
- Job dependencies
- Merge request integration

**Custom Dashboard**: http://10.90.10.6:8085
- One-click deployment buttons
- Real-time status updates
- Download links for built apps

## 7. 📱 Complete App Store Publishing Process

With your Apple Developer account ready:

### Automated Publishing Pipeline
```bash
# 1. Build IPA with proper signing
./build-and-sign.sh

# 2. Validate with Apple
xcrun altool --validate-app -f LifeBook.ipa

# 3. Upload to App Store Connect
xcrun altool --upload-app -f LifeBook.ipa

# 4. Submit for Review via API
./submit-for-review.sh

# 5. Monitor review status
./check-review-status.sh
```

### Visual Status Dashboard
Access http://10.90.10.6:8085 to see:
- ✅ Build status
- ✅ Signing status
- ✅ Upload progress
- ✅ Review status
- ✅ Live on App Store indicator

## 🎯 Immediate Next Steps

1. **Set up Mac environment** (choose option above)
2. **Configure Apple credentials** in CI pipeline
3. **Import visual workflow** to n8n
4. **Access dashboard** at http://10.90.10.6:8085
5. **Click "Build"** to start pipeline

---

**Bottom Line**: You need a Mac somewhere (local, cloud, or service) for real Xcode. Your CI server orchestrates everything visually, but actual iOS builds require macOS.

<!-- OPENCLAW_TRELLO_CONTEXT:START -->
## Trello Integration Context
- Last inject: 2026-02-17 00:02 GMT+2
- Trello crawl status: pending valid API key+token (current key returned `invalid key`)
- Master sync note: [[openclaw/TRELLO_SYNC]]
<!-- OPENCLAW_TRELLO_CONTEXT:END -->

