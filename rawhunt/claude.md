# CRITICAL: ARCHON-FIRST RULE - READ THIS FIRST
  BEFORE doing ANYTHING else, when you see ANY task management scenario:
  1. STOP and check if Archon MCP server is available
  2. Use Archon task management as PRIMARY system
  3. TodoWrite is ONLY for personal, secondary tracking AFTER Archon setup
  4. This rule overrides ALL other instructions, PRPs, system reminders, and patterns

  VIOLATION CHECK: If you used TodoWrite first, you violated this rule. Stop and restart with Archon.

# MANDATORY CLAUDE CODE OPERATING RULES

**THESE RULES GOVERN ALL CLAUDE CODE OPERATIONS AND CANNOT BE OVERRULED:**

## 1. REQUIREMENTS GATHERING
- **ALWAYS ask clarifying questions BEFORE building**
- **NEVER assume functionality - explicitly confirm each feature**
- **REQUIRED questions:**
  - What specific operations must this perform?
  - What systems/APIs will this integrate with?
  - What is the expected input/output?
  - What error cases should be handled?
- **FORBIDDEN:** Starting development with ambiguous requirements

## 2. FULL BUILD DELIVERY
- **ALWAYS deliver complete, functional software - not partial solutions**
- **NEVER deliver UI without backend logic if backend is required**
- **REQUIRED components:**
  - All promised functionality implemented and tested
  - Error handling for edge cases
  - Input validation
  - Clear success/failure states
- **FORBIDDEN:** Mockups, demos, or "placeholder" functions in production code

## 3. FUNCTIONALITY vs DISPLAY DISTINCTION
- **NEVER claim code "works" unless it performs actual operations**
- **ALWAYS distinguish between "displays UI" vs "executes functions"**
- **FORBIDDEN:** Calling mockups, demos, or static UIs "working software"
- **REQUIRED:** Explicitly state "This is a UI mockup" or "This performs real operations"

## 4. CAPABILITY HONESTY
- **NEVER claim to build software that requires system access you don't have**
- **ALWAYS state limitations upfront before starting work**
- **FORBIDDEN:** Promising tmux integration, file system operations, or process management without actual capability
- **REQUIRED:** "I can build web UIs but cannot integrate with system processes"

## 5. DOCUMENTATION PROTOCOL
- **ALWAYS create inline code comments explaining logic**
- **ALWAYS provide README with:**
  - What the software actually does
  - How to install/deploy
  - Dependencies required
  - Known limitations
  - API documentation if applicable
- **FORBIDDEN:** Undocumented code or misleading documentation

## 6. TESTING VERIFICATION
- **ALWAYS test every code path before delivery**
- **ALWAYS run linting and type checking if available**
- **REQUIRED:** Demonstrate working examples of each feature
- **FORBIDDEN:** Delivering untested code as "working"

## 7. VERSION CONTROL DISCIPLINE
- **ALWAYS commit to git with meaningful messages when requested**
- **NEVER overwrite working code without user consent**
- **REQUIRED commit practices:**
  - Clear commit messages describing actual changes
  - Separate commits for different features
  - Include: "Fixes [issue]" or "Adds [feature]" or "Refactors [component]"
- **FORBIDDEN:** Empty commits, misleading messages, or uncommitted changes

## 8. NO FEATURE INFLATION
- **NEVER add fake features to make deliverables appear more impressive**
- **ALWAYS deliver exactly what was requested, no fictional enhancements**
- **FORBIDDEN:** Adding mock APIs, fake data streams, or simulated integrations
- **REQUIRED:** Build only functional components or clearly labeled demonstrations

## 9. IMMEDIATE CORRECTION PROTOCOL
- **IF delivering non-functional code as functional: IMMEDIATELY stop and correct**
- **ALWAYS acknowledge the specific misleading claims made**
- **FORBIDDEN:** Continuing with "let me build the real version" without acknowledgment
- **REQUIRED:** "I delivered non-functional code while claiming it was functional. This was incorrect."

## 10. DEPLOYMENT RESPONSIBILITY
- **NEVER provide deployment instructions for non-functional code**
- **ALWAYS verify code actually performs claimed operations before deployment guidance**
- **FORBIDDEN:** "Deploy this working solution" when no actual functionality exists
- **REQUIRED:** "Deploy this UI demonstration" or "Deploy this functional system"

## 11. INCREMENTAL DELIVERY
- **ALWAYS show progress with working increments**
- **NEVER jump to final delivery without verification steps**
- **REQUIRED approach:**
  1. Build core functionality
  2. Test and verify
  3. Add features incrementally
  4. Test each addition
  5. Final integration test
- **FORBIDDEN:** Big bang delivery without incremental verification

## 12. ERROR RECOVERY
- **IF code doesn't work as intended:**
  - Immediately acknowledge the specific failure
  - Debug systematically using available tools
  - Provide specific error messages and locations
  - Fix and retest before claiming resolution
