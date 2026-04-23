# Quickstart Guide: Technical Specification System

**Feature**: 003-create-a-comprehensive  
**Phase**: Phase 1 Test Scenarios  
**Date**: 2025-09-11

## Test Environment Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Elasticsearch 8+
- AWS S3 access (for exports)

### Quick Start Commands
```bash
# Install dependencies
npm install

# Setup database
npm run db:setup
npm run db:migrate
npm run db:seed

# Start services
npm run dev:backend    # Port 3001
npm run dev:frontend   # Port 3000
npm run dev:search     # Elasticsearch
npm run dev:cache      # Redis

# Run tests
npm run test           # All tests
npm run test:contract  # API contract tests
npm run test:e2e      # End-to-end tests
```

## Core User Scenarios

### Scenario 1: Document Creation and Content Generation
**Objective**: Verify new document creation with automated content generation

**Steps**:
1. **Login** as editor user
   ```bash
   curl -X POST http://localhost:3001/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "editor@test.com", "password": "test123"}'
   ```

2. **Create new document** from template
   ```bash
   curl -X POST http://localhost:3001/api/v1/documents \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "API Documentation Specification",
       "templateId": "technical-spec-template",
       "metadata": {"targetWordCount": 50000}
     }'
   ```

3. **Verify document structure** created
   ```bash
   curl -X GET http://localhost:3001/api/v1/documents/$DOC_ID/sections \
     -H "Authorization: Bearer $TOKEN"
   ```

**Expected Results**:
- Document created with UUID identifier
- Template structure applied (Introduction, Requirements, Architecture, etc.)
- Initial sections created with placeholder content
- Word count tracking initialized
- Document status = "draft"

### Scenario 2: Real-time Collaborative Editing
**Objective**: Verify multiple users can edit same document simultaneously

**Steps**:
1. **User A joins document** editing session
   ```javascript
   const socketA = io('http://localhost:3001', {
     auth: { token: 'bearer-token-user-a' }
   });
   socketA.emit('join_document', { documentId: 'doc-123' });
   ```

2. **User B joins same document**
   ```javascript
   const socketB = io('http://localhost:3001', {
     auth: { token: 'bearer-token-user-b' }
   });
   socketB.emit('join_document', { documentId: 'doc-123' });
   ```

3. **User A makes text edit**
   ```javascript
   socketA.emit('text_operation', {
     documentId: 'doc-123',
     sectionId: 'intro-section',
     operation: {
       type: 'insert',
       position: 100,
       content: 'This system provides comprehensive documentation management.',
       author: 'user-a-uuid'
     }
   });
   ```

4. **User B receives operation** and makes concurrent edit
   ```javascript
   // User B should receive User A's operation
   socketB.on('text_operation', (data) => {
     // Verify User A's edit received
   });

   // User B makes concurrent edit
   socketB.emit('text_operation', {
     documentId: 'doc-123',
     sectionId: 'intro-section',
     operation: {
       type: 'insert',
       position: 200,
       content: 'Features include real-time collaboration and export capabilities.',
       author: 'user-b-uuid'
     }
   });
   ```

**Expected Results**:
- Both users see each other in active users list
- Text operations synchronized in real-time (<500ms)
- No conflicts for non-overlapping edits
- Cursor positions visible between users
- Document word count updates automatically

### Scenario 3: Document Export to Multiple Formats
**Objective**: Verify export functionality for PDF, HTML, Markdown, and Word formats

**Steps**:
1. **Create comprehensive test document** (>10,000 words)
   ```bash
   # Use seeded test document with complex structure
   DOC_ID="test-comprehensive-doc-uuid"
   ```

2. **Export to PDF**
   ```bash
   curl -X POST http://localhost:3001/api/v1/documents/$DOC_ID/export \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "format": "pdf",
       "parameters": {
         "includeTableOfContents": true,
         "pageSize": "A4",
         "margins": "normal"
       }
     }'
   ```

3. **Export to HTML**
   ```bash
   curl -X POST http://localhost:3001/api/v1/documents/$DOC_ID/export \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "format": "html",
       "parameters": {
         "includeStyles": true,
         "embedImages": true
       }
     }'
   ```

4. **Check export status**
   ```bash
   curl -X GET http://localhost:3001/api/v1/exports/$EXPORT_ID \
     -H "Authorization: Bearer $TOKEN"
   ```

5. **Download completed exports**
   ```bash
   # PDF should be available at S3 URL
   # HTML should be packaged with assets
   # Verify file sizes and format integrity
   ```

**Expected Results**:
- All four formats export successfully
- PDF preserves document structure and formatting
- HTML maintains responsive layout
- Markdown preserves hierarchical structure
- Word document supports editing and comments
- Export queue processes requests efficiently

### Scenario 4: Full-Text Search and Navigation
**Objective**: Verify search functionality across large documents

**Steps**:
1. **Index test documents** in Elasticsearch
   ```bash
   # Ensure test documents are indexed
   curl -X GET http://localhost:9200/documents/_search?q=*
   ```

2. **Perform text search**
   ```bash
   curl -X GET "http://localhost:3001/api/v1/search?q=authentication%20requirements" \
     -H "Authorization: Bearer $TOKEN"
   ```

3. **Search with filters**
   ```bash
   curl -X GET "http://localhost:3001/api/v1/search?q=database&filters={\"status\":\"published\",\"wordCount\":{\"gte\":10000}}" \
     -H "Authorization: Bearer $TOKEN"
   ```

