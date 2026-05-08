# Agent Role Definition Skill

基于顶级 AI 产品（GPT-5、Claude Code、Grok 等）的 System Prompt 设计最佳实践，定义可复用的 Agent 角色。

## OpenCode 终端使用

在 OpenCode 终端中直接使用 `/init-agent` 命令：

```bash
/init-agent --list                    # 列出所有角色
/init-agent --role sisyphus           # 加载 sisyphus 角色
/init-agent --role developer          # 加载 developer 角色
/init-agent --role reviewer           # 加载 reviewer 角色
/init-agent --role collaborator      # 加载 collaborator 角色
/init-agent --show sisyphus           # 显示角色定义详情
/init-agent --new myrole             # 从模板创建新角色
```

## 快速安装

### 一键安装（推荐）

```bash
curl -fsSL https://raw.githubusercontent.com/fifaliao/smartAgent/main/.opencode/skills/init-agent/install.sh | bash
```

### 指定安装目录

```bash
curl -fsSL https://raw.githubusercontent.com/fifaliao/smartAgent/main/.opencode/skills/init-agent/install.sh | bash /path/to/your-project
```

### Git 克隆

```bash
git clone https://github.com/fifaliao/smartAgent.git
cd smartAgent
```

## 预置角色

| 角色 | 描述 |
|------|------|
| `sisyphus` | 主角色 - 高级 AI 工程师，擅长委托和协调 |
| `developer` | 开发者 - 专注于编写清晰、可维护的代码 |
| `reviewer` | 审阅者 - 安全优先的代码审查 |
| `collaborator` | 协作者 - 结对编程伙伴 |

## 特性

- **人格隔离**: 工作输出不受角色性格影响
- **权限分级**: automatic / requires_confirmation / requires_escalation
- **安全硬限制**: 不可逾越的规则
- **多智能体协作**: 定义委托关系

## 设计原则

参考文章: [4万Star开源神作曝光顶级AI们的System Prompt](https://mp.weixin.qq.com/s/jhWn2GROWbiqbhPhACuT-A)

1. **Personality Isolation** - 人格与工作输出分离
2. **Permission Levels** - 基于操作影响的权限分级
3. **Safety Hard Limits** - 安全边界
4. **Multi-Agent Collaboration** - 多智能体协作模式

## License

MIT
