# SpriteForge

SpriteForge 是一个面向 2D 游戏开发流程的素材生成工作台。项目目标是让用户通过文本描述和简单参数生成角色、道具、图标、tile 等游戏素材，并导出为可接入游戏引擎的资源包。

当前阶段是 P0 的第一步：初始化工程骨架、本地启动方式和首屏工作台 UI 原型。

## 当前内容

- `frontend/`：Web 工作台原型，采用暗色游戏 UI 风格。
- `backend/`：Node.js 原生开发服务器和基础 API。
- `docs/PRD.md`：产品需求文档。
- `docs/ROADMAP.md`：开发优先级与实施路线。

已完成的 P0 能力：

- 工程骨架和本地开发服务器。
- 参考游戏 UI 风格的工作台首屏。
- 项目创建与风格配置表单。
- 项目配置本地保存。
- 生成表单继承项目的引擎、视角、尺寸和调色板。

## 本地启动

需要 Node.js 20 或更高版本。

```powershell
npm.cmd run dev
```

启动后访问：

```text
http://localhost:5173
```

健康检查：

```text
http://localhost:5173/api/health
```

## 开发检查

```powershell
npm.cmd run check
```

## UI 方向

首屏采用暗色游戏工作台风格：左侧品牌视觉区、紧凑垂直导航、深色内容面板、青蓝高亮状态、素材候选网格和资源导出信息。后续功能会在这个工作台结构上继续扩展。

## 下一步

根据 `docs/ROADMAP.md`，后续 P0 任务建议继续推进：

1. 素材生成表单 schema。
2. 生成任务 API。
3. fallback 生成器。
4. 资产库与导出中心。
