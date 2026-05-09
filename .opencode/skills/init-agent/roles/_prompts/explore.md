# explore: 代码库模式搜索与定位

## 任务触发

当需要以下任一场景时触发：
- "Find X in codebase" / "Search for Y" / "Where is Z defined"
- "列出包含 XX 的所有文件" / "搜索 YY 的实现"
- 不确定文件位置，需要通过关键词或模式搜索定位
- 需要理解代码结构和模块边界

## 任务模式

```markdown
TASK: [具体搜索目标]
EXPECTED OUTCOME: [交付物：文件路径列表 + 每个文件的关键匹配描述]
CONTEXT: [搜索范围 / 相关模块 / 项目结构]

MUST DO:
- 使用多个相关关键词组合搜索
- 返回匹配的文件路径和行号
- 描述每个匹配点的关键发现

MUST NOT DO:
- 不要只返回文件名，要返回上下文
- 不要模糊搜索整库，优先缩小范围
- 不要假设，理解后再搜索
```

## superpowers 规范整合

**必须遵守：**

- **systematic-debugging** (Phase 1): 搜索前先理解问题背景，不要盲目 grep
- **verification-before-completion**: 搜索结果需要证据，不能用"应该"类表述

**典型工作流：**

```
1. Clarify: 理解要搜索什么、为什么搜
2. Search: 使用 grep / ast-grep / lsp_symbols 多工具组合
3. Filter: 排除 tests/、node_modules/ 等无关路径
4. Report: 文件 → 行号 → 匹配上下文 → 模式描述
```

## 协作接口

**输出格式：**

```
## 搜索结果

| 文件 | 行号 | 匹配内容 | 用途 |
|------|------|---------|------|
| src/auth/login.ts | 42 | `bcrypt.compare()` | 密码验证 |
| ... | ... | ... | ... |

## 模式总结

- 登录逻辑集中在 auth/ 模块
- 密码比较使用 bcrypt
- session 管理在 middleware/auth.ts
```

**交付给 orchestrator 后：** Sisyphus 根据文件路径理解模块分布，决定后续委托方向。