# AGENTS.md — smartAgent (opencode-init-agent)

## Repository Purpose

OpenCode skill + npm package (`opencode-init-agent`) for defining reusable agent roles with personality, capabilities, and behavior patterns. Provides the `/init-agent` command in OpenCode sessions.

## Architecture

### Dual-package layout

| Location | Purpose |
|----------|---------|
| `package.json` (root) | npm-publishable package. `bin/init-agent` entrypoint. |
| `.opencode/skills/init-agent/` | Skill runtime installed into OpenCode. `agent.js` entrypoint. |

Both directories contain an `agent.js` CLI — they are **different files**:

- **`bin/init-agent`** (root, ~410 lines) — hand-rolled YAML parser, zero dependencies. Fewer commands.
- **`.opencode/skills/init-agent/agent.js`** (~842 lines) — uses `js-yaml` dependency. Supports `--interactive`, `--agents`, `--delegate`, `--session`, `--update` commands.

### Directory structure

```
.opencode/skills/init-agent/
├── SKILL.md                  # Skill documentation
├── agent.js                  # Full-featured CLI
├── package.json              # Deps: js-yaml
├── install.sh                # curl/wget-based installer
└── roles/
    ├── sisyphus.yaml         # Only baked-in role
    ├── _templates/
    │   ├── developer.yaml
    │   ├── reviewer.yaml
    │   └── collaborator.yaml
    └── _prompts/             # Delegation prompt templates (markdown)
        ├── explore.md
        ├── librarian.md
        ├── oracle.md
        ├── visual-engineering.md
        └── deep.md
```

### Key facts

- **No tests, no linter, no formatter, no typecheck configs** — zero verification infra. Be careful not to break things.
- **Two separate agent.js files** — editing the wrong one is a common mistake. Root `bin/init-agent` is the npm CLI wrapper; `.opencode/skills/init-agent/agent.js` is the full skill.
- **Role schema** (YAML): `name`, `title`, `description`, `personality`, `behavior`, `capabilities`, `safety`, `memory`, `collaboration`, `requires` (skills + MCPs), `subagent_definitions`, `output_rules`.
- **5 sub-agents** for delegation: `explore`, `librarian`, `oracle`, `visual-engineering`, `deep`. Each subagent can have `type` (direct agent) or `category` (task category) plus optional `model` and `description` in `subagent_definitions`.
- **Integration concept**: `init-agent` = WHO (role definition), `superpowers` = HOW (workflow).

## Commands

```bash
# Published npm package
npx opencode-init-agent --list
npx opencode-init-agent --role sisyphus              # Auto-installs skills/MCPs + writes config
npx opencode-init-agent --show developer
npx opencode-init-agent --new myrole
npx opencode-init-agent --agents
npx opencode-init-agent --delegate explore "search login"
npx opencode-init-agent --session [role]       # Show session snapshot with auto-generated subagent model config
npx opencode-init-agent --update [role]        # Persist auto-generated definitions into role YAML (self-evolution)
npx opencode-init-agent --install-deps [role]  # Install and configure skills/MCPs for role
npx opencode-init-agent install [target-dir]
```

```bash
# Install skill into OpenCode
cd <project>
npx opencode-init-agent install
# OR
node .opencode/skills/init-agent/agent.js install
# OR (if package.json has it configured)
npm run install-skill
```

## Role Dependencies & Agent Configuration

Roles declare required skills and MCP servers via the `requires` field:

```yaml
requires:
  skills:
    core: [brainstorming, writing-plans]          # Always loaded
    standard: [verification-before-completion]     # Most tasks
    all: [systematic-debugging, tdd]               # Full workflow
  mcp:
    core:
      - name: playwright
        description: Browser automation
  plugins:
    core: [rtk, node, git]                        # Always installed
    standard: [docker]                            # Most tasks
    all: [python3, curl]                          # Full workflow
```

- `--role <name>` auto-installs dependencies (skills, MCPs, plugins) and generates a `<name>.config.md` agent configuration file
- `--install-deps [role]` lists all required skills/MCPs/plugins and generates config without loading the role
- Tool layering (core/standard/all) follows claude-task-master's approach — load only what you need

## Self-evolution mechanism

The system can introspect its own capabilities and auto-generate subagent model/category definitions:

- `--session [role]` — scans `AVAILABLE_AGENTS` + prompt templates in `roles/_prompts/`, auto-generates `subagent_definitions`, and merges with any existing YAML definitions (YAML values take priority, auto-gen fills gaps)
- `--update [role]` — writes auto-generated subagent definitions back into the role YAML file, persisting newly discovered agents

This means roles without `subagent_definitions` still get full model config in `--session` output. The system defines itself from its own capabilities — YAML is optional, not required.

## CI / Publishing

- **CI trigger**: GitHub release published OR `workflow_dispatch`
- **Node version**: 22 (CI), >=14 (package.json `engines`)
- **Publish command**: `npm publish --access public`
- **No build step** — pure JS, publish as-is
- **Repository**: `https://github.com/fifaliao/smartAgent`

## Conventions

- **Personality isolation**: work artifacts must NOT reflect agent personality traits.
- **Permission levels**: `automatic` → `requires_confirmation` → `requires_escalation`.
- **Output styling**: markdown with code blocks, evidence before assertions.
- **All role YAML fields are optional** — the formatter handles missing sections gracefully.
- **Role naming**: kebab-case file names (`developer.yaml`), title-case display titles.


## Behavioral Guidelines for Agent Roles

These guidelines apply to all AI agents in this project. They are automatically added when a new role is created via `/init-agent --new`.

# Behavioral Guidelines

General principles to reduce common LLM coding mistakes. Merge with role-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

*These guidelines are working if: fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.*
