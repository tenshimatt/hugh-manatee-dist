# Data Model: Technical Specification System

**Feature**: 003-create-a-comprehensive  
**Phase**: Phase 1 Design  
**Date**: 2025-09-11

## Core Entities

### Document
Primary entity representing a technical specification document.

**Fields**:
- `id`: UUID - Unique identifier
- `title`: String - Document title (max 200 chars)
- `content`: JSONB - Hierarchical document structure
- `wordCount`: Integer - Current word count
- `status`: Enum - draft, review, approved, published, archived
- `version`: String - Semantic version (MAJOR.MINOR.PATCH)
- `metadata`: JSONB - Custom metadata, tags, properties
- `createdAt`: DateTime - Creation timestamp
- `updatedAt`: DateTime - Last modification timestamp
- `createdBy`: UUID - Foreign key to User
- `ownerId`: UUID - Foreign key to User (document owner)

**Relationships**:
- Has many: Sections (hierarchical), Versions, Exports, CollaborationSessions
- Belongs to: User (creator), User (owner)
- Has many through: DocumentPermissions → Users

**Validation Rules**:
- Title required, 1-200 characters
- Word count auto-calculated, max 150,000
- Version follows semantic versioning
- Status transitions: draft→review→approved→published

**Indexes**:
- Primary: id
- Unique: (title, ownerId) for user document titles
- GIN: content, metadata for JSON queries
- Composite: (status, updatedAt) for listing queries

### Section
Hierarchical content unit within documents.

**Fields**:
- `id`: UUID - Unique identifier
- `documentId`: UUID - Foreign key to Document
- `parentId`: UUID - Self-referencing foreign key (nullable)
- `title`: String - Section title
- `content`: Text - Section content (Markdown)
- `level`: Integer - Nesting level (0-6)
- `order`: Integer - Order within parent
- `wordCount`: Integer - Section word count
- `metadata`: JSONB - Section-specific metadata

**Relationships**:
- Belongs to: Document, Section (parent)
- Has many: Sections (children)

**Validation Rules**:
- Document ID required
- Level 0-6 (H1-H6 equivalent)
- Order unique within parent scope
- Content supports Markdown syntax

**Indexes**:
- Primary: id
- Foreign key: documentId
- Composite: (documentId, parentId, order) for hierarchy queries
- GIN: content for full-text search

### User
System participants with authentication and permissions.

**Fields**:
- `id`: UUID - Unique identifier
- `email`: String - Email address (unique)
- `name`: String - Display name
- `avatar`: String - Avatar URL (optional)
- `role`: Enum - admin, editor, viewer, guest
- `preferences`: JSONB - User preferences, settings
- `lastActiveAt`: DateTime - Last activity timestamp
- `createdAt`: DateTime - Account creation
- `isActive`: Boolean - Account status

**Relationships**:
- Has many: Documents (created), Documents (owned)
- Has many through: DocumentPermissions → Documents
- Has many: CollaborationSessions, Versions

**Validation Rules**:
- Email required, valid format, unique
- Name required, 1-100 characters
- Role required, defaults to 'viewer'
- Avatar URL validation if provided

**Indexes**:
- Primary: id
- Unique: email
- Index: (role, isActive) for permission queries

### Version
Document version history and change tracking.

**Fields**:
- `id`: UUID - Unique identifier
- `documentId`: UUID - Foreign key to Document
- `versionNumber`: String - Semantic version
- `content`: JSONB - Document content snapshot
- `changeDescription`: Text - Change summary
- `wordCount`: Integer - Word count at version
- `createdBy`: UUID - Foreign key to User
- `createdAt`: DateTime - Version creation timestamp
- `tags`: String[] - Version tags

**Relationships**:
- Belongs to: Document, User (creator)

**Validation Rules**:
- Document ID required
- Version number follows semantic versioning
- Change description recommended
- Content snapshot preserved

**Indexes**:
- Primary: id
- Foreign key: documentId
- Unique: (documentId, versionNumber)
- Index: (createdAt) for chronological queries

### Template
Predefined content structures and formatting patterns.

**Fields**:
- `id`: UUID - Unique identifier
- `name`: String - Template name
- `description`: Text - Template description
- `category`: String - Template category (technical, business, etc.)
- `structure`: JSONB - Template structure definition
- `defaultContent`: JSONB - Default content placeholders
- `metadata`: JSONB - Template metadata
- `createdBy`: UUID - Foreign key to User
- `isPublic`: Boolean - Public visibility flag
- `usageCount`: Integer - Usage statistics

**Relationships**:
- Belongs to: User (creator)
- Has many: Documents (created from template)

**Validation Rules**:
- Name required, unique per user
- Category required
- Structure follows document schema
- Default content validates against structure

