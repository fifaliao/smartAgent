#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const SKILL_DIR = path.dirname(__filename);
const ROLES_DIR = path.join(SKILL_DIR, 'roles');

function parseYaml(text) {
  const result = {};
  const stack = [{ obj: result, indent: -1 }];
  let currentKey = null;

  for (const line of text.split('\n')) {
    const trimmed = line.trimEnd();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const indent = line.search(/\S/);
    const match = trimmed.match(/^-\s+(.+)$/);

    if (match) {
      const parent = stack[stack.length - 1];
      if (!Array.isArray(parent.obj[parent.key])) {
        parent.obj[parent.key] = [];
      }
      const val = match[1];
      const kvMatch = val.match(/^(.+?):\s*(.+)$/);
      if (kvMatch) {
        const item = {};
        item[kvMatch[1]] = parseValue(kvMatch[2]);
        parent.obj[parent.key].push(item);
      } else {
        parent.obj[parent.key].push(parseValue(val));
      }
      continue;
    }

    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    const kvMatch = trimmed.match(/^(.+?):\s*(.*)$/);
    if (kvMatch) {
      const key = kvMatch[1];
      const val = kvMatch[2];
      const parent = stack[stack.length - 1];
      if (val === '') {
        parent.obj[key] = {};
        parent.key = key;
        stack.push({ obj: parent.obj, key, indent });
      } else {
        parent.obj[key] = parseValue(val);
        parent.key = key;
      }
    }
  }
  return result;
}

function parseValue(val) {
  if (val === 'true') return true;
  if (val === 'false') return false;
  if (/^\d+$/.test(val)) return parseInt(val);
  if (/^\d+\.\d+$/.test(val)) return parseFloat(val);
  return val;
}

function loadYaml(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  try {
    const yaml = require('js-yaml');
    return yaml.load(text);
  } catch {
    return parseYaml(text);
  }
}

function listRoles() {
  const roles = [];
  if (!fs.existsSync(ROLES_DIR)) return roles;

  const entries = fs.readdirSync(ROLES_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith('.yaml')) {
      const name = entry.name.replace('.yaml', '');
      if (!name.startsWith('_')) {
        const role = loadYaml(path.join(ROLES_DIR, entry.name));
        roles.push({ name, title: role?.title || name, description: role?.description || '' });
      }
    }
    if (entry.isDirectory() && entry.name !== '_templates') {
      const subPath = path.join(ROLES_DIR, entry.name);
      const files = fs.readdirSync(subPath);
      for (const f of files) {
        if (f.endsWith('.yaml')) {
          const name = f.replace('.yaml', '');
          const role = loadYaml(path.join(subPath, f));
          roles.push({ name, title: role?.title || name, description: role?.description || '' });
        }
      }
    }
  }

  const templatesPath = path.join(ROLES_DIR, '_templates');
  if (fs.existsSync(templatesPath)) {
    const templates = fs.readdirSync(templatesPath);
    for (const f of templates) {
      if (f.endsWith('.yaml')) {
        const name = f.replace('.yaml', '');
        const role = loadYaml(path.join(templatesPath, f));
        roles.push({ name, title: `${role?.title || name} (template)`, description: role?.description || '' });
      }
    }
  }

  return roles;
}

function loadRole(name) {
  let rolePath = path.join(ROLES_DIR, `${name}.yaml`);
  if (fs.existsSync(rolePath)) {
    return loadYaml(rolePath);
  }

  const templatesPath = path.join(ROLES_DIR, '_templates');
  const templatePath = path.join(templatesPath, `${name}.yaml`);
  if (fs.existsSync(templatePath)) {
    return loadYaml(templatePath);
  }

  if (fs.existsSync(ROLES_DIR)) {
    const entries = fs.readdirSync(ROLES_DIR, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name !== '_templates') {
        const fullPath = path.join(ROLES_DIR, entry.name, `${name}.yaml`);
        if (fs.existsSync(fullPath)) {
          return loadYaml(fullPath);
        }
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
      prompt += `**Traits:** ${role.personality.traits.map(t => `${t.trait} (${t.intensity || 'medium'})`).join(', ')}\n`;
    }
    if (role.personality.tone) prompt += `**Tone:** ${role.personality.tone}\n`;
    if (role.personality.speaking_style) prompt += `**Speaking Style:** ${role.personality.speaking_style}\n`;
    if (role.personality.thinking_approach) prompt += `**Thinking Approach:**\n${role.personality.thinking_approach}\n`;
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
      if (pl.automatic) prompt += `- **Automatic:** ${pl.automatic.join(', ')}\n`;
      if (pl.requires_confirmation) prompt += `- **Requires Confirmation:** ${pl.requires_confirmation.join(', ')}\n`;
      if (pl.requires_escalation) prompt += `- **Requires Escalation:** ${pl.requires_escalation.join(', ')}\n`;
    }
    prompt += '\n';
  }

  if (role.collaboration) {
    prompt += `## Collaboration\n`;
    if (role.collaboration.can_delegate_to) prompt += `**Can delegate to:** ${role.collaboration.can_delegate_to.join(', ')}\n`;
    if (role.collaboration.escalation_path) prompt += `**Escalation path:** ${role.collaboration.escalation_path}\n`;
    prompt += '\n';
  }

  if (role.output_rules) {
    prompt += `## Output Rules\n`;
    prompt += `**Personality Isolation:** ${role.output_rules.personality_isolation ? 'Enabled' : 'Disabled'}\n`;
    if (role.output_rules.formal_output_tones) prompt += `**Formal tones:** ${role.output_rules.formal_output_tones.join(', ')}\n`;
  }

  return prompt;
}

