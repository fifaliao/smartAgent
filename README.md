# Agent Role Definition Skill

基于顶级 AI 产品（GPT-5、Claude Code、Grok 等）的 System Prompt 设计最佳实践，定义可复用的 Agent 角色。

## 安装使用

### 方式一：复制到项目

```bash
# 在你的 OpenCode 项目中创建技能目录
mkdir -p .opencode/skills/init-agent/roles

# 克隆仓库
git clone https://github.com/fifaliao/smartAgent.git
# 复制文件到你的项目
cp -r smartAgent/.opencode/skills/init-agent/* .opencode/skills/init-agent/
```

### 方式二：创建角色文件

在你的 OpenCode 项目中创建角色文件 `.opencode/skills/init-agent/roles/myrole.yaml`，然后通过 `/init-agent --role myrole` 调用。

### 方式三：链接到本地仓库

```bash
# 克隆仓库
git clone https://github.com/fifaliao/smartAgent.git

# 通过软链接
ln -s /path/to/smartAgent/.opencode/skills/init-agent /path/to/your-project/.opencode/skills/init-agent
```

## 特性

- **人格隔离**: 工作输出不受角色性格影响
- **权限分级**: automatic / requires_confirmation / requires_escalation
- **安全硬限制**: 不可逾越的规则
- **多智能体协作**: 定义委托关系

## 目录结构

```
.opencode/skills/init-agent/
├── SKILL.md              # 技能文档
├── agent.js              # 命令行工具
├── package.json
└── roles/
    ├── sisyphus.yaml     # 主角色
    └── _templates/       # 角色模板
        ├── developer.yaml
        ├── reviewer.yaml
        └── collaborator.yaml
```

## 使用方法

```bash
/init-agent --list                    # 列出所有角色
/init-agent --role sisyphus          # 加载角色
/init-agent --show sisyphus           # 显示角色定义
/init-agent --new myrole              # 创建新角色
```

### 预置角色

| 角色 | 描述 |
|------|------|
| `sisyphus` | 主角色 - 高级 AI 工程师，擅长委托和协调 |
| `developer` | 开发者 - 专注于编写清晰、可维护的代码 |
| `reviewer` | 审阅者 - 安全优先的代码审查 |
| `collaborator` | 协作者 - 结对编程伙伴 |

## 设计原则

参考文章: [4万Star开源神作曝光顶级AI们的System Prompt](https://mp.weixin.qq.com/s/jhWn2GROWbiqbhPhACuT-A)

1. **Personality Isolation** - 人格与工作输出分离
2. **Permission Levels** - 基于操作影响的权限分级
3. **Safety Hard Limits** - 安全边界
4. **Multi-Agent Collaboration** - 多智能体协作模式

## 创建自定义角色

```yaml
# .opencode/skills/init-agent/roles/myrole.yaml
name: myrole
title: My Custom Role

description: 角色描述

personality:
  traits:
    - trait: 特点1
      intensity: high
  tone: 专业、直接

behavior:
  do:
    - rule: 遵循的规则
  dont:
    - rule: 避免的规则

capabilities:
  can:
    - capability: 能做的事情
  cannot:
    - capability: 不能做的事情
      fallback: 替代方案

safety:
  hard_limits:
    - limit: 硬性限制
  permission_levels:
    automatic:
      - 自动执行的操作
    requires_confirmation:
      - 需要确认的操作

output_rules:
  personality_isolation: true
```

## License

MIT
