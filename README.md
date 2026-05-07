# Agent Role Definition Skill

基于顶级 AI 产品（GPT-5、Claude Code、Grok 等）的 System Prompt 设计最佳实践，定义可复用的 Agent 角色。

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

## 设计原则

参考文章: [4万Star开源神作曝光顶级AI们的System Prompt](https://mp.weixin.qq.com/s/jhWn2GROWbiqbhPhACuT-A)

1. **Personality Isolation** - 人格与工作输出分离
2. **Permission Levels** - 基于操作影响的权限分级
3. **Safety Hard Limits** - 安全边界
4. **Multi-Agent Collaboration** - 多智能体协作模式