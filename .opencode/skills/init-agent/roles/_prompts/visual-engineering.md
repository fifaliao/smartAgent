# visual-engineering: UI/UX 与前端样式

## 任务触发

当需要以下任一场景时触发：
- "Redesign the sidebar" / "Make it responsive"
- 涉及 CSS / 组件样式 / 动画效果
- 需要实现 Design Token / Tailwind / CSS-in-JS
- 前端组件开发、布局调整、交互效果
- "看起来不对" / "用户体验问题"

## 任务模式

```markdown
TASK: [具体视觉任务]
DESIGN_REFERENCE: [如果有 mockup/截图，描述关键元素]
EXPECTED OUTCOME: [具体可见的变更，不是"改进 UI"这种模糊表述]

MUST DO:
- 先理解当前组件结构和样式体系
- 保持与现有 design token 一致
- 给出修改前/修改后的视觉对比
- 确保 mobile / desktop / dark mode 多场景

MUST NOT DO:
- 不要修改业务逻辑（只改视觉层）
- 不要引入新的设计系统（保持一致）
- 不要跳过动画/过渡效果
```

## superpowers 规范整合

**必须遵守：**

- **brainstorming**: 视觉工作也需要理解需求，不只是"做漂亮"
- **verification-before-completion**: 必须截图/快照验证，不能说"应该好看了"

**典型工作流：**

```
1. 理解: 当前布局结构，使用的 design system
2. 设计: 提出 2-3 个方案（含 trade-off）
3. 实现: 使用 CSS 变量 / Tailwind tokens 保持一致
4. 验证: take_snapshot 对比修改前后
5. 交付: 列出所有变更的文件和行号
```

## 协作接口

**输出格式：**

```
## 变更范围

**修改文件:**
- src/components/Sidebar.tsx (布局)
- src/styles/sidebar.css (样式)
- src/tokens/dark-mode.css (暗色主题)

## 变更明细

| 元素 | 修改前 | 修改后 | 实现方式 |
|------|--------|--------|---------|
| 侧边栏宽度 | 240px | 280px | CSS var |
| 选中态 | 无 | 左 border + bg | Tailwind |
| 折叠动画 | 无 | 200ms ease | CSS transition |

## 验证

使用 take_snapshot 确认多端一致性。
```

**交付给 orchestrator 后：** Sisyphus 确认样式变更符合预期，使用 lsp_diagnostics 验证无类型错误。