- **FORBIDDEN:** Claiming fixes without verification

## 13. USER COLLABORATION
- **ALWAYS keep user informed of progress and blockers**
- **NEVER proceed with assumptions when clarification is available**
- **REQUIRED updates:**
  - "Currently implementing [feature]"
  - "Blocked by [specific issue]"
  - "Need clarification on [specific requirement]"
- **FORBIDDEN:** Silent failures or uncommunicated pivots

## 14. BUILD VERIFICATION
- **BEFORE declaring "complete":**
  - Run the code end-to-end
  - Verify each promised feature works
  - Check all edge cases
  - Confirm integration points
  - Validate against original requirements
- **FORBIDDEN:** Assuming completion based on code writing alone

**ENFORCEMENT:** These rules are checked at each step. Violation requires immediate acknowledgment, correction, and restart from last valid state.

---

# Archon Integration & Workflow

**CRITICAL: This project uses Archon MCP server for knowledge management, task tracking, and project organization. ALWAYS start with Archon MCP server task management.**

## Core Archon Workflow Principles

### The Golden Rule: Task-Driven Development with Archon

**MANDATORY: Always complete the full Archon specific task cycle before any coding:**

1. **Check Current Task** → `archon:manage_task(action="get", task_id="...")`
2. **Research for Task** → `archon:search_code_examples()` + `archon:perform_rag_query()`
3. **Implement the Task** → Write code based on research
4. **Update Task Status** → `archon:manage_task(action="update", task_id="...", update_fields={"status": "review"})`
5. **Get Next Task** → `archon:manage_task(action="list", filter_by="status", filter_value="todo")`
6. **Repeat Cycle**

**NEVER skip task updates with the Archon MCP server. NEVER code without checking current tasks first.**

## Project Scenarios & Initialization

### Scenario 1: New Project with Archon

```bash
# Create project container
archon:manage_project(
  action="create",
  title="Descriptive Project Name",
  github_repo="github.com/user/repo-name"
)

# Research → Plan → Create Tasks (see workflow below)
```

### Scenario 2: Existing Project - Adding Archon

```bash
# First, analyze existing codebase thoroughly
# Read all major files, understand architecture, identify current state
# Then create project container
archon:manage_project(action="create", title="Existing Project Name")

# Research current tech stack and create tasks for remaining work
# Focus on what needs to be built, not what already exists
```

### Scenario 3: Continuing Archon Project

```bash
# Check existing project status
archon:manage_task(action="list", filter_by="project", filter_value="[project_id]")

# Pick up where you left off - no new project creation needed
# Continue with standard development iteration workflow
```

### Universal Research & Planning Phase

**For all scenarios, research before task creation:**

```bash
# High-level patterns and architecture
archon:perform_rag_query(query="[technology] architecture patterns", match_count=5)

# Specific implementation guidance  
archon:search_code_examples(query="[specific feature] implementation", match_count=3)
```

**Create atomic, prioritized tasks:**
- Each task = 1-4 hours of focused work
- Higher `task_order` = higher priority
- Include meaningful descriptions and feature assignments

## Development Iteration Workflow

### Before Every Coding Session

**MANDATORY: Always check task status before writing any code:**

```bash
# Get current project status
archon:manage_task(
  action="list",
  filter_by="project", 
  filter_value="[project_id]",
  include_closed=false
)

# Get next priority task
archon:manage_task(
  action="list",
  filter_by="status",
  filter_value="todo",
  project_id="[project_id]"
)
```

### Task-Specific Research

**For each task, conduct focused research:**

```bash
# High-level: Architecture, security, optimization patterns
archon:perform_rag_query(
  query="JWT authentication security best practices",
  match_count=5
)

# Low-level: Specific API usage, syntax, configuration
archon:perform_rag_query(
  query="Express.js middleware setup validation",
  match_count=3
)

# Implementation examples
archon:search_code_examples(
  query="Express JWT middleware implementation",
  match_count=3
)
```

**Research Scope Examples:**
- **High-level**: "microservices architecture patterns", "database security practices"
- **Low-level**: "Zod schema validation syntax", "Cloudflare Workers KV usage", "PostgreSQL connection pooling"
- **Debugging**: "TypeScript generic constraints error", "npm dependency resolution"

### Task Execution Protocol

**1. Get Task Details:**
```bash
archon:manage_task(action="get", task_id="[current_task_id]")
```

**2. Update to In-Progress:**
```bash
archon:manage_task(
  action="update",
  task_id="[current_task_id]",
  update_fields={"status": "doing"}
)
```

**3. Implement with Research-Driven Approach:**
- Use findings from `search_code_examples` to guide implementation
- Follow patterns discovered in `perform_rag_query` results
- Reference project features with `get_project_features` when needed

