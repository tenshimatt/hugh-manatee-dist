# WebSocket API Specification: Real-time Collaboration

**Feature**: 003-create-a-comprehensive  
**Component**: Real-time Collaboration Engine  
**Protocol**: WebSocket with Socket.io

## Connection & Authentication

### Connection Endpoint
```
ws://localhost:3001/socket.io/
```

### Authentication
```javascript
// Client connection with JWT token
const socket = io('http://localhost:3001', {
  auth: {
    token: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  }
});
```

### Connection Events
```javascript
// Connection established
socket.on('connect', () => {
  console.log('Connected:', socket.id);
});

// Authentication error
socket.on('auth_error', (error) => {
  console.error('Auth failed:', error.message);
});
```

## Document Collaboration

### Join Document Session
```javascript
// Join document editing session
socket.emit('join_document', {
  documentId: 'doc-uuid-123',
  userId: 'user-uuid-456'
});

// Confirm join
socket.on('document_joined', (data) => {
  // data: { documentId, activeUsers, documentState }
});
```

### Leave Document Session
```javascript
// Leave document editing session
socket.emit('leave_document', {
  documentId: 'doc-uuid-123'
});

// Confirm leave
socket.on('document_left', (data) => {
  // data: { documentId }
});
```

## Real-time Editing Operations

### Operational Transform (OT) Events

#### Text Operations
```javascript
// Send text operation
socket.emit('text_operation', {
  documentId: 'doc-uuid-123',
  sectionId: 'section-uuid-789',
  operation: {
    type: 'insert',
    position: 150,
    content: 'New text content',
    author: 'user-uuid-456'
  }
});

// Receive text operation
socket.on('text_operation', (data) => {
  // data: { documentId, sectionId, operation, timestamp }
  // Apply operation to local document state
});
```

#### Section Structure Operations
```javascript
// Add new section
socket.emit('section_operation', {
  documentId: 'doc-uuid-123',
  operation: {
    type: 'add_section',
    parentId: 'section-parent-uuid',
    section: {
      title: 'New Section',
      level: 2,
      order: 3,
      content: ''
    },
    author: 'user-uuid-456'
  }
});

// Delete section
socket.emit('section_operation', {
  documentId: 'doc-uuid-123',
  operation: {
    type: 'delete_section',
    sectionId: 'section-uuid-to-delete',
    author: 'user-uuid-456'
  }
});

// Move section
socket.emit('section_operation', {
  documentId: 'doc-uuid-123',
  operation: {
    type: 'move_section',
    sectionId: 'section-uuid-to-move',
    newParentId: 'new-parent-uuid',
    newOrder: 1,
    author: 'user-uuid-456'
  }
});
```

## User Presence

### Cursor Position Updates
```javascript
// Send cursor position
socket.emit('cursor_update', {
  documentId: 'doc-uuid-123',
  cursor: {
    sectionId: 'section-uuid-789',
    position: 245,
    selection: { start: 245, end: 260 },
    userId: 'user-uuid-456'
  }
});

// Receive cursor updates from other users
socket.on('cursor_update', (data) => {
  // data: { documentId, cursor, user }
  // Update cursor display for other users
});
```

### User Presence Status
```javascript
// User joins document
socket.on('user_joined', (data) => {
  // data: { user: { id, name, avatar, color }, documentId }
});

// User leaves document
socket.on('user_left', (data) => {
  // data: { userId, documentId }
});

// Active users list
socket.on('active_users', (data) => {
  // data: { documentId, users: [{ id, name, avatar, color, lastSeen }] }
});
```

## Document State Synchronization

### Document State Events
```javascript
// Request full document state
socket.emit('request_document_state', {
  documentId: 'doc-uuid-123'
});

// Receive full document state
socket.on('document_state', (data) => {
  // data: { 
  //   documentId, 
  //   content: { sections: [...] },
  //   version, 
  //   lastUpdated,
  //   wordCount 
  // }
});

// Document updated by another user
socket.on('document_updated', (data) => {
  // data: { documentId, changes, version, updatedBy }
});
```

