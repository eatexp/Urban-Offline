# CLAUDE.md - AI Assistant Guide for Urban-Offline

**Last Updated**: 2025-12-03
**Repository**: Urban-Offline
**Status**: Initial Setup Phase

---

## Table of Contents

1. [Repository Overview](#repository-overview)
2. [Current State](#current-state)
3. [Development Workflow](#development-workflow)
4. [Git Conventions](#git-conventions)
5. [Code Structure Guidelines](#code-structure-guidelines)
6. [AI Assistant Instructions](#ai-assistant-instructions)
7. [Best Practices](#best-practices)
8. [Future Documentation](#future-documentation)

---

## Repository Overview

### Project Description
**Urban-Offline** is a newly initialized project. The repository was created on December 3, 2025, and is currently in the initial setup phase.

### Project Purpose
*To be determined* - This section should be updated once the project's core purpose and objectives are defined.

### Technology Stack
*Not yet determined* - Update this section when technologies are chosen.

Expected areas to document:
- **Primary Language(s)**: TBD
- **Framework(s)**: TBD
- **Database**: TBD
- **Build Tools**: TBD
- **Testing Framework**: TBD

---

## Current State

### Repository Structure
```
Urban-Offline/
├── .git/                    # Git version control
├── README.md               # Basic project title
└── CLAUDE.md              # This file - AI assistant guide
```

### What Exists
- ✅ Git repository initialized
- ✅ Basic README.md with project name
- ✅ CLAUDE.md documentation (this file)

### What's Missing (To Be Added)
- ❌ Source code directories (`src/`, `lib/`, etc.)
- ❌ Configuration files
- ❌ Dependency management files
- ❌ Build/test configurations
- ❌ Documentation directory
- ❌ License file
- ❌ Contributing guidelines
- ❌ CI/CD pipelines

---

## Development Workflow

### Branch Strategy

**Main Branch**: `main` (or `master`)
**Feature Branches**: Follow the pattern `feature/<description>` or `claude/<session-id>`

#### Claude AI Session Branches
When Claude creates branches, they follow the pattern:
```
claude/claude-md-<identifier>-<session-id>
```

Example: `claude/claude-md-miq50o3m3neeohm7-01Ra2zBjeUaJwgxwE7kE1Cq3`

**Important**: Always push to the correct Claude session branch when working in AI-assisted sessions.

### Development Process

1. **Start**: Create or checkout feature branch
2. **Develop**: Make changes following conventions
3. **Test**: Run tests before committing (when test suite exists)
4. **Commit**: Use clear, descriptive commit messages
5. **Push**: Push to feature branch
6. **Review**: Create PR for review (when ready)

---

## Git Conventions

### Commit Messages

Follow conventional commit format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements

**Examples**:
```
feat: add user authentication module
fix(api): correct endpoint response format
docs: update README with setup instructions
chore: initialize project structure
```

### Push Guidelines

**Critical**: When pushing to Claude branches:
- Always use: `git push -u origin <branch-name>`
- Branch must start with `claude/` and contain matching session ID
- Retry up to 4 times on network errors with exponential backoff (2s, 4s, 8s, 16s)

**For fetch/pull**:
- Prefer specific branches: `git fetch origin <branch-name>`
- Use same retry logic on network failures

### Safety Rules

- ❌ NEVER update git config without explicit permission
- ❌ NEVER run destructive commands (force push, hard reset) without confirmation
- ❌ NEVER skip hooks (--no-verify) without explicit request
- ❌ NEVER force push to main/master
- ⚠️ Avoid `git commit --amend` unless explicitly requested or fixing pre-commit hook issues
- ✅ Always check authorship before amending: `git log -1 --format='%an %ae'`

---

## Code Structure Guidelines

### Directory Structure (Proposed)

When the project structure is established, follow these conventions:

```
Urban-Offline/
├── .github/              # GitHub specific files (workflows, templates)
├── docs/                 # Documentation
├── src/                  # Source code
│   ├── components/       # Reusable components
│   ├── services/         # Business logic services
│   ├── utils/            # Utility functions
│   ├── models/           # Data models
│   ├── config/           # Configuration files
│   └── index.js          # Entry point
├── tests/                # Test files
├── scripts/              # Build/deployment scripts
├── public/               # Static assets (if web project)
├── .env.example          # Environment variables template
├── .gitignore            # Git ignore rules
├── package.json          # Dependencies (if Node.js)
├── README.md             # Project documentation
├── CLAUDE.md             # This file
├── LICENSE               # License information
└── CONTRIBUTING.md       # Contribution guidelines
```

### File Naming Conventions

*To be established based on chosen technology stack*

General recommendations:
- Use descriptive, clear names
- Follow language-specific conventions
- Keep names concise but meaningful
- Use consistent casing (camelCase, snake_case, PascalCase)

---

## AI Assistant Instructions

### When Starting a Task

1. **Read First**: Always read existing files before modifying them
2. **Understand Context**: Review related code to understand patterns
3. **Check Conventions**: Follow established conventions in the codebase
4. **Plan**: Use TodoWrite tool for multi-step tasks
5. **Ask Questions**: If requirements are unclear, ask before implementing

### Code Modification Rules

#### DO:
- ✅ Read files before editing
- ✅ Follow existing code style and patterns
- ✅ Make focused, minimal changes
- ✅ Write secure code (avoid OWASP top 10 vulnerabilities)
- ✅ Add comments only where logic isn't self-evident
- ✅ Test changes when possible
- ✅ Update documentation when changing behavior

#### DON'T:
- ❌ Make changes to unread code
- ❌ Over-engineer solutions
- ❌ Add unnecessary features
- ❌ Refactor unrelated code
- ❌ Add error handling for impossible scenarios
- ❌ Create premature abstractions
- ❌ Add backwards-compatibility hacks
- ❌ Commit files with secrets (.env, credentials.json)

### Security Guidelines

**Always check for**:
- Command injection vulnerabilities
- Cross-site scripting (XSS)
- SQL injection
- Path traversal attacks
- Insecure deserialization
- Authentication/authorization issues
- Sensitive data exposure
- Using components with known vulnerabilities

**If insecure code is detected**: Fix it immediately and document the security issue.

### Task Management

Use the TodoWrite tool when:
- Task has 3+ distinct steps
- Task is non-trivial and complex
- User provides multiple tasks
- Breaking down complex features

**Task Status Flow**:
1. `pending` → Task not started
2. `in_progress` → Currently working (only ONE task at a time)
3. `completed` → Task finished successfully

Mark tasks complete IMMEDIATELY after finishing each one.

### Communication Style

- ✅ Be concise and technical
- ✅ Focus on facts and problem-solving
- ✅ Use code references with `file:line` format
- ✅ Provide objective guidance
- ❌ Avoid excessive praise or validation
- ❌ Don't use emojis unless requested
- ❌ Don't provide timeline estimates

---

## Best Practices

### Code Quality

1. **Simplicity**: Keep solutions simple and focused
2. **Readability**: Write self-documenting code
3. **Security**: Always consider security implications
4. **Testing**: Write tests for critical functionality
5. **Performance**: Optimize only when necessary

### Documentation

1. **Keep Updated**: Update docs when changing functionality
2. **Be Precise**: Use clear, specific language
3. **Include Examples**: Show usage examples where helpful
4. **Reference Code**: Use file:line references

### Collaboration

1. **Clear Commits**: Write descriptive commit messages
2. **Focused PRs**: Keep pull requests focused on single concerns
3. **Code Review**: Review changes before committing
4. **Communication**: Document decisions and rationale

---

## Future Documentation

### To Be Added

As the project evolves, expand this document with:

1. **API Documentation**
   - Endpoint descriptions
   - Request/response formats
   - Authentication details

2. **Architecture Decisions**
   - Key architectural choices
   - Design patterns used
   - Rationale for technology choices

3. **Database Schema**
   - Table structures
   - Relationships
   - Migration strategy

4. **Testing Strategy**
   - Test types (unit, integration, e2e)
   - Coverage requirements
   - Testing conventions

5. **Deployment Process**
   - Environment setup
   - Deployment steps
   - Rollback procedures

6. **Common Issues**
   - Known issues and workarounds
   - Troubleshooting guides
   - FAQ section

7. **Dependencies**
   - Critical dependencies
   - Update policy
   - Security considerations

---

## Updating This Document

**When to Update**:
- New project structure established
- Technology stack chosen
- Conventions defined
- New patterns adopted
- Significant architectural changes

**How to Update**:
1. Read current CLAUDE.md
2. Make targeted updates to relevant sections
3. Update "Last Updated" date at top
4. Commit with message: `docs: update CLAUDE.md with [description]`

---

## Quick Reference

### Essential Commands

```bash
# Check status
git status

# Create feature branch
git checkout -b feature/description

# Stage changes
git add <files>

# Commit with message
git commit -m "type(scope): description"

# Push to branch
git push -u origin <branch-name>

# View recent commits
git log --oneline -10

# Check diff
git diff
```

### File References

When referencing code, use format: `filename:line_number`

Example: "The initialization happens in `src/index.js:42`"

---

## Contact & Support

- **Repository Owner**: Jamie.Xp (eatexp)
- **Issues**: Create GitHub issues for bugs or feature requests
- **Contributing**: See CONTRIBUTING.md (to be created)

---

*This document is a living guide. Keep it updated as the project evolves.*