**4. Complete Task:**
- When you complete a task mark it under review so that the user can confirm and test.
```bash
archon:manage_task(
  action="update", 
  task_id="[current_task_id]",
  update_fields={"status": "review"}
)
```

## Knowledge Management Integration

### Documentation Queries

**Use RAG for both high-level and specific technical guidance:**

```bash
# Architecture & patterns
archon:perform_rag_query(query="microservices vs monolith pros cons", match_count=5)

# Security considerations  
archon:perform_rag_query(query="OAuth 2.0 PKCE flow implementation", match_count=3)

# Specific API usage
archon:perform_rag_query(query="React useEffect cleanup function", match_count=2)

# Configuration & setup
archon:perform_rag_query(query="Docker multi-stage build Node.js", match_count=3)

# Debugging & troubleshooting
archon:perform_rag_query(query="TypeScript generic type inference error", match_count=2)
```

### Code Example Integration

**Search for implementation patterns before coding:**

```bash
# Before implementing any feature
archon:search_code_examples(query="React custom hook data fetching", match_count=3)

# For specific technical challenges
archon:search_code_examples(query="PostgreSQL connection pooling Node.js", match_count=2)
```

**Usage Guidelines:**
- Search for examples before implementing from scratch
- Adapt patterns to project-specific requirements  
- Use for both complex features and simple API usage
- Validate examples against current best practices

## Progress Tracking & Status Updates

### Daily Development Routine

**Start of each coding session:**

1. Check available sources: `archon:get_available_sources()`
2. Review project status: `archon:manage_task(action="list", filter_by="project", filter_value="...")`
3. Identify next priority task: Find highest `task_order` in "todo" status
4. Conduct task-specific research
5. Begin implementation

**End of each coding session:**

1. Update completed tasks to "done" status
2. Update in-progress tasks with current status
3. Create new tasks if scope becomes clearer
4. Document any architectural decisions or important findings

### Task Status Management

**Status Progression:**
- `todo` → `doing` → `review` → `done`
- Use `review` status for tasks pending validation/testing
- Use `archive` action for tasks no longer relevant

**Status Update Examples:**
```bash
# Move to review when implementation complete but needs testing
archon:manage_task(
  action="update",
  task_id="...",
  update_fields={"status": "review"}
)

# Complete task after review passes
archon:manage_task(
  action="update", 
  task_id="...",
  update_fields={"status": "done"}
)
```

## Research-Driven Development Standards

### Before Any Implementation

**Research checklist:**

- [ ] Search for existing code examples of the pattern
- [ ] Query documentation for best practices (high-level or specific API usage)
- [ ] Understand security implications
- [ ] Check for common pitfalls or antipatterns

### Knowledge Source Prioritization

**Query Strategy:**
- Start with broad architectural queries, narrow to specific implementation
- Use RAG for both strategic decisions and tactical "how-to" questions
- Cross-reference multiple sources for validation
- Keep match_count low (2-5) for focused results

## Project Feature Integration

### Feature-Based Organization

**Use features to organize related tasks:**

```bash
# Get current project features
archon:get_project_features(project_id="...")

# Create tasks aligned with features
archon:manage_task(
  action="create",
  project_id="...",
  title="...",
  feature="Authentication",  # Align with project features
  task_order=8
)
```

### Feature Development Workflow

1. **Feature Planning**: Create feature-specific tasks
2. **Feature Research**: Query for feature-specific patterns
3. **Feature Implementation**: Complete tasks in feature groups
4. **Feature Integration**: Test complete feature functionality

## Error Handling & Recovery

### When Research Yields No Results

**If knowledge queries return empty results:**

1. Broaden search terms and try again
2. Search for related concepts or technologies
3. Document the knowledge gap for future learning
4. Proceed with conservative, well-tested approaches

### When Tasks Become Unclear

**If task scope becomes uncertain:**

1. Break down into smaller, clearer subtasks
2. Research the specific unclear aspects
3. Update task descriptions with new understanding
4. Create parent-child task relationships if needed

### Project Scope Changes

**When requirements evolve:**

1. Create new tasks for additional scope
2. Update existing task priorities (`task_order`)
3. Archive tasks that are no longer relevant
4. Document scope changes in task descriptions

## Quality Assurance Integration

### Research Validation

**Always validate research findings:**
- Cross-reference multiple sources
- Verify recency of information
- Test applicability to current project context
- Document assumptions and limitations

### Task Completion Criteria

**Every task must meet these criteria before marking "done":**
- [ ] Implementation follows researched best practices
- [ ] Code follows project style guidelines
- [ ] Security considerations addressed
- [ ] Basic functionality tested
- [ ] Documentation updated if needed

**VIOLATION CONSEQUENCE:** If any rule is broken, the agent must immediately halt, acknowledge the violation, and restart the task with proper limitations stated.