# deep: 深度研究与自主实现

## 任务触发

当需要以下任一场景时触发：
- "Implement X feature" / "Build Y from scratch"
- 复杂逻辑、多模块协调、跨层实现
- "Look into X and create PR" — 需要研究+完整实现
- 探索新领域后需要实际落地
- 需要多个文件协同修改的功能

## 任务模式

```markdown
TASK: [具体功能描述]
SCOPE:
  IN: [交付范围]
  OUT: [不在本次范围内]
EXPECTED OUTCOME: [可运行的代码，测试通过]

MUST DO:
- 先理解需求和现有代码结构
- 创建 todo 分解任务（分解 → 委托 → 验证）
- 遵循 TDD：先写 failing test，再实现
- 符合项目现有 patterns（不是"最佳实践"，是"本项目风格"）
- 每完成一个子任务，run diagnostics

MUST NOT DO:
- 不要开始写代码直到理解了需求
- 不要同时修改超过 3 个文件（保持原子提交）
- 不要跳过测试
- 不要假设跨模块的边界条件
```

## superpowers 规范整合

**必须遵守（按执行顺序）：**

1. **brainstorming**: 任何 creative work 前触发，先理解需求和设计
2. **test-driven-development** (RED-GREEN-REFACTOR):
   - RED: 写 failing test，显示当前缺失
   - GREEN: 写最小代码让 test pass
   - REFACTOR: 清理代码，保持所有 test green
3. **verification-before-completion**: 运行完整验证命令后才能声称完成

**关键 TDD 规则：**

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST

Write code before the test? Delete it. Start over.
```

**深度实现特殊要求：**

- 分解后的每个子任务必须可以独立验证
- 如果任务太大（>5 files），拆分到多个子任务
- 实现时用 ast-grep 确认没有引入 bad patterns

## 协作接口

**输出格式：**

```
## 实现计划

- [ ] 1. 创建 UserService test (RED)
- [ ] 2. 实现 UserService 基础 CRUD
- [ ] 3. 添加权限验证逻辑
- [ ] 4. 集成测试通过
- [ ] 5. run diagnostics clean

## 执行日志

[TODO-1] FAIL: UserService.getUser() returns undefined when id not found
[TODO-2] PASS: basic CRUD implemented in 3 files
[TODO-3] PASS: role-based permission added
[TODO-4] PASS: integration tests 15/15
[TODO-5] DIAGNOSTICS: 0 errors

## 交付物

- src/services/UserService.ts (新)
- src/services/__tests__/UserService.test.ts (新)
- src/middleware/auth.ts (修改: 添加 permission check)
```

**交付给 orchestrator 后：** Sisyphus 验证所有 tests pass、diagnostics clean、符合代码规范后报告完成。