4. **Verify hierarchical navigation**
   ```bash
   curl -X GET http://localhost:3001/api/v1/documents/$DOC_ID/sections?level=2 \
     -H "Authorization: Bearer $TOKEN"
   ```

**Expected Results**:
- Search returns relevant results with highlights
- Response time <500ms for complex queries
- Filters work correctly (status, word count, date ranges)
- Section navigation preserves hierarchy
- Search supports technical terminology and code snippets

### Scenario 5: Version Control Integration
**Objective**: Verify document versioning and Git integration

**Steps**:
1. **Create document version**
   ```bash
   curl -X POST http://localhost:3001/api/v1/documents/$DOC_ID/versions \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "versionNumber": "1.1.0",
       "changeDescription": "Added authentication requirements section",
       "tags": ["feature-auth", "v1.1"]
     }'
   ```

2. **List document versions**
   ```bash
   curl -X GET http://localhost:3001/api/v1/documents/$DOC_ID/versions \
     -H "Authorization: Bearer $TOKEN"
   ```

3. **Compare versions**
   ```bash
   curl -X GET http://localhost:3001/api/v1/documents/$DOC_ID/versions/compare?from=1.0.0&to=1.1.0 \
     -H "Authorization: Bearer $TOKEN"
   ```

4. **Revert to previous version**
   ```bash
   curl -X POST http://localhost:3001/api/v1/documents/$DOC_ID/revert \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"targetVersion": "1.0.0"}'
   ```

**Expected Results**:
- Versions created with semantic numbering
- Version comparison shows detailed changes
- Revert functionality preserves document integrity
- Git commits created for major versions
- Version history maintains full audit trail

## Performance Benchmarks

### Document Loading Performance
- **Target**: Load 150,000 word document in <2 seconds
- **Test**: Load "comprehensive-spec-150k.json" test document
- **Metrics**: First contentful paint, time to interactive

### Collaborative Editing Performance
- **Target**: <500ms latency for text operations
- **Test**: 10 concurrent users editing same document
- **Metrics**: Operation round-trip time, conflict resolution time

### Search Performance  
- **Target**: <500ms response time for complex queries
- **Test**: Full-text search across 1000+ documents
- **Metrics**: Query execution time, index size efficiency

### Export Performance
- **Target**: <30 seconds for 150k word PDF export
- **Test**: Export large document to all formats
- **Metrics**: Export processing time, file size optimization

## Integration Test Data

### Test Users
```json
{
  "users": [
    {
      "email": "admin@test.com",
      "name": "Admin User",
      "role": "admin",
      "password": "admin123"
    },
    {
      "email": "editor@test.com", 
      "name": "Editor User",
      "role": "editor",
      "password": "editor123"
    },
    {
      "email": "viewer@test.com",
      "name": "Viewer User", 
      "role": "viewer",
      "password": "viewer123"
    }
  ]
}
```

### Test Documents
- **Small Document**: 5,000 words, basic structure
- **Medium Document**: 25,000 words, complex hierarchy
- **Large Document**: 150,000 words, maximum capacity
- **Multi-Author Document**: Collaborative editing test case

### Test Templates
- **Technical Specification**: Software documentation template
- **API Documentation**: REST API specification template
- **User Manual**: End-user documentation template
- **Research Paper**: Academic paper structure template

## Validation Checklist

### Functional Requirements Validation
- [ ] FR-001: 150,000 word document support ✓
- [ ] FR-002: Hierarchical document structures ✓
- [ ] FR-003: Automated content generation ✓
- [ ] FR-004: Real-time collaborative editing ✓
- [ ] FR-005: Version control integration ✓
- [ ] FR-006: Multi-format export ✓
- [ ] FR-007: Content templates ✓
- [ ] FR-008: Document lifecycle management ✓
- [ ] FR-009: Search and navigation ✓
- [ ] FR-010: User authentication/authorization ✓

### Non-Functional Requirements Validation
- [ ] Performance: <2s document load time
- [ ] Scalability: 100+ concurrent users per document  
- [ ] Reliability: 99.9% uptime target
- [ ] Security: Authentication, authorization, data encryption
- [ ] Usability: Intuitive navigation, responsive design

### Browser Compatibility
- [ ] Chrome (latest 2 versions)
- [ ] Firefox (latest 2 versions)
- [ ] Safari (latest 2 versions)
- [ ] Edge (latest 2 versions)

## Troubleshooting Common Issues

### WebSocket Connection Failures
```bash
# Check Socket.io server status
curl -X GET http://localhost:3001/socket.io/health

# Verify Redis connection for scaling
redis-cli ping
```

### Export Processing Delays
```bash
# Check export queue status
curl -X GET http://localhost:3001/api/v1/exports/queue/status

# Monitor background job processing
npm run queue:monitor
```

### Search Index Issues
```bash
# Rebuild Elasticsearch indices
npm run search:reindex

# Check index health
curl -X GET http://localhost:9200/_cluster/health
```

This quickstart guide provides comprehensive test scenarios covering all major user workflows and system capabilities.

<!-- OPENCLAW_TRELLO_CONTEXT:START -->
## Trello Integration Context
- Last inject: 2026-02-17 00:02 GMT+2
- Trello crawl status: pending valid API key+token (current key returned `invalid key`)
- Master sync note: [[openclaw/TRELLO_SYNC]]
<!-- OPENCLAW_TRELLO_CONTEXT:END -->
