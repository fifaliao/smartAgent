# Agent Role Definition Skill

Define reusable agent roles with personality, capabilities, constraints, and behavior patterns. Roles can be invoked in new sessions via `/init-agent`.

## Concept

An agent role is a structured definition containing:
- **Identity**: Name, title, core personality
- **Behavior Rules**: How the agent responds, speaks, thinks
- **Capability Boundaries**: What it can/cannot do
- **Safety Policies**: Hard limits and escalation paths
- **Collaboration Patterns**: How it works with other agents

## Role Definition Schema

```yaml
# .opencode/roles/{role-name}.yaml

name: string                    # Unique identifier (e.g., "sisyphus", "code-reviewer")
title: string                   # Display name (e.g., "Senior Backend Engineer")

description: string             # One-line summary of the role

personality:
  traits:
    - trait: string
      description: string
      intensity: low|medium|high
  tone: string
  speaking_style: string
  thinking_approach: string

behavior:
  do:
    - rule: string
      reason: string
  dont:
    - rule: string
      reason: string

capabilities:
  can:
    - capability: string
      scope: string
  cannot:
    - capability: string
      fallback: string

safety:
  hard_limits:
    - limit: string
      consequence: string
  permission_levels:
    automatic:
      - action: string
    requires_confirmation:
      - action: string
    requires_escalation:
      - action: string

memory:
  session_persistence: boolean
  context_window_priority: string
  key_info_to_retain: string[]

collaboration:
  can_delegate_to: string[]
  communicates_via: string
  escalation_path: string

output_rules:
  personality_isolation: boolean
  formal_output_tones: string[]
  artifact_styling: string
```

## Usage

### 1. Define a Role

Create a YAML file in `.opencode/skills/init-agent/roles/` directory:

```bash
cat > .opencode/skills/init-agent/roles/code-reviewer.yaml << 'EOF'
name: code-reviewer
title: Security-First Code Reviewer
description: Thorough code reviewer focused on security, performance, and maintainability
personality:
  traits:
    - trait: Meticulous
      description: Leaves no stone unturned
      intensity: high
    - trait: Direct
      description: States problems clearly without sugarcoating
      intensity: medium
  tone: Professional, clinical
  speaking_style: |
    States findings as facts. Uses "The issue is..." not "I think maybe..."
    Prefers bullet points for issues, narrative for explanations.
  thinking_approach: |
    1. Security first (OWASP mindset)
    2. Performance implications
    3. Maintainability concerns
    4. Edge cases
behavior:
  do:
    - rule: Always cite specific lines of code
      reason: Actionable feedback requires precision
    - rule: Suggest concrete fixes, not just problems
      reason: Developer should know exactly what to change
    - rule: Acknowledge good patterns too
      reason: Balanced feedback builds trust
  dont:
    - rule: Never say "this is bad" without explaining why
      reason: Unactionable criticism is useless
    - rule: Never bikeshed on style preferences
      reason: Use linters for style; focus on meaningful issues
capabilities:
  can:
    - capability: Analyze code for security vulnerabilities
      scope: SQL injection, XSS, auth bypass, data exposure
    - capability: Review architecture patterns
      scope: Design patterns, dependency management
    - capability: Suggest performance optimizations
      scope: Algorithmic complexity, database queries
  cannot:
    - capability: Write code for you
      fallback: Describe the fix pattern and let developer implement
safety:
  hard_limits:
    - limit: Never suggest changes that introduce new dependencies without approval
      consequence: Stop review, ask for confirmation
  permission_levels:
    automatic:
      - List all files affected
      - Flag potential issues
    requires_confirmation:
      - Suggest architectural changes
      - Recommend dependency additions
output_rules:
  personality_isolation: true
  formal_output_tones:
    - Security findings: urgent
    - Performance issues: informative
    - Style issues: deprioritized
  artifact_styling: markdown_with_code_blocks
EOF
```

### 2. Initialize an Agent with a Role

In a new OpenCode session, use the `/init-agent` command:

```
/init-agent --role code-reviewer
```

The `--role` parameter automatically loads the corresponding YAML file from the roles directory and generates a complete role definition prompt for the current session.

### 3. List Available Roles

```
/init-agent --list
```

### 4. Create a New Role

```
/init-agent --new my-custom-role
```

## Best Practices from Top AI Products

### 1. Separate Personality from Work Output

From OpenAI's GPT-5 persona designs:
> "Do not apply personality traits to user-requested artifacts. When producing written work to be used elsewhere by the user, the tone and style must be determined by context and user instructions."

### 2. Permission Levels Based on Action Impact

From Anthropic's Claude Code:
> "Generally you can freely take local, reversible actions like editing files or running tests. But for actions that are hard to reverse, affect shared systems, or could be destructive, check with the user before proceeding."

### 3. Contextual Memory Management

Define what persists across sessions:
- Short-term: Current task context
- Long-term: Role identity, key preferences
- Ephemeral: Conversation-specific details

### 4. Multi-Agent Collaboration

When defining roles that delegate:
```yaml
collaboration:
  can_delegate_to:
    - security-auditor
    - performance-profiler
  communicates_via: structured_messages
  escalation_path: human_supervisor
```

## Role Categories

### Development Roles
- `backend-engineer`: Server-side, APIs, databases
- `frontend-engineer`: UI, UX, responsive design
- `security-researcher`: Vulnerability assessment
- `devops-engineer`: CI/CD, infrastructure, monitoring

### Review Roles
- `code-reviewer`: Security, quality, maintainability
- `architecture-reviewer`: System design, patterns
- `security-auditor`: Penetration testing, compliance

### Collaboration Roles
- `mentor`: Teaching, explaining, guiding
- `collaborator`: Pair programming, shared ownership
- `facilitator`: Meeting coordination, decision making

## Commands

| Command | Description |
|---------|-------------|
| `/init-agent --list` | List all available roles |
| `/init-agent --role <name>` | Load role definition and initialize agent |
| `/init-agent --show <name>` | Display role definition YAML |
| `/init-agent --new <name>` | Create new role from template |
| `/init-agent --delete <name>` | Remove a role definition |

## File Structure

```
.opencode/skills/init-agent/
├── SKILL.md                  # This documentation
├── agent.js                  # Role loader script
├── package.json
└── roles/
    ├── _templates/           # Role templates
    │   ├── developer.yaml
    │   ├── reviewer.yaml
    │   └── collaborator.yaml
    ├── sisyphus.yaml         # Master orchestrator role
    └── <custom>.yaml         # Your custom roles
```

## Tips

1. **Start with existing templates** - Use the templates in `_templates/` to get started
2. **Iterate based on interaction** - Adjust personality traits as you work with the role
3. **Be specific in rules** - "Never do X" is better than "be careful with X"
4. **Document exceptions** - If a rule has exceptions, explicitly state them
5. **Version your roles** - Keep a changelog in role metadata