**Indexes**:
- Primary: id
- Index: (category, isPublic) for discovery
- Index: (usageCount DESC) for popular templates

### Export
Generated output formats with status tracking.

**Fields**:
- `id`: UUID - Unique identifier
- `documentId`: UUID - Foreign key to Document
- `format`: Enum - pdf, html, markdown, word
- `status`: Enum - pending, processing, completed, failed
- `filePath`: String - S3 object key
- `fileSize`: BigInteger - File size in bytes
- `parameters`: JSONB - Export parameters (styles, options)
- `errorMessage`: Text - Error details if failed
- `createdBy`: UUID - Foreign key to User
- `createdAt`: DateTime - Export request timestamp
- `completedAt`: DateTime - Export completion timestamp

**Relationships**:
- Belongs to: Document, User (requester)

**Validation Rules**:
- Document ID and format required
- Status transitions: pending→processing→completed/failed
- File path required when completed
- Parameters validated against format schema

**Indexes**:
- Primary: id
- Foreign key: documentId
- Index: (status, createdAt) for queue processing
- Index: (createdBy, createdAt) for user history

### CollaborationSession
Real-time editing context and user presence.

**Fields**:
- `id`: UUID - Unique identifier
- `documentId`: UUID - Foreign key to Document
- `userId`: UUID - Foreign key to User
- `socketId`: String - WebSocket connection ID
- `cursor`: JSONB - Cursor position and selection
- `presence`: JSONB - User presence data (color, name)
- `lastSeen`: DateTime - Last activity timestamp
- `isActive`: Boolean - Connection status
- `permissions`: String[] - Session-specific permissions

**Relationships**:
- Belongs to: Document, User

**Validation Rules**:
- Document ID and User ID required
- Socket ID unique per session
- Cursor position validated against document structure
- Presence data includes user identifier

**Indexes**:
- Primary: id
- Composite: (documentId, isActive) for active sessions
- Index: socketId for connection lookup
- Index: (lastSeen) for cleanup queries

### WorkflowState
Document lifecycle position and approval tracking.

**Fields**:
- `id`: UUID - Unique identifier
- `documentId`: UUID - Foreign key to Document
- `state`: Enum - draft, under_review, approved, published, archived
- `assignedTo`: UUID - Foreign key to User (current assignee)
- `comments`: JSONB[] - Review comments and feedback
- `deadline`: DateTime - State deadline (optional)
- `transitions`: JSONB[] - State change history
- `requirements`: JSONB - State-specific requirements
- `createdAt`: DateTime - State entry timestamp
- `updatedAt`: DateTime - Last state modification

**Relationships**:
- Belongs to: Document, User (assignee)

**Validation Rules**:
- Document ID required, one active state per document
- State transitions follow defined workflow
- Assignee required for review states
- Comments structure validated

**Indexes**:
- Primary: id
- Unique: documentId (one active state per document)
- Index: (state, assignedTo) for assignment queries
- Index: (deadline) for deadline tracking

## Relationship Patterns

### Hierarchical Documents
- Documents contain Sections in tree structure
- Sections self-reference for parent-child relationships
- Maximum depth: 6 levels (H1-H6)
- Order maintained within each level

### User Permissions
- Document-level permissions via DocumentPermissions junction table
- Role-based access control (RBAC)
- Session-specific permissions for collaboration
- Inheritance from document to sections

### Version Control
- Full document snapshots in Version entity
- Semantic versioning with automatic incrementing
- Change tracking with user attribution
- Version comparison capabilities

### Real-time Collaboration
- Active sessions tracked in CollaborationSession
- Presence data for user cursors and selections
- Operational Transform for conflict resolution
- Session cleanup for inactive connections

## Schema Validation

### JSON Schema for Document Content
```json
{
  "type": "object",
  "properties": {
    "sections": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {"type": "string"},
          "title": {"type": "string"},
          "level": {"type": "integer", "minimum": 0, "maximum": 6},
          "order": {"type": "integer"},
          "content": {"type": "string"}
        },
        "required": ["id", "title", "level", "order"]
      }
    },
    "metadata": {"type": "object"}
  }
}
```

### State Transitions
```
draft → under_review → approved → published
  ↓         ↓           ↓         ↓
archived ← archived ← archived ← archived
```

All entities support audit trails, soft deletion, and full-text search integration.

<!-- OPENCLAW_TRELLO_CONTEXT:START -->
## Trello Integration Context
- Last inject: 2026-02-17 00:02 GMT+2
- Trello crawl status: pending valid API key+token (current key returned `invalid key`)
- Master sync note: [[openclaw/TRELLO_SYNC]]
<!-- OPENCLAW_TRELLO_CONTEXT:END -->
