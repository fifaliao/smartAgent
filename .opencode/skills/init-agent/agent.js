#!/usr/bin/env node

/**
 * init-agent - Role-based agent initialization
 *
 * Usage:
 *   /init-agent --list                      List all available roles
 *   /init-agent --role <name>              Load and output role definition
 *   /init-agent --show <name>              Display role without loading
 *   /init-agent --new <name>               Create new role (interactive)
 *   /init-agent --interactive              Create role interactively
 *   /init-agent --agents                   List sub-agents for delegation
 *   /init-agent --delegate <agent> <scenario>  Generate delegation prompt
 *   /init-agent install [dir]              Install skill to directory
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const yaml = require('js-yaml');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}[info]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[success]${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}[warn]${colors.reset} ${msg}`),
  step: (msg) => console.log(`${colors.cyan}[step]${colors.reset} ${msg}`),
  prompt: (msg) => console.log(`${colors.magenta}[prompt]${colors.reset} ${msg}`),
};

const SKILL_DIR = __dirname;
const ROLES_DIR = path.join(SKILL_DIR, 'roles');
const PROMPTS_DIR = path.join(ROLES_DIR, '_prompts');

const AVAILABLE_AGENTS = ['explore', 'librarian', 'oracle', 'visual-engineering', 'deep'];

// Default category/type mappings for each subagent — used when a role
// YAML doesn't define subagent_definitions. These are the known-good
// assignments for the OpenCode task() API.
const AGENT_DEFAULTS = {
  explore:      { type: 'explore',                           description: 'Codebase pattern search and location using grep, ripgrep, and AST-grep' },
  librarian:    { type: 'librarian',                         description: 'External documentation and open-source reference search via Context7 and GitHub' },
  oracle:       { type: 'oracle', category: 'ultrabrain',    description: 'High-IQ reasoning for architecture decisions, hard debugging, and tradeoff analysis' },
  'visual-engineering': { category: 'visual-engineering',   description: 'Frontend, UI/UX, design, styling, animation tasks' },
  deep:         { category: 'deep',                          description: 'Goal-oriented autonomous problem-solving with thorough research before action' },
};

// ---------------------------------------------------------------------------
// Utility: interactive prompt
// ---------------------------------------------------------------------------
function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// ---------------------------------------------------------------------------
// Role listing / loading / formatting
// ---------------------------------------------------------------------------
function listRoles() {
  const roles = [];
  const entries = fs.readdirSync(ROLES_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith('.yaml')) {
      const name = entry.name.replace('.yaml', '');
      if (!name.startsWith('_')) {
        roles.push(name);
      }
    }
    if (entry.isDirectory()) {
      const templatePath = path.join(ROLES_DIR, entry.name);
      const files = fs.readdirSync(templatePath);
      for (const f of files) {
        if (f.endsWith('.yaml')) {
          roles.push(`${entry.name}/${f.replace('.yaml', '')}`);
        }
      }
    }
  }

  return roles;
}

function loadRole(name) {
  // Try direct match
  let rolePath = path.join(ROLES_DIR, `${name}.yaml`);
  if (fs.existsSync(rolePath)) {
    return yaml.load(fs.readFileSync(rolePath, 'utf8'));
  }

  // Try in subdirectories
  const entries = fs.readdirSync(ROLES_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const fullPath = path.join(ROLES_DIR, entry.name, `${name}.yaml`);
      if (fs.existsSync(fullPath)) {
        return yaml.load(fs.readFileSync(fullPath, 'utf8'));
      }
    }
  }

  return null;
}

function formatRoleAsPrompt(role) {
  if (!role) return null;

  let prompt = `# Role: ${role.title || role.name}\n\n`;
  prompt += `${role.description || ''}\n\n`;

  if (role.personality) {
    prompt += `## Identity\n`;
    if (role.personality.traits) {
      prompt += `**Traits:** ${role.personality.traits.map(t => `${t.trait} (${t.intensity})`).join(', ')}\n`;
    }
    if (role.personality.tone) {
      prompt += `**Tone:** ${role.personality.tone}\n`;
    }
    if (role.personality.speaking_style) {
      prompt += `**Speaking Style:** ${role.personality.speaking_style}\n`;
    }
    if (role.personality.thinking_approach) {
      prompt += `**Thinking Approach:**\n${role.personality.thinking_approach}\n`;
    }
    prompt += '\n';
  }

  if (role.behavior) {
    prompt += `## Behavior Rules\n`;
    if (role.behavior.do) {
      prompt += `**Do:**\n`;
      for (const d of role.behavior.do) {
        prompt += `- ${d.rule}${d.reason ? ` (${d.reason})` : ''}\n`;
      }
    }
    if (role.behavior.dont) {
      prompt += `**Don't:**\n`;
      for (const d of role.behavior.dont) {
        prompt += `- ${d.rule}${d.reason ? ` (${d.reason})` : ''}\n`;
      }
    }
    prompt += '\n';
  }

  if (role.capabilities) {
    prompt += `## Capabilities\n`;
    if (role.capabilities.can) {
      prompt += `**Can:**\n`;
      for (const c of role.capabilities.can) {
        prompt += `- ${c.capability}${c.scope ? ` (${c.scope})` : ''}\n`;
      }
    }
    if (role.capabilities.cannot) {
      prompt += `**Cannot:**\n`;
      for (const c of role.capabilities.cannot) {
        prompt += `- ${c.capability}${c.fallback ? ` → ${c.fallback}` : ''}\n`;
      }
    }
    prompt += '\n';
  }

  if (role.safety) {
    prompt += `## Safety Policies\n`;
    if (role.safety.hard_limits) {
      prompt += `**Hard Limits:**\n`;
      for (const h of role.safety.hard_limits) {
        prompt += `- ${h.limit}${h.consequence ? ` (consequence: ${h.consequence})` : ''}\n`;
      }
    }
    if (role.safety.permission_levels) {
      prompt += `**Permission Levels:**\n`;
      const pl = role.safety.permission_levels;
      if (pl.automatic) {
        prompt += `- **Automatic:** ${pl.automatic.join(', ')}\n`;
      }
      if (pl.requires_confirmation) {
        prompt += `- **Requires Confirmation:** ${pl.requires_confirmation.join(', ')}\n`;
      }
      if (pl.requires_escalation) {
        prompt += `- **Requires Escalation:** ${pl.requires_escalation.join(', ')}\n`;
      }
    }
    prompt += '\n';
  }

  if (role.collaboration) {
    prompt += `## Collaboration\n`;
    if (role.collaboration.can_delegate_to) {
      prompt += `**Can delegate to:** ${role.collaboration.can_delegate_to.join(', ')}\n`;
    }
    if (role.collaboration.escalation_path) {
      prompt += `**Escalation path:** ${role.collaboration.escalation_path}\n`;
    }
    prompt += '\n';
  }

  if (role.requires) {
    prompt += `## Required Dependencies\n`;
    const { skills, mcp } = role.requires;
    if (skills) {
      prompt += `**Skills:**\n`;
      if (skills.core) prompt += `- Core: ${skills.core.join(', ')}\n`;
      if (skills.standard) prompt += `- Standard: ${skills.standard.join(', ')}\n`;
      if (skills.all) prompt += `- All: ${skills.all.join(', ')}\n`;
    }
    if (mcp) {
      prompt += `**MCP Servers:**\n`;
      for (const tier of ['core', 'standard', 'all']) {
        if (mcp[tier] && mcp[tier].length) {
          const names = mcp[tier].map(m => m.name || m).join(', ');
          prompt += `- ${tier.charAt(0).toUpperCase() + tier.slice(1)}: ${names}\n`;
        }
      }
    }
    prompt += '\n';
  }

  if (role.subagent_definitions) {
    prompt += `## Subagent Definitions\n\n`;
    prompt += `| Agent | Type / Category | Description |\n`;
    prompt += `|-------|-----------------|-------------|\n`;
    for (const [name, def] of Object.entries(role.subagent_definitions)) {
      const typeOrCat = def.category || def.type || 'auto';
      const desc = (def.description || '').replace(/\n/g, ' ');
      prompt += `| ${name} | ${typeOrCat} | ${desc} |\n`;
    }
    prompt += '\n';
  }

  if (role.output_rules) {
    prompt += `## Output Rules\n`;
    prompt += `**Personality Isolation:** ${role.output_rules.personality_isolation ? 'Enabled' : 'Disabled'}\n`;
    if (role.output_rules.formal_output_tones) {
      const tones = role.output_rules.formal_output_tones.map(t => {
        if (typeof t === 'object') {
          return Object.entries(t).map(([k, v]) => `${k}: ${v}`).join(', ');
        }
        return String(t);
      }).join('; ');
      prompt += `**Formal tones:** ${tones}\n`;
    }
  }

  return prompt;
}

// ---------------------------------------------------------------------------
// Delegation prompt templates
// ---------------------------------------------------------------------------
// Auto-generate subagent definitions from system state (AVAILABLE_AGENTS,
// AGENT_DEFAULTS, and existence of prompt template files). This is the
// self-evolution mechanism — the system defines itself from its own
// capabilities, without depending on pre-written YAML.
function generateSubagentDefinitions() {
  const defs = {};
  for (const agent of AVAILABLE_AGENTS) {
    const defaults = AGENT_DEFAULTS[agent] || {};
    const templatePath = path.join(PROMPTS_DIR, `${agent}.md`);
    const hasTemplate = fs.existsSync(templatePath);
    defs[agent] = {
      type: defaults.type || null,
      category: defaults.category || null,
      description: defaults.description || `${agent} subagent`,
      has_template: hasTemplate,
    };
    // Clean up null values so output stays tidy
    if (!defs[agent].type) delete defs[agent].type;
    if (!defs[agent].category) delete defs[agent].category;
  }
  return defs;
}

// Write auto-generated subagent definitions into a role YAML file.
// Used by --update and automatically by install() after skill upgrade.
function updateRoleYaml(name, rolesDir) {
  const rolePath = path.join(rolesDir, `${name}.yaml`);
  if (!fs.existsSync(rolePath)) {
    log.warn(`Role '${name}' not found in ${rolesDir}, skipping`);
    return false;
  }
  const text = fs.readFileSync(rolePath, 'utf8');
  const role = yaml.load(text);
  if (!role) {
    log.warn(`Could not parse ${rolePath}, skipping`);
    return false;
  }
  const autoDefs = generateSubagentDefinitions();
  if (!role.subagent_definitions) {
    role.subagent_definitions = {};
  }
  for (const [agent, def] of Object.entries(autoDefs)) {
    if (!role.subagent_definitions[agent]) {
      const cleanDef = {};
      if (def.type) cleanDef.type = def.type;
      if (def.category) cleanDef.category = def.category;
      if (def.description) cleanDef.description = def.description;
      role.subagent_definitions[agent] = cleanDef;
    }
  }
  const yamlStr = yaml.dump(role, { indent: 2, lineWidth: 120, noRefs: true });
  fs.writeFileSync(rolePath, yamlStr, 'utf8');
  return true;
}

// Collect all skill names from role.requires.skills across all tiers.
function getRequiredSkills(role) {
  const skills = [];
  if (!role.requires || !role.requires.skills) return skills;
  const tiers = ['core', 'standard', 'all'];
  for (const tier of tiers) {
    if (role.requires.skills[tier]) {
      skills.push(...role.requires.skills[tier]);
    }
  }
  return [...new Set(skills)];
}

// Collect all MCP names from role.requires.mcp across all tiers.
function getRequiredMcp(role) {
  const mcps = [];
  if (!role.requires || !role.requires.mcp) return mcps;
  const tiers = ['core', 'standard', 'all'];
  for (const tier of tiers) {
    if (role.requires.mcp[tier]) {
      mcps.push(...role.requires.mcp[tier]);
    }
  }
  return mcps;
}

// Format role dependency requirements for display.
function formatRoleRequirements(role) {
  const lines = [];
  if (!role.requires) return '';
  const { skills, mcp } = role.requires;
  if (skills) {
    lines.push('### Skills');
    if (skills.core && skills.core.length) lines.push(`- **Core:** ${skills.core.join(', ')}`);
    if (skills.standard && skills.standard.length) lines.push(`- **Standard:** ${skills.standard.join(', ')}`);
    if (skills.all && skills.all.length) lines.push(`- **All:** ${skills.all.join(', ')}`);
  }
  if (mcp) {
    lines.push('### MCP Servers');
    for (const tier of ['core', 'standard', 'all']) {
      if (mcp[tier] && mcp[tier].length) {
        const names = mcp[tier].map(m => m.name || m).join(', ');
        lines.push(`- **${tier.charAt(0).toUpperCase() + tier.slice(1)}:** ${names}`);
      }
    }
  }
  if (lines.length) lines.unshift('', '## Required Dependencies');
  return lines.join('\n');
}

// Generate markdown configuration block for the agent prompt.
// This is the output that feeds back into the agent's system prompt.
function generateAgentConfig(roleName, role) {
  let config = '';
  config += `## Agent Configuration: ${roleName}\n\n`;
  config += `**Role:** ${role.title || roleName}\n`;
  if (role.description) config += `**Description:** ${role.description}\n`;
  config += `**Subagents:** ${Object.keys(role.subagent_definitions || {}).length} configured\n`;
  const skills = getRequiredSkills(role);
  if (skills.length) {
    config += `**Skills:** ${skills.join(', ')}\n`;
    config += `**Skill load command:** task(load_skills=[${skills.map(s => `"${s}"`).join(', ')}], ...)\n`;
  }
  const mcps = getRequiredMcp(role);
  if (mcps.length) {
    const mcpNames = mcps.map(m => m.name || m).join(', ');
    config += `**MCP Servers:** ${mcpNames}\n`;
  }
  config += '\n---\n';
  return config;
}

function listAgents() {
  return AVAILABLE_AGENTS;
}

function loadDelegationPromptTemplate(agentType) {
  const templatePath = path.join(PROMPTS_DIR, `${agentType}.md`);
  if (!fs.existsSync(templatePath)) {
    return null;
  }
  return fs.readFileSync(templatePath, 'utf8');
}

function formatDelegationPrompt(agentType, scenario) {
  const template = loadDelegationPromptTemplate(agentType);
  if (!template) {
    console.error(`Error: No prompt template found for agent type '${agentType}'`);
    console.error(`Available agent types: ${AVAILABLE_AGENTS.join(', ')}`);
    process.exit(1);
  }

  let prompt = template.replace(
    /^TASK:\s*\[具体搜索目标\]\s*\n/im,
    `TASK: ${scenario}\n`
  );
  prompt = prompt.replace(
    /^TASK:\s*\[具体问题描述\]\s*\n/im,
    `TASK: ${scenario}\n`
  );
  prompt = prompt.replace(
    /^TASK:\s*\[具体功能描述\]\s*\n/im,
    `TASK: ${scenario}\n`
  );
  prompt = prompt.replace(
    /^TASK:\s*\[具体视觉任务\]\s*\n/im,
    `TASK: ${scenario}\n`
  );

  return prompt;
}

// ---------------------------------------------------------------------------
// Role name analysis (remote version)
// ---------------------------------------------------------------------------
function analyzeRoleName(name) {
  const analysis = {
    isClear: false,
    suggestedTitle: '',
    suggestedTraits: [],
    suggestedCapabilities: [],
    confidence: 0,
    keywords: [],
  };

  const keywords = name.toLowerCase().split(/[-_]/);
  analysis.keywords = keywords;

  const patterns = {
    developer: {
      title: 'Software Developer',
      traits: ['Pragmatic', 'Methodical'],
      capabilities: ['Write code', 'Debug', 'Design APIs'],
      confidence: 1,
    },
    reviewer: {
      title: 'Code Reviewer',
      traits: ['Meticulous', 'Direct'],
      capabilities: ['Security analysis', 'Performance review', 'Code quality check'],
      confidence: 1,
    },
    collaborator: {
      title: 'Pair Programming Partner',
      traits: ['Curious', 'Patient', 'Interactive'],
      capabilities: ['Pair programming', 'Explain concepts', 'Debug together'],
      confidence: 1,
    },
    sisyphus: {
      title: 'Senior AI Engineer',
      traits: ['Methodical', 'Orchestrator', 'Quality-Focused'],
      capabilities: ['Orchestrate agents', 'Plan tasks', 'Verify results'],
      confidence: 1,
    },
    backend: {
      title: 'Backend Engineer',
      traits: ['Pragmatic', 'Systematic'],
      capabilities: ['API design', 'Database', 'Server logic'],
      confidence: 0.8,
    },
    frontend: {
      title: 'Frontend Engineer',
      traits: ['Creative', 'Detail-oriented'],
      capabilities: ['UI development', 'CSS', 'JavaScript'],
      confidence: 0.8,
    },
    security: {
      title: 'Security Researcher',
      traits: ['Analytical', 'Cautious'],
      capabilities: ['Vulnerability assessment', 'Security audit'],
      confidence: 0.8,
    },
    devops: {
      title: 'DevOps Engineer',
      traits: ['Systematic', 'Automation-focused'],
      capabilities: ['CI/CD', 'Infrastructure', 'Monitoring'],
      confidence: 0.8,
    },
    architect: {
      title: 'System Architect',
      traits: ['Strategic', 'Holistic'],
      capabilities: ['System design', 'Pattern selection', 'Technology choices'],
      confidence: 0.8,
    },
    mentor: {
      title: 'Tech Mentor',
      traits: ['Patient', 'Educational'],
      capabilities: ['Teaching', 'Code review', 'Career guidance'],
      confidence: 0.8,
    },
  };

  for (const [pattern, config] of Object.entries(patterns)) {
    if (keywords.some((k) => k.includes(pattern))) {
      analysis.isClear = true;
      analysis.suggestedTitle = config.title;
      analysis.suggestedTraits = config.traits;
      analysis.suggestedCapabilities = config.capabilities;
      analysis.confidence = config.confidence;
      break;
    }
  }

  if (!analysis.isClear) {
    analysis.suggestedTitle = name
      .split(/[-_]/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  return analysis;
}

function generateRoleYaml(name, options = {}) {
  const analysis = analyzeRoleName(name);

  let title = options.title || analysis.suggestedTitle;
  let description = options.description || `Custom role: ${name}`;
  let traits = options.traits || analysis.suggestedTraits;
  let capabilities = options.capabilities || analysis.suggestedCapabilities;

  const yaml = `name: ${name}
title: ${title}

description: ${description}

personality:
  traits:
${traits.map((t) => `    - trait: ${t}\n      intensity: medium`).join('\n')}
  tone: Professional
  speaking_style: |
    Clear and direct. Uses examples to illustrate points.
    Prefers concise explanations.
  thinking_approach: |
    1. Understand the problem
    2. Break down into steps
    3. Execute methodically
    4. Verify results

behavior:
  do:
    - rule: Always confirm before destructive actions
      reason: Safety first
    - rule: Keep user informed of progress
      reason: Transparency builds trust
  dont:
    - rule: Don't make assumptions
      reason: Ask for clarification
    - rule: Don't skip verification
      reason: Quality assurance

capabilities:
  can:
${capabilities.map((c) => `    - capability: ${c}`).join('\n')}
  cannot:
    - capability: Make irreversible decisions
      fallback: Ask user for confirmation

safety:
  hard_limits:
    - limit: Never skip safety checks
      consequence: Stop and confirm
  permission_levels:
    automatic:
      - Read files
      - Create TODO items
    requires_confirmation:
      - Write or modify files
      - Run commands
    requires_escalation:
      - Destructive operations
      - System-level changes

output_rules:
  personality_isolation: true
  artifact_styling: markdown_with_code_blocks
`;

  return yaml;
}

async function createRoleInteractive(name, options = {}) {
  log.step(`Creating role: ${name}`);

  const analysis = analyzeRoleName(name);

  if (analysis.isClear && analysis.confidence >= 0.8 && !options.interactive) {
    log.info(`Detected role type: ${analysis.suggestedTitle}`);
    log.success('Role definition looks clear. Creating directly...');
  } else {
    log.warn("Role name is not clear enough. Let's clarify some details.");

    if (!options.description) {
      const desc = await prompt('Description (optional, press Enter to skip): ');
      if (desc) options.description = desc;
    }

    if (!options.title) {
      const titleConfirm = await prompt(
        `Title [${analysis.suggestedTitle}]: `
      );
      if (titleConfirm) options.title = titleConfirm;
    }

    if (analysis.suggestedTraits.length > 0) {
      log.info(`Suggested traits: ${analysis.suggestedTraits.join(', ')}`);
      const traitsConfirm = await prompt(
        'Confirm traits (comma-separated, press Enter to accept): '
      );
      if (traitsConfirm) {
        options.traits = traitsConfirm.split(',').map((t) => t.trim());
      }
    }

    if (analysis.suggestedCapabilities.length > 0) {
      log.info(`Suggested capabilities: ${analysis.suggestedCapabilities.join(', ')}`);
      const capConfirm = await prompt(
        'Confirm capabilities (comma-separated, press Enter to accept): '
      );
      if (capConfirm) {
        options.capabilities = capConfirm.split(',').map((c) => c.trim());
      }
    }
  }

  const yamlContent = generateRoleYaml(name, options);

  const rolePath = path.join(ROLES_DIR, `${name}.yaml`);
  fs.writeFileSync(rolePath, yamlContent);

  log.success(`Role '${name}' created at ${rolePath}`);
  return rolePath;
}

// ---------------------------------------------------------------------------
// Install command
// ---------------------------------------------------------------------------
function install(targetDir) {
  log.info(`Installing init-agent skill to ${targetDir}`);

  const targetSkillsDir = path.join(targetDir, '.opencode', 'skills', 'init-agent');
  const targetRolesDir = path.join(targetSkillsDir, 'roles');

  if (!fs.existsSync(targetRolesDir)) {
    fs.mkdirSync(targetRolesDir, { recursive: true });
  }

  const filesToCopy = ['SKILL.md', 'agent.js', 'package.json'];
  for (const file of filesToCopy) {
    const src = path.join(SKILL_DIR, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(targetSkillsDir, file));
    }
  }

  if (fs.existsSync(ROLES_DIR)) {
    const entries = fs.readdirSync(ROLES_DIR, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.yaml') && !entry.name.startsWith('_')) {
        fs.copyFileSync(
          path.join(ROLES_DIR, entry.name),
          path.join(targetRolesDir, entry.name)
        );
      }
      if (entry.isDirectory()) {
        const templatesDst = path.join(targetRolesDir, entry.name);
        fs.mkdirSync(templatesDst, { recursive: true });
        const templates = fs.readdirSync(path.join(ROLES_DIR, entry.name));
        for (const t of templates) {
          if (t.endsWith('.yaml') || t.endsWith('.md')) {
            fs.copyFileSync(
              path.join(ROLES_DIR, entry.name, t),
              path.join(templatesDst, t)
            );
          }
        }
      }
    }
  }

  // Auto-update subagent definitions in the target role YAML.
  // Ensures that after skill upgrade/install, subagent model configs
  // stay in sync with the current system state.
  const updated = updateRoleYaml('sisyphus', targetRolesDir);
  if (updated) {
    log.success('Auto-updated subagent definitions in sisyphus.yaml');
  }

  log.success('Installation complete!');
}

// ---------------------------------------------------------------------------
// Help
// ---------------------------------------------------------------------------
function showHelp() {
  console.log(`init-agent - Role-based agent initialization for OpenCode

${colors.green}Commands:${colors.reset}
  init-agent --list                       List all available roles
  init-agent --role <name>                Load and initialize with role
  init-agent --show <name>                Display role definition
  init-agent --new <name> [--desc DESC] [--interactive]  Create new role
  init-agent --interactive                Create role interactively
  init-agent --agents                     List sub-agents for delegation
  init-agent --delegate <agent> <scenario> Generate delegation prompt
  init-agent --session [role]             Show session role snapshot with auto-generated model config
  init-agent --update [role]              Persist auto-generated subagent definitions into YAML
  init-agent --install-deps [role]        Install and configure skills/MCPs for role
  init-agent install [dir]                Install skill to directory

${colors.green}Examples:${colors.reset}
  init-agent --list                       Show available roles
  init-agent --role sisyphus             Initialize with sisyphus role
  init-agent --new myrole                 Create role with clear name
  init-agent --new myrole --desc "A custom role for..."  Create with description
  init-agent --new myrole --interactive   Interactive creation with questions
  init-agent --agents                     List available sub-agents
  init-agent --delegate explore "搜索用户登录"  Generate delegation prompt
  init-agent install                       Install to current directory`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  showHelp();
  process.exit(0);
}
const command = args[0];

switch (command) {
  case 'install': {
    const targetDir = args[1] || process.cwd();
    install(targetDir);
    break;
  }

  case '--list':
  case '-l': {
    const roles = listRoles();
    console.log('Available roles:');
    for (const r of roles) {
      console.log(`  - ${r}`);
    }
    break;
  }

  case '--role':
  case '-r': {
    const name = args[1];
    if (!name) {
      console.error('Error: Role name required');
      process.exit(1);
    }

    const role = loadRole(name);
    if (!role) {
      console.error(`Error: Role '${name}' not found`);
      const roles = listRoles();
      console.error('Available roles:', roles.join(', '));
      process.exit(1);
    }

    const prompt = formatRoleAsPrompt(role);
    console.log(prompt);

    if (role.requires) {
      log.step(`Auto-installing dependencies for role '${name}'...`);
      const skills = getRequiredSkills(role);
      const mcps = getRequiredMcp(role);
      if (skills.length) log.info(`Skills to load (${skills.length}): ${skills.join(', ')}`);
      if (mcps.length) log.info(`MCP servers to configure (${mcps.length}): ${mcps.map(m => m.name || m).join(', ')}`);
      log.info('Use task(load_skills=[...]) to load these skills at runtime.');

      const configBlock = generateAgentConfig(name, role);
      const configPath = path.join(ROLES_DIR, `${name}.config.md`);
      fs.writeFileSync(configPath, configBlock, 'utf8');
      log.success(`Agent configuration saved to ${configPath}`);
    }
    break;
  }

  case '--show': {
    const name = args[1];
    if (!name) {
      console.error('Error: Role name required');
      process.exit(1);
    }

    const role = loadRole(name);
    if (!role) {
      console.error(`Error: Role '${name}' not found`);
      process.exit(1);
    }

    console.log(yaml.dump(role, { indent: 2, lineWidth: 120 }));
    break;
  }

  case '--session':
  case '-s': {
    const name = args[1] || 'sisyphus';
    const role = loadRole(name);
    const autoGenRole = role ? JSON.parse(JSON.stringify(role)) : { name, title: name, description: '' };
    // Auto-generate subagent definitions from system state.
    // If the role already has subagent_definitions, merge: YAML values
    // override auto-generated ones, but auto-gen adds any missing agents
    // (e.g. newly registered agents not yet in the YAML).
    const autoDefs = generateSubagentDefinitions();
    if (autoGenRole.subagent_definitions) {
      for (const [agent, def] of Object.entries(autoDefs)) {
        if (!autoGenRole.subagent_definitions[agent]) {
          autoGenRole.subagent_definitions[agent] = def;
        }
      }
    } else {
      autoGenRole.subagent_definitions = autoDefs;
    }
    const sessionPrompt = formatRoleAsPrompt(autoGenRole);
    console.log(sessionPrompt);
    const agentCount = Object.keys(autoGenRole.subagent_definitions).length;
    const templateCount = AVAILABLE_AGENTS.filter(a =>
      fs.existsSync(path.join(PROMPTS_DIR, `${a}.md`))
    ).length;
    const skills = getRequiredSkills(autoGenRole);
    const mcps = getRequiredMcp(autoGenRole);
    console.log('---');
    console.log(`Session role: ${autoGenRole.title || autoGenRole.name}`);
    console.log(`Subagents: ${agentCount} registered, ${templateCount} with prompt templates`);
    if (skills.length) console.log(`Skills: ${skills.length} required (${skills.join(', ')})`);
    if (mcps.length) console.log(`MCP servers: ${mcps.length} required (${mcps.map(m => m.name || m).join(', ')})`);
    break;
  }

  case '--update':
  case '-u': {
    const name = args[1] || 'sisyphus';
    // Look up the role file (direct match or in subdirectories)
    let rolesDir = ROLES_DIR;
    let rolePath = path.join(ROLES_DIR, `${name}.yaml`);
    if (!fs.existsSync(rolePath)) {
      const entries = fs.readdirSync(ROLES_DIR, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const subPath = path.join(ROLES_DIR, entry.name, `${name}.yaml`);
          if (fs.existsSync(subPath)) {
            rolesDir = path.join(ROLES_DIR, entry.name);
            break;
          }
        }
      }
    }
    if (updateRoleYaml(name, rolesDir)) {
      log.success(`Updated subagent definitions for role '${name}'`);
    } else {
      console.error(`Error: Role '${name}' not found`);
      process.exit(1);
    }
    break;
  }

  case '--new': {
    const name = args[1];
    if (!name) {
      console.error('Error: Role name required');
      process.exit(1);
    }

    const options = {
      description: null,
      interactive: false,
    };

    for (let i = 2; i < args.length; i++) {
      if (args[i] === '--desc' && args[i + 1]) {
        options.description = args[i + 1];
        i++;
      } else if (args[i] === '--interactive') {
        options.interactive = true;
      }
    }

    const rolePath = path.join(ROLES_DIR, `${name}.yaml`);
    if (fs.existsSync(rolePath)) {
      log.warn(`Role '${name}' already exists. Use --show to view or delete first.`);
      process.exit(1);
    }

    createRoleInteractive(name, options).catch((err) => {
      console.error('Error:', err.message);
      process.exit(1);
    });
    break;
  }

  case '--interactive':
  case '-i': {
    (async () => {
      const name = await prompt('Role name: ');
      if (!name) {
        console.error('Error: Role name required');
        process.exit(1);
      }

      const options = {
        description: await prompt('Description: '),
        interactive: true,
      };

      await createRoleInteractive(name, options);
    })().catch((err) => {
      console.error('Error:', err.message);
      process.exit(1);
    });
    break;
  }

  case '--agents':
  case '-a': {
    console.log('Available sub-agents for delegation:');
    for (const agent of AVAILABLE_AGENTS) {
      const templatePath = path.join(PROMPTS_DIR, `${agent}.md`);
      const hasTemplate = fs.existsSync(templatePath);
      console.log(`  - ${agent}${hasTemplate ? ' (prompt template available)' : ' (no template)'}`);
    }
    break;
  }

  case '--delegate': {
    const agentType = args[1];
    const scenario = args.slice(2).join(' ');

    if (!agentType || !scenario) {
      console.error('Error: Agent type and scenario required');
      console.error('Usage: /init-agent --delegate <agent> <scenario>');
      console.error(`Available agents: ${AVAILABLE_AGENTS.join(', ')}`);
      process.exit(1);
    }

    if (!AVAILABLE_AGENTS.includes(agentType)) {
      console.error(`Error: Unknown agent type '${agentType}'`);
      console.error(`Available agents: ${AVAILABLE_AGENTS.join(', ')}`);
      process.exit(1);
    }

    const prompt = formatDelegationPrompt(agentType, scenario);
    console.log(prompt);
    break;
  }

  case '--install-deps':
  case '-d': {
    const name = args[1] || 'sisyphus';
    const role = loadRole(name);
    if (!role) {
      console.error(`Error: Role '${name}' not found`);
      process.exit(1);
    }
    const skills = getRequiredSkills(role);
    const mcps = getRequiredMcp(role);
    log.step(`Installing dependencies for role '${name}'...`);
    if (skills.length) {
      log.info(`Skills to load: ${skills.length}`);
      for (const skill of skills) {
        log.success(`  skill: ${skill} — use task(load_skills=["${skill}"], ...)`);
      }
    } else log.info('No skill requirements found.');
    if (mcps.length) {
      log.info(`MCP servers to configure: ${mcps.length}`);
      for (const m of mcps) {
        const mcpName = m.name || m;
        log.success(`  mcp: ${mcpName}${m.description ? ` — ${m.description}` : ''}`);
      }
    } else log.info('No MCP server requirements found.');
    const configBlock = generateAgentConfig(name, role);
    console.log('\nGenerated agent configuration:\n');
    console.log(configBlock);
    const configPath = path.join(ROLES_DIR, `${name}.config.md`);
    fs.writeFileSync(configPath, configBlock, 'utf8');
    log.success(`Agent configuration saved to ${configPath}`);
    break;
  }

  default:
    console.error(`Unknown command: ${command}`);
    showHelp();
    process.exit(1);
}
