#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

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

const SKILL_DIR = path.resolve(__dirname, '..');
const ROLES_DIR = path.join(SKILL_DIR, 'roles');

// Interactive prompt helper
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

// Role name analysis - determines if the name is clear enough
function analyzeRoleName(name) {
  const analysis = {
    isClear: false,
    suggestedTitle: '',
    suggestedTraits: [],
    suggestedCapabilities: [],
    confidence: 0,
    keywords: [],
  };

  // Extract keywords from name
  const keywords = name.toLowerCase().split(/[-_]/);
  analysis.keywords = keywords;

  // Known role patterns
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

  // Check for pattern match
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

  // Default for unclear names
  if (!analysis.isClear) {
    analysis.suggestedTitle = name
      .split(/[-_]/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  return analysis;
}

// Generate role YAML content
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

// Interactive role creation
async function createRoleInteractive(name, options = {}) {
  log.step(`Creating role: ${name}`);

  const analysis = analyzeRoleName(name);

  if (analysis.isClear && analysis.confidence >= 0.8 && !options.interactive) {
    log.info(`Detected role type: ${analysis.suggestedTitle}`);
    log.success('Role definition looks clear. Creating directly...');
  } else {
    log.warn('Role name is not clear enough. Let\'s clarify some details.');

    // Ask for description
    if (!options.description) {
      const desc = await prompt('Description (optional, press Enter to skip): ');
      if (desc) options.description = desc;
    }

    // Ask for title confirmation
    if (!options.title) {
      const titleConfirm = await prompt(
        `Title [${analysis.suggestedTitle}]: `
      );
      if (titleConfirm) options.title = titleConfirm;
    }

    // Ask for traits confirmation
    if (analysis.suggestedTraits.length > 0) {
      log.info(`Suggested traits: ${analysis.suggestedTraits.join(', ')}`);
      const traitsConfirm = await prompt(
        'Confirm traits (comma-separated, press Enter to accept): '
      );
      if (traitsConfirm) {
        options.traits = traitsConfirm.split(',').map((t) => t.trim());
      }
    }

    // Ask for capabilities confirmation
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

  // Generate YAML
  const yaml = generateRoleYaml(name, options);

  // Write file
  const rolePath = path.join(ROLES_DIR, `${name}.yaml`);
  fs.writeFileSync(rolePath, yaml);

  log.success(`Role '${name}' created at ${rolePath}`);
  return rolePath;
}

// Install command
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
          if (t.endsWith('.yaml')) {
            fs.copyFileSync(
              path.join(ROLES_DIR, entry.name, t),
              path.join(templatesDst, t)
            );
          }
        }
      }
    }
  }

  log.success('Installation complete!');
}

// Help message
function showHelp() {
  console.log(`init-agent - Role-based agent initialization for OpenCode

${colors.green}Commands:${colors.reset}
  init-agent --list                      List all available roles
  init-agent --role <name>                Load and initialize with role
  init-agent --show <name>                Display role definition
  init-agent --new <name> [--desc DESC] [--interactive]  Create new role
  init-agent install [dir]                Install skill to directory

${colors.green}Examples:${colors.reset}
  init-agent --list                       Show available roles
  init-agent --role sisyphus             Initialize with sisyphus role
  init-agent --new myrole                 Create role with clear name
  init-agent --new myrole --desc "A custom role for..."  Create with description
  init-agent --new myrole --interactive   Interactive creation with questions
  init-agent install                       Install to current directory`);
}

// Parse arguments
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
    const roles = [];
    if (fs.existsSync(ROLES_DIR)) {
      const entries = fs.readdirSync(ROLES_DIR, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.yaml') && !entry.name.startsWith('_')) {
          roles.push(entry.name.replace('.yaml', ''));
        }
      }
    }
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
    console.log(`Loading role: ${name}...`);
    console.log('(Use /init-agent --show ' + name + ' to see full definition)');
    break;
  }

  case '--show': {
    const name = args[1];
    if (!name) {
      console.error('Error: Role name required');
      process.exit(1);
    }
    const rolePath = path.join(ROLES_DIR, `${name}.yaml`);
    if (fs.existsSync(rolePath)) {
      console.log(fs.readFileSync(rolePath, 'utf8'));
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

    // Parse options
    for (let i = 2; i < args.length; i++) {
      if (args[i] === '--desc' && args[i + 1]) {
        options.description = args[i + 1];
        i++;
      } else if (args[i] === '--interactive') {
        options.interactive = true;
      }
    }

    // Check if role already exists
    const rolePath = path.join(ROLES_DIR, `${name}.yaml`);
    if (fs.existsSync(rolePath)) {
      log.warn(`Role '${name}' already exists. Use --show to view or delete first.`);
      process.exit(1);
    }

    // Create role
    createRoleInteractive(name, options).catch((err) => {
      console.error('Error:', err.message);
      process.exit(1);
    });
    break;
  }

  case '--interactive':
  case '-i': {
    const name = await prompt('Role name: ');
    if (!name) {
      console.error('Error: Role name required');
      process.exit(1);
    }

    const options = {
      description: await prompt('Description: '),
      interactive: true,
    };

    createRoleInteractive(name, options).catch((err) => {
      console.error('Error:', err.message);
      process.exit(1);
    });
    break;
  }

  default:
    console.error(`Unknown command: ${command}`);
    showHelp();
    process.exit(1);
}
