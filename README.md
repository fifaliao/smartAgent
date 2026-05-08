# Agent Role Definition Skill

让你的 AI Agent 拥有完整的人格、工作流程和安全边界。

## 问题

当你让 AI 帮你写代码时，是否遇到过：

- AI 太啰嗦 or 太冷淡，总是不在状态？
- 权限失控，一不小心就帮你删了生产数据库？
- 不同任务需要不同"性格"的 AI，却只能来回切换提示词？
- 好不容易调教好的 Agent，换个会话就全忘了？

**每个优秀的 AI 产品，其实都有一套精心设计的"角色定义"。**

GPT-5 有 4 种人格模式（Gynic、Nerdy、Robot、Listener），Claude Code 有完整的 Git 安全协议和权限分级，Grok 甚至有脱口秀模式...

**这一切的秘密，都在 System Prompt 里。**

## 解决方案

`init-agent` 让你也能为自己的 Agent 定义完整的角色：

```yaml
# 定义人格
personality:
  traits:
    - trait: Methodical
      intensity: high
  thinking_approach: |
    1. 分解问题
    2. 委托专家
    3. 并行执行
    4. 验证结果

# 定义安全边界
safety:
  hard_limits:
    - limit: 绝不提交未确认的代码
      consequence: 停止并请求确认

# 定义权限分级
permission_levels:
  automatic:
    - 读取文件
    - 创建待办清单
  requires_confirmation:
    - 写入文件
    - 运行构建命令
```

## OpenCode 终端使用

安装后，在 OpenCode 终端中直接使用：

```bash
/init-agent --list                    # 列出所有角色
/init-agent --role sisyphus           # 加载主角色
/init-agent --role developer          # 加载开发者角色
/init-agent --role reviewer           # 加载审阅者角色
/init-agent --show sisyphus           # 查看角色定义
/init-agent --new myrole              # 创建新角色
/init-agent --new myrole --desc "描述"  # 带描述创建
/init-agent --new myrole --interactive # 交互式创建
```

### 创建角色智能识别

| 命令 | 行为 |
|------|------|
| `/init-agent --new backend-dev` | 名称清晰，直接创建 |
| `/init-agent --new myrole --desc "A custom role"` | 指定描述创建 |
| `/init-agent --new myrole --interactive` | 交互式确认细节 |

**智能识别规则：**
- `developer` / `backend` / `frontend` → 自动推断能力
- `reviewer` / `security` → 安全相关能力
- 不明确的名称 → 引导确认

## 快速安装

```bash
curl -fsSL https://raw.githubusercontent.com/fifaliao/smartAgent/main/.opencode/skills/init-agent/install.sh | bash
```

## 预置角色

| 角色 | 描述 |
|------|------|
| `sisyphus` | 主角色 - 高级 AI 工程师，擅长委托和协调 |
| `developer` | 开发者 - 专注于编写清晰、可维护的代码 |
| `reviewer` | 审阅者 - 安全优先的代码审查 |
| `collaborator` | 协作者 - 结对编程伙伴 |

## 设计理念

基于 [system_prompts_leaks](https://github.com/asgeirtj/system_prompts_leaks) 项目——一个收录了 GPT-5、Claude Code、Grok 等顶级 AI 产品 System Prompt 的开源仓库。

提炼出 4 大设计原则：

1. **人格隔离** - 工作输出不受角色性格影响
2. **权限分级** - 基于操作风险自动判断是否需要确认
3. **安全硬限制** - 不可逾越的红线
4. **多智能体协作** - 定义委托关系，支持子 Agent

## License

[MIT License](https://opensource.org/licenses/MIT)
