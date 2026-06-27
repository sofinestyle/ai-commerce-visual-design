# PROJECT_CONTEXT

## 项目名称

AI 电商视觉设计平台

## 当前版本

v0.3.0

## 当前阶段

Sprint 3.6，First AI Generation 已完成。

## 项目目标

构建一个面向电商团队的 AI 视觉设计平台，帮助用户围绕项目、商品、素材与生成任务完成电商视觉内容的上传、分析、生成与管理。

平台当前已经打通从项目与商品管理，到素材上传、AI Provider 配置、DMXAPI 真实文生图、前端真实图片显示的 First AI Generation 闭环。

## 已完成模块

- 项目管理基础能力
- 商品管理基础能力
- 媒体素材上传接口
- 媒体素材分析接口
- Mock AI 生成接口
- AI Provider Framework
- DMXAPI Provider
- DMXAPI 连接测试 API
- DMXAPI 真实文生图
- `/ai` 页面真实图片显示
- 统一 API 返回格式
- 基于 Prisma 与 SQLite 的本地数据持久化
- 企业级 SaaS 桌面端基础界面规范

## 当前技术栈

- Next.js App Router
- TypeScript
- React
- API Routes
- Service / Repository 分层
- Prisma
- SQLite
- DMXAPI OpenAI-compatible API
- `gpt-image-2`
- npm scripts
- ESLint

## 当前数据链路

当前核心链路为：

Page -> API Route -> Service -> Repository -> Prisma -> SQLite

媒体与 AI 相关链路为：

Page -> API Route -> Media / AI Service -> Repository -> Prisma -> SQLite

当前 AI 生成已进入 First AI Generation 阶段。生成请求进入 AI Service 后，通过 Provider Factory 选择 `mock`、`dmxapi`、`openai` 或 `custom` provider。当前真实 provider 为 DMXAPI，使用 OpenAI-compatible image generation endpoint 与 `gpt-image-2` 模型生成图片，并返回现有统一结果结构。

## v0.3.0 First AI Generation

v0.3.0 已完成 First AI Generation。

已完成内容：

- 新增 AI Provider Framework
- 新增 DMXAPI provider
- 支持 `AI_PROVIDER=dmxapi`
- 支持 `AI_BASE_URL`、`AI_API_KEY`、`AI_IMAGE_MODEL`
- 默认真实图片模型为 `gpt-image-2`
- 新增 `GET /api/ai/test-provider`
- `POST /api/ai/generate` 已支持真实 DMXAPI 文生图
- 支持 DMXAPI 返回 URL 或 base64 图片
- base64 图片以 `data:image/png;base64,...` 返回
- `/ai` 页面已能真实显示 data URL 或 http/https 图片
- 保留 Mock AI 作为 fallback 或开发模式能力
- 保持 API Route 入参与返回格式稳定

## 下一阶段目标

- 保存真实生成图片到媒体库
- 为生成历史落库
- 增加 provider 错误分类与用户友好提示
- 增加真实生成结果的下载、保存、复用能力
- 补充更完整的 DMXAPI/OpenAI-compatible provider 文档