function serializeYaml(obj, indent = 0) {
  const prefix = '  '.repeat(indent);
  let result = '';

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) continue;
    if (typeof value === 'object' && !Array.isArray(value)) {
      result += `${prefix}${key}:\n${serializeYaml(value, indent + 1)}`;
    } else if (Array.isArray(value)) {
      result += `${prefix}${key}:\n`;
      for (const item of value) {
        if (typeof item === 'object' && item !== null) {
          const entries = Object.entries(item);
          if (entries.length === 1) {
            result += `${prefix}  - ${entries[0][0]}: ${entries[0][1]}\n`;
          } else {
            result += `${prefix}  -\n`;
            for (const [k, v] of entries) {
              result += `${prefix}    ${k}: ${v}\n`;
            }
          }
        } else {
          result += `${prefix}  - ${item}\n`;
        }
      }
    } else if (typeof value === 'boolean') {
      result += `${prefix}${key}: ${value}\n`;
    } else if (typeof value === 'string' && value.includes('\n')) {
      result += `${prefix}${key}: |\n`;
      for (const l of value.split('\n')) {
        result += `${prefix}  ${l}\n`;
      }
    } else {
      result += `${prefix}${key}: ${value}\n`;
    }
  }

  return result;
}

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`init-agent - Role-based agent initialization

Usage:
  /init-agent --list                      List all available roles
  /init-agent --role <name>               Load and initialize with role
  /init-agent --show <name>               Display role definition
  /init-agent --new <name>                Create new role from template

Available roles:`);
  const roles = listRoles();
  for (const r of roles) {
    console.log(`  - ${r.name}: ${r.title}`);
  }
  process.exit(0);
}

const command = args[0];

switch (command) {
  case '--list':
  case '-l': {
    const roles = listRoles();
    console.log('Available roles:');
    for (const r of roles) {
      console.log(`  - ${r.name}: ${r.title}`);
      if (r.description) console.log(`    ${r.description}`);
    }
    break;
  }

  case '--role':
  case '-r': {
    const name = args[1];
    if (!name) {
      console.error('Error: Role name required');
      console.error('Usage: /init-agent --role <name>');
      process.exit(1);
    }
    const role = loadRole(name);
    if (!role) {
      console.error(`Error: Role '${name}' not found`);
      const roles = listRoles();
      console.error('Available roles:', roles.map(r => r.name).join(', '));
      process.exit(1);
    }
    console.log(formatRoleAsPrompt(role));
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
    console.log(serializeYaml(role));
    break;
  }

  case '--new': {
    const name = args[1];
    if (!name) {
      console.error('Error: Role name required');
      process.exit(1);
    }
    const newRolePath = path.join(ROLES_DIR, `${name}.yaml`);
    if (fs.existsSync(newRolePath)) {
      console.error(`Error: Role '${name}' already exists`);
      process.exit(1);
    }
    const templatesDir = path.join(ROLES_DIR, '_templates');
    const templatePath = path.join(templatesDir, 'developer.yaml');
    if (fs.existsSync(templatePath)) {
      let content = fs.readFileSync(templatePath, 'utf8');
      content = content.replace(/^name:.*$/m, `name: ${name}`);
      content = content.replace(/^title:.*$/m, `title: ${name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`);
      fs.writeFileSync(newRolePath, content);
      console.log(`Created role '${name}' from developer template`);
    } else {
      const minimal = `name: ${name}\ntitle: ${name}\ndescription: \n`;
      fs.writeFileSync(newRolePath, minimal);
      console.log(`Created minimal role '${name}'`);
    }
    break;
  }

  default:
    console.error(`Unknown command: ${command}`);
    process.exit(1);
}