### Conflict Resolution
```javascript
// Operation conflict detected
socket.on('operation_conflict', (data) => {
  // data: { 
  //   documentId, 
  //   conflictingOperation, 
  //   resolvedOperation,
  //   message 
  // }
});

// Request operation retry
socket.emit('retry_operation', {
  documentId: 'doc-uuid-123',
  operationId: 'op-uuid-123',
  retryCount: 1
});
```

## Document Locking

### Section Locking
```javascript
// Lock section for editing
socket.emit('lock_section', {
  documentId: 'doc-uuid-123',
  sectionId: 'section-uuid-789',
  lockType: 'edit' // 'edit' | 'structure'
});

// Section lock acquired
socket.on('section_locked', (data) => {
  // data: { documentId, sectionId, lockedBy, lockType, expiresAt }
});

// Section lock released
socket.emit('unlock_section', {
  documentId: 'doc-uuid-123',
  sectionId: 'section-uuid-789'
});

// Section unlocked
socket.on('section_unlocked', (data) => {
  // data: { documentId, sectionId }
});
```

## Comments and Reviews

### Comment Events
```javascript
// Add comment
socket.emit('add_comment', {
  documentId: 'doc-uuid-123',
  sectionId: 'section-uuid-789',
  comment: {
    content: 'This section needs revision',
    position: { start: 100, end: 150 },
    type: 'suggestion' // 'comment' | 'suggestion' | 'question'
  }
});

// Receive new comment
socket.on('comment_added', (data) => {
  // data: { documentId, sectionId, comment, author }
});

// Resolve comment
socket.emit('resolve_comment', {
  documentId: 'doc-uuid-123',
  commentId: 'comment-uuid-123',
  resolution: 'accepted' // 'accepted' | 'rejected' | 'implemented'
});
```

## Error Handling

### Error Events
```javascript
// General operation error
socket.on('operation_error', (error) => {
  // error: { code, message, operation, documentId }
});

// Permission error
socket.on('permission_error', (error) => {
  // error: { code: 'INSUFFICIENT_PERMISSIONS', message, action }
});

// Connection error
socket.on('connect_error', (error) => {
  // Handle connection failures
});

// Reconnection logic
socket.on('reconnect', (attemptNumber) => {
  // Rejoin active documents
  // Resynchronize document state
});
```

## Rate Limiting

### Operation Throttling
- Text operations: 10 per second per user
- Cursor updates: 5 per second per user
- Section operations: 2 per second per user
- Comment operations: 3 per second per user

### Rate Limit Events
```javascript
// Rate limit exceeded
socket.on('rate_limit_exceeded', (data) => {
  // data: { operation, limit, resetTime }
});
```

## Event Summary

### Client → Server Events
1. `join_document` - Join document editing session
2. `leave_document` - Leave document editing session
3. `text_operation` - Send text editing operation
4. `section_operation` - Send section structure operation
5. `cursor_update` - Send cursor position update
6. `lock_section` - Request section lock
7. `unlock_section` - Release section lock
8. `add_comment` - Add comment or suggestion
9. `resolve_comment` - Resolve comment thread
10. `request_document_state` - Request full document state
11. `retry_operation` - Retry failed operation

### Server → Client Events
1. `document_joined` - Confirm document join
2. `document_left` - Confirm document leave
3. `text_operation` - Receive text operation from other users
4. `section_operation` - Receive section operation from other users
5. `cursor_update` - Receive cursor updates from other users
6. `user_joined` - Another user joined document
7. `user_left` - Another user left document
8. `active_users` - List of currently active users
9. `document_state` - Full document state
10. `document_updated` - Document updated notification
11. `section_locked` - Section lock acquired
12. `section_unlocked` - Section lock released
13. `comment_added` - New comment added
14. `operation_conflict` - Operation conflict detected
15. `operation_error` - Operation failed
16. `permission_error` - Insufficient permissions
17. `rate_limit_exceeded` - Rate limit exceeded

All events include proper error handling and support automatic reconnection with state synchronization.

<!-- OPENCLAW_TRELLO_CONTEXT:START -->
## Trello Integration Context
- Last inject: 2026-02-17 00:02 GMT+2
- Trello crawl status: pending valid API key+token (current key returned `invalid key`)
- Master sync note: [[openclaw/TRELLO_SYNC]]
<!-- OPENCLAW_TRELLO_CONTEXT:END -->
