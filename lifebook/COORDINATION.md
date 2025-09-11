# 4-Window Development Coordination

**Project**: Technical Specification System  
**Branch**: 003-create-a-comprehensive  
**Coordination Started**: 2025-09-11  

## Window Assignments & Status

### Window 1: MAIN COORDINATOR (Current Window)
**Role**: Project coordination, sequential tasks, dependency management  
**Focus**: Setup phase, infrastructure, API controllers  
**Current Status**: 🟡 COORDINATING  
**Assigned Tasks**: T001-T012 (Setup + Infrastructure)  
**Files**: Project structure, database setup, API routes  

### Window 2: FRONTEND SPECIALIST  
**Role**: React components, Next.js pages, UI/UX  
**Focus**: All frontend development  
**Current Status**: ⚠️ BLOCKED - Waiting for TDD Phase (T013-T030)  
**Assigned Tasks**: T056-T070 (Frontend Components + Pages)  
**Files**: frontend/src/components/*, frontend/src/pages/*  

### Window 3: BACKEND SPECIALIST  
**Role**: Data models, services, business logic  
**Focus**: Backend core functionality  
**Current Status**: ⚠️ BLOCKED - Waiting for TDD Phase (T013-T030)  
**Assigned Tasks**: T031-T042 (Models + Services)  
**Files**: backend/src/models/*, backend/src/services/*  

### Window 4: TEST SPECIALIST  
**Role**: TDD enforcement, all test types  
**Focus**: Contract tests, integration tests, E2E tests  
**Current Status**: 🔴 WAITING FOR SPAWN  
**Assigned Tasks**: T013-T030, T077-T088 (All Tests)  
**Files**: backend/tests/*, frontend/tests/*  

## Phase Coordination Gates

### Phase 3.1 Setup (T001-T006) - MAIN ONLY
- [x] T001: MAIN creates project structure  
- [x] T002: MAIN initializes backend  
- [x] T003: MAIN initializes frontend  
- [x] T004: MAIN configures backend linting  
- [x] T005: MAIN configures frontend linting  
- [x] T006: MAIN sets up shared package  

### Phase 3.2 Infrastructure (T007-T012) - MAIN COORDINATION  
- [x] T007-T009: MAIN does sequential database/cache/search setup  
- [x] T010-T012: MAIN handles Prisma, S3, WebSocket setup complete  

### Phase 3.3 CRITICAL TDD GATE ⚠️  
**ALL WINDOWS MUST COMPLETE THEIR TEST TASKS BEFORE PROCEEDING**  
- Window 4 (TEST): T013-T030 (ALL tests must pass/fail correctly)  
- Windows 2,3: WAIT for test completion  
- Window 1 (MAIN): Coordinate and verify test completion  

### Phase 3.4+ Implementation - PARALLEL EXECUTION  
- Window 2 (FRONTEND): T056-T070  
- Window 3 (BACKEND): T031-T042  
- Window 4 (TEST): Continue with T077-T088  
- Window 1 (MAIN): T043-T055 (API controllers)  

## File Conflict Prevention

### Directory Ownership
```
Window 1 (MAIN): 
- Root project files (package.json, etc.)
- backend/src/api/controllers/
- backend/src/api/routes/
- backend/src/lib/ (database, cache, search setup)

Window 2 (FRONTEND):
- frontend/src/components/
- frontend/src/pages/
- frontend/src/services/

Window 3 (BACKEND):
- backend/src/models/
- backend/src/services/
- backend/prisma/

Window 4 (TEST):
- backend/tests/ (all subdirectories)
- frontend/tests/ (all subdirectories)
```

### Shared File Protocol
- **backend/src/api/middleware/**: Window 1 (MAIN) only
- **shared/**: Window 1 (MAIN) coordinates, others contribute
- **Configuration files**: Window 1 (MAIN) only

## Communication Protocol

### Status Updates
Each window updates their status in this file:
- 🔴 WAITING - Not yet started
- 🟡 IN_PROGRESS - Currently working  
- 🟢 COMPLETED - Phase/task completed
- ⚠️ BLOCKED - Waiting for dependency

### Dependency Notifications
- Window completing dependency → Updates COORDINATION.md
- Waiting windows check COORDINATION.md for unblocking
- MAIN window coordinates phase gates

### Git Commit Strategy
Each window commits with format:
```
[WINDOW-X] TaskID: Description

Examples:
[MAIN] T001: Create project structure
[FRONTEND] T056: Document editor component
[BACKEND] T031: Document model implementation
[TEST] T013: Contract test POST documents API
```

## Emergency Protocols

### Merge Conflicts
1. Window encountering conflict stops immediately
2. Updates COORDINATION.md with conflict details
3. MAIN window coordinates resolution
4. Resume after resolution

### Window Failure/Restart
1. Window updates COORDINATION.md before closing
2. New window reads COORDINATION.md for context
3. Continues from last completed task
4. Updates status to resume coordination

## Current Phase Status

**ACTIVE PHASE**: 3.2 Infrastructure  
**NEXT PHASE**: 3.3 Critical TDD Gate  
**CRITICAL GATE**: 3.3 Tests (ALL windows must complete before 3.4+)

**Ready to spawn windows**: ✅  
**Coordination system**: ✅  
**File isolation**: ✅  
**Communication protocol**: ✅