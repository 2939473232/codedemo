# SpriteForge

SpriteForge 是一个面向 2D 游戏开发流程的素材生成工作台。项目目标是让用户通过文本描述和简单参数生成角色、道具、图标、tile 等游戏素材，并导出为可接入游戏引擎的资源包。

当前阶段已经完成 P0 MVP 闭环：项目配置、结构化生成请求、任务队列、fallback 素材生成、资产库、manifest 预览和 ZIP 导出。

## 当前内容

- `frontend/`：Web 工作台原型，采用暗色游戏 UI 风格。
- `backend/`：Node.js 原生开发服务器和基础 API。
- `shared/`：前后端共享的 schema 和纯函数。
- `docs/PRD.md`：产品需求文档。
- `docs/ROADMAP.md`：开发优先级与实施路线。

已完成的 P0 能力：

- 工程骨架和本地开发服务器。
- 参考游戏 UI 风格的工作台首屏。
- 项目创建与风格配置表单。
- 项目配置本地保存。
- 生成表单继承项目的引擎、视角、尺寸和调色板。
- 共享 GenerationRequest schema、前端校验和请求预览。
- 生成任务 API，包括任务创建、状态查询和前端进度轮询。
- 稳定 fallback 生成器，任务完成后返回模拟素材列表和 manifest。
- 资产库本地保存、按类型筛选和当前项目统计。
- 导出中心 manifest 预览和 JSON 下载。
- 无依赖 ZIP 导出包，包含 manifest、README 和素材 SVG 预览文件。
- 角色/敌人动画预览，并在 ZIP 中导出 spritesheet SVG 与帧坐标 JSON。
- 地图九宫格 Tile Set 拼接预览，并在 ZIP 中导出 tileset SVG、metadata 和预览地图 JSON。

## 本地启动

需要 Node.js 20 或更高版本。

先进入你自己本地克隆后的 `codedemo` 仓库目录，再启动开发服务器。下面的 `path\to\codedemo` 请替换成你电脑上的实际项目路径：

```powershell
cd "path\to\codedemo"
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

生成请求 schema：

```text
http://localhost:5173/api/generation/schema
```

生成任务 API：

```text
POST http://localhost:5173/api/generation/jobs
GET  http://localhost:5173/api/generation/jobs
GET  http://localhost:5173/api/generation/jobs/:id
```

## 开发检查

```powershell
npm.cmd run check
```

Schema 测试：

```powershell
npm.cmd test
```

生成任务 API smoke 测试需要先启动服务，再运行：

```powershell
npm.cmd run smoke:api
```

## UI 方向

首屏采用暗色游戏工作台风格：左侧品牌视觉区、紧凑垂直导航、深色内容面板、青蓝高亮状态、素材候选网格和资源导出信息。后续功能会在这个工作台结构上继续扩展。

## 下一步

根据 `docs/ROADMAP.md`，后续 P0 任务建议继续推进：

1. 后处理：裁剪、尺寸规范化、透明背景标记。
2. 演示项目模板与录屏脚本。
