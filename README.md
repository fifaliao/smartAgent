# Agent Role Definition Skill

基于顶级 AI 产品（GPT-5、Claude Code、Grok 等）的 System Prompt 设计最佳实践，定义可复用的 Agent 角色。

## 快速安装

### npm 安装（推荐）

```bash
# 安装到当前项目
npx opencode-init-agent install

# 指定安装目录
npx opencode-init-agent install /path/to/your-project
```

### Git 克隆

```bash
git clone https://github.com/fifaliao/smartAgent.git
cd smartAgent
npm install
npm run install-skill -- /path/to/your-project
```

## 使用方法

```bash
# 列出所有角色
npx opencode-init-agent --list

# 加载角色到 OpenCode
npx opencode-init-agent --role sisyphus

# 显示角色定义
npx opencode-init-agent --show sisyphus

# 创建新角色
npx opencode-init-agent --new myrole
```

### OpenCode 内使用

安装后，在 OpenCode 中直接使用：

```
/init-agent --list                    # 列出所有角色
/init-agent --role sisyphus          # 加载角色
/init-agent --show sisyphus           # 显示角色定义
/init-agent --new myrole              # 创建新角色
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
