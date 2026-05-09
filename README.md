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
    ├── _prompts/         # 子代理委托 prompt 模板
    │   ├── explore.md
    │   ├── librarian.md
    │   ├── oracle.md
    │   ├── visual-engineering.md
    │   └── deep.md
    ├── sisyphus.yaml     # 主角色
    └── _templates/       # 角色模板
        ├── developer.yaml
        ├── reviewer.yaml
        └── collaborator.yaml
```

## 使用方法

```bash
/init-agent --list                              # 列出所有角色
/init-agent --role sisyphus                    # 加载角色
/init-agent --show sisyphus                     # 显示角色定义
/init-agent --new myrole                        # 创建新角色
/init-agent --agents                            # 列出可委托的子代理
/init-agent --delegate explore "搜索用户登录"   # 生成委托 prompt
```

## 设计原则

参考文章: [4万Star开源神作曝光顶级AI们的System Prompt](https://mp.weixin.qq.com/s/jhWn2GROWbiqbhPhACuT-A)

1. **Personality Isolation** - 人格与工作输出分离
2. **Permission Levels** - 基于操作影响的权限分级
3. **Safety Hard Limits** - 安全边界
4. **Multi-Agent Collaboration** - 多智能体协作模式

## 与 superpowers 集成

`init-agent` 与 `superpowers` 配合使用，形成完整的 **WHO + HOW** 工作流。

### 角色分工

| 技能 | 解决的问题 | 关键词 |
|------|-----------|--------|
| **superpowers** | **HOW to work** — 流程规范 | brainstorm → plan → execute → verify |
| **init-agent** | **WHO / WHAT** — 角色定义 | personality, capabilities, delegation |

两者互补，不是替代关系。

### 协作模式

```
用户: "实现一个用户登录功能"

                    ┌─ brainstorming ─────────┐
                    │  理解需求？确认约束？    │
                    └────────────────────────┘
                              │
                              ▼
              ┌─ writing-plans (superpowers) ─┐
              │   分解为独立任务清单           │
              └────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
   ┌─ subagent A ─┐    ┌─ subagent B ─┐    ┌─ subagent C ─┐
   │  写登录逻辑   │    │  写注册逻辑   │    │  写测试用例  │
   │  (deep代理)  │    │  (deep代理)  │    │  (deep代理) │
   └──────────────┘    └──────────────┘    └──────────────┘
                              │
                              ▼
              ┌─ verification-before (superpowers) ─┐
              │   运行测试、lint、诊断               │
              └─────────────────────────────────────┘
                              │
                              ▼
                         完成交付
```

### Sisyphus 角色与 superpowers 的集成点

`sisyphus.yaml` 中的 `can_delegate_to` 列表直接对应 superpowers 的子代理：

```yaml
collaboration:
  can_delegate_to:
    - explore          # 搜索代码库模式
    - librarian        # 搜索外部文档/开源示例
    - oracle            # 架构决策/高难度调试
    - visual-engineering # UI/UX/样式
    - deep              # 深度研究与实现
```

当使用 `/init-agent --role sisyphus` 加载角色后，Sisyphus 会自动：

1. **识别任务类型** — 是探索、实现、调试还是视觉工作
2. **选择合适的子代理** — 根据 superpowers skill 分类选择
3. **并行分发任务** — 多个独立子任务同时执行
4. **验证结果** — 每个子任务完成后运行验证
5. **汇总报告** — 整合所有子代理结果向用户汇报

### 启动集成工作流

```bash
# 1. 加载 sisyphus 角色（定义 WHO）
/init-agent --role sisyphus

# 2. superpowers skills 自动激活
# brainstorming   → 任何 creative work 前触发
# writing-plans    → 实现任何功能前触发
# subagent-driven  → 并行分发任务
# verification     → 交付前验证
```

**本质上**：sisyphus.yaml 把 superpowers 的 14 个 skill 包装进了一个有 personality 的角色，让你在新 session 中以「Sisyphus 的风格」执行 superpowers 的流程规范。

### 权限分级保障流程不被跳过

```yaml
safety:
  permission_levels:
    automatic:
      - Create todos
      - Fire background agents
    requires_confirmation:
      - Write/edit files
      - Execute build commands
    requires_escalation:
      - Git operations (commit, push)
```

这确保了 superpowers 的 **verification-before-completion** skill 能真正被执行——不能跳过验证就声称完成。

### 子代理委托 prompt 模板

`roles/_prompts/` 目录为每个子代理定义了标准化的委托模板，整合了 superpowers 的流程规范。

每个模板包含四个部分：

| 段落 | 内容 |
|------|------|
| **任务触发** | 什么场景下调用该子代理 |
| **任务模式** | 标准化的 TASK / EXPECTED OUTCOME / MUST DO / MUST NOT DO |
| **superpowers 规范整合** | 该场景需要遵守的 superpowers skill（如 TDD、systematic-debugging） |
| **协作接口** | 子代理输出的标准格式及 orchestrator 如何处理 |

**使用方式：**

```bash
# 生成一个委托给 deep（深度实现）的标准 prompt
/init-agent --delegate deep "实现用户注册和登录功能"

# 生成委托给 oracle（架构咨询）的标准 prompt
/init-agent --delegate oracle "JWT vs Session 方案选型"

# 列出所有可委托的子代理
/init-agent --agents
```

**示例输出：**

```bash
$ /init-agent --delegate explore "搜索用户登录相关的代码实现"

# explore: 代码库模式搜索与定位

## 任务触发
- "Find X in codebase" / "Search for Y" / "Where is Z defined"

## 任务模式
TASK: 搜索用户登录相关的代码实现
EXPECTED OUTCOME: [文件路径列表 + 关键匹配描述]
MUST DO:
- 使用多个相关关键词组合搜索
- 返回匹配的文件路径和行号
MUST NOT DO:
- 不要模糊搜索整库，优先缩小范围

## superpowers 规范整合
- systematic-debugging (Phase 1): 搜索前先理解问题背景
- verification-before-completion: 搜索结果需要证据

## 协作接口
- 输出格式：表格映射（文件 → 行号 → 匹配内容 → 用途）
- 交付给 orchestrator 后：Sisyphus 根据路径理解模块分布
```

每个模板生成的 prompt 包含了该子代理的职责定义、任务场景、superpowers 规范约束，以及或chestrator 如何处理输出的协作接口定义。