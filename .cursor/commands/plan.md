## Cursor Command: `/plan`

**Purpose:** Override Cursor's default plan behavior. Instead of showing the plan in chat, create a comprehensive plan as a markdown file in the project root.

### Usage
```
/plan [description or task]
```

### Behavior

When user uses `/plan` command:

1. **Analyze the request**: Understand what the user wants to plan
2. **Create a markdown file**: Generate a detailed plan document in the project root
3. **File naming**: Use format `plan-YYYY-MM-DD-HHmmss.md` or `plan-[descriptive-name].md` based on the task
4. **Plan structure**: Include:
   - Overview/Summary
   - Objectives
   - Tasks breakdown (with dependencies)
   - Implementation steps
   - Files to modify/create
   - Testing considerations
   - Timeline/estimates (if applicable)
   - Notes and considerations (keep concise, no code snippets)

**IMPORTANT: This is a PLANNING phase only. DO NOT make any code changes. Only create the plan markdown file. No file modifications, no code edits, no implementations.**

### Plan Format

The generated markdown file should follow this structure:

```markdown
# Plan: [Task Name]

## Overview
[Brief description of what needs to be done]

## Objectives
- [Objective 1]
- [Objective 2]

## Tasks

### Task 1: [Task Name]
- **Status**: Pending
- **Dependencies**: None / [Task X]
- **Files**: 
  - `path/to/file1.ts`
  - `path/to/file2.ts`
- **Description**: [Detailed description]
- **Steps**:
  1. Step 1
  2. Step 2

### Task 2: [Task Name]
...

## Implementation Details

### Files to Modify
- `file1.ts` - [reason]

### Files to Create
- `new-file.ts` - [reason]

## Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual testing

## Notes
[Brief considerations, warnings, or important information - keep it concise, no code snippets]
```

### Best Practices

- **Be thorough**: Include all necessary steps and considerations
- **Be specific**: Mention exact files, functions, and code locations (but no code snippets)
- **Be organized**: Use clear hierarchy and structure
- **Keep it concise**: Avoid bloating the plan with detailed code examples or long explanations
- **Notes section**: Keep notes brief and high-level - no code snippets, just key considerations
- **Save to root**: Always save the plan file in the project root directory
- **NO CODE CHANGES**: This command is for planning only. Do not modify, create, or edit any code files. Only create the plan markdown file.

### Example

When user says `/plan add user authentication`, create a file like `plan-user-authentication.md` in the project root with a comprehensive plan for implementing user authentication.
