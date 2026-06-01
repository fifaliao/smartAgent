---
name: init-agent
description: "Use when starting a new project or session to initialize agent role definitions with personality, capabilities, constraints, and behavior patterns"
---

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

# Core identity and personality
personality:
  traits:                       # List of personality traits
    - trait: string
      description: string
      intensity: low|medium|high
  tone: string                  # Default communication tone
  speaking_style: string        # How the agent speaks
  thinking_approach: string     # Problem-solving methodology

# Behavioral rules
behavior:
  do:
    - rule: string
      reason: string
  dont:
    - rule: string
      reason: string

# What the role can/cannot do
capabilities:
  can:
    - capability: string
      scope: string
  cannot:
    - capability: string
      fallback: string  # What to do instead

# Safety and permission policies
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

# Memory and context handling
memory:
  session_persistence: boolean
  context_window_priority: string
  key_info_to_retain: string[]

# Collaboration patterns
collaboration:
  can_delegate_to: string[]     # Role names this can call
  communicates_via: string      # Message format/style
  escalation_path: string

# Work output rules (personality vs product separation)
output_rules:
  personality_isolation: boolean  # Don't let personality affect work
  formal_output_tones: string[]
  artifact_styling: string

# Required dependencies (auto-installed on --role)
requires:
  skills:                         # OpenCode skills to load
    core: string[]                #   Always loaded
    standard: string[]            #   Most tasks
    all: string[]                 #   Full workflow
  mcp:                            # MCP servers to configure
    core: [{name, description}]   #   Always configured
    standard: [{name, description}]
    all: [{name, description}]
  plugins:                        # CLI tools to install
    core: string[]                #   Always installed
    standard: string[]
    all: string[]

# Subagent model configurations (auto-generated or manual)
subagent_definitions:
  agent_name:                     # Matches can_delegate_to entries
    type: string                  #   Agent type (explore, librarian, oracle)
    category: string              #   OR task category (visual-engineering, deep)
    description: string           #   When to delegate to this agent
```

## Usage

### 1. Define a Role

Create a YAML file in `.opencode/roles/` directory:

```bash
# Example: Define a code reviewer role
cat > .opencode/roles/code-reviewer.yaml << 'EOF'
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

Or inline the role definition:

```
/init-agent << 'EOF'
name: sisyphus
title: Senior Backend Engineer
personality:
  traits:
    - trait: Methodical
      intensity: high
    - trait: Pragmatic
      intensity: medium
  speaking_style: Technical, concise, uses analogies
behavior:
  do:
    - rule: Understand the problem before proposing solutions
    - rule: Write code that the next person can understand
    - rule: Consider edge cases and error handling
  dont:
    - rule: Don't over-engineer
    - rule: Don't assume, verify
EOF
```

### 3. Role Invocation in Code

```typescript
// In your OpenCode session, invoke a role:
import { initAgent } from '@opencode/agent';

// Load a role definition
const role = await initAgent({
  role: 'code-reviewer',
  // or inline:
  // definition: { name: '...', personality: {...} }
});

// The agent now has the role's identity and rules baked into its context
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
| `/init-agent --role <name>` | Initialize with role (auto-installs deps, writes config) |
| `/init-agent --show <name>` | Display role YAML definition |
| `/init-agent --new <name>` | Create a new role (smart analysis) |
| `/init-agent --new <name> --interactive` | Create a role interactively |
| `/init-agent --install-deps <name>` | Install skills, MCPs, plugins for a role |
| `/init-agent --session [role]` | Show session snapshot with auto-generated subagent configs |
| `/init-agent --update [role]` | Persist auto-generated subagent definitions into YAML |
| `/init-agent --agents` | List sub-agents available for delegation |
| `/init-agent --delegate <agent> <scenario>` | Generate a delegation prompt |
| `/init-agent install [dir]` | Install the skill into a target directory |

### Plugin & Tool Layering

The `requires` field in role YAML supports three tiers of dependencies:

```yaml
requires:
  skills:                       # OpenCode skills
    core: [brainstorming]       #   Always loaded
    standard: [debugging]       #   Most tasks
    all: [tdd]                  #   Full workflow
  mcp:                          # MCP servers
    core:
      - name: playwright
  plugins:                      # CLI tools
    core: [rtk, node, git]
    standard: [docker]
    all: [python3, curl]
```

| Tier | Loaded When |
|------|-------------|
| **core** | Always — essential for the role |
| **standard** | Most tasks — common but not universal |
| **all** | Full workflow — specialized needs |

## File Structure

```
.opencode/skills/init-agent/
├── SKILL.md                  # This file
├── agent.js                  # CLI tool (full-featured, ~1100 lines)
├── package.json              # Dependencies (js-yaml)
├── install.sh                # curl/wget installer
└── roles/
    ├── sisyphus.yaml          # Built-in orchestrator role
    ├── _templates/            # Role templates
    │   ├── developer.yaml
    │   ├── reviewer.yaml
    │   └── collaborator.yaml
    └── _prompts/              # Delegation prompt templates
        ├── explore.md
        ├── librarian.md
        ├── oracle.md
        ├── visual-engineering.md
        └── deep.md
```

## Tips

1. **Start with existing templates** - Use the templates in `_templates/` to get started
2. **Iterate based on interaction** - Adjust personality traits as you work with the role
3. **Be specific in rules** - "Never do X" is better than "be careful with X"
4. **Document exceptions** - If a rule has exceptions, explicitly state them
5. **Version your roles** - Keep a changelog in role metadata

## Examples

### Minimal Role
```yaml
name: minimalist
title: Minimalist Coder
personality:
  traits:
    - trait: Concise
  behavior:
    do:
      - rule: Prefer the simplest solution
    dont:
      - rule: Don't add functionality not requested
capabilities:
  can:
    - capability: Write clean, focused code
  cannot:
    - capability: Speculate about future needs
      fallback: Ask what the user actually needs
```

### Full-Featured Role
See `.opencode/roles/_templates/full-featured.yaml` for complete schema with all options documented.