# ARCHITECTURE

## 总体架构

项目采用 Next.js App Router 架构，页面、接口、业务逻辑与数据访问分层组织。

核心调用链路：

```text
Page -> API Route -> Service -> Repository -> Prisma -> SQLite
```

该链路是后续开发必须保持的主干结构。页面不直接访问数据库，API Route 不直接写复杂业务逻辑，数据库访问集中在 Repository 层。

## Next.js App Router

- 页面与路由基于 Next.js App Router。
- 前端页面负责展示、交互、状态触发和调用 API。
- 服务端 API Route 负责请求解析、参数校验、调用 Service，并返回统一格式。

## 分层职责

### Page

- 展示企业级 SaaS 桌面端界面。
- 发起项目、商品、媒体、AI 生成等 API 请求。
- 处理 Loading、Empty、Error 等 UI 状态。
- 不直接访问 Prisma 或 SQLite。

### API Route

- 接收 HTTP 请求。
- 解析 query、params、body 或 form data。
- 调用对应 Service。
- 使用统一返回格式输出 `apiSuccess` 或 `apiError`。
- 不承载复杂业务编排。

### Service

- 承载业务规则与流程编排。
- 调用 Repository 读写数据。
- 处理媒体分析、AI 生成等领域逻辑。
- 真实 AI 接入通过 AI Service 调用 Provider Factory 完成。

### Repository

- 封装 Prisma 查询。
- 隔离数据库访问细节。
- 为 Service 提供稳定的数据读写方法。

### Prisma

- 作为 ORM 管理数据模型与查询。
- 当前数据库为 SQLite。

### SQLite

- 当前阶段的本地持久化数据库。
- 适合开发、验证和早期 MVP 阶段。

## AI Service 位置

AI Service 是 AI 生成能力的集中入口。

职责包括：

- 接收生成请求
- 读取项目、商品、媒体等上下文
- 组织生成 prompt 或生成参数
- 通过 Provider Factory 选择 Mock、DMXAPI、OpenAI 或 Custom provider
- 当前真实 provider 为 DMXAPI
- 当前真实图片模型为 `gpt-image-2`
- 统一处理 AI 调用错误与 fallback

真实 AI 客户端不应散落在页面或 API Route 中，应由 AI Provider 层统一封装。

## Media Upload 流程

媒体上传推荐流程：

```text
Page
-> POST /api/media/upload
-> Media API Route
-> Media Service
-> Media Repository
-> Prisma
-> SQLite
```

流程说明：

- 前端提交媒体文件或媒体元数据。
- API Route 解析上传请求。
- Media Service 处理文件保存、元数据生成或业务校验。
- Media Repository 写入媒体记录。
- 返回统一 API 结果给前端。

## Mock AI 流程

当前 Mock AI 流程：

```text
Page
-> POST /api/ai/generate
-> AI API Route
-> AI Service
-> Mock Generation
-> Repository
-> Prisma
-> SQLite
```

流程说明：

- 前端提交生成请求。
- API Route 调用 AI Service。
- AI Service 根据现有项目、商品或媒体上下文生成 Mock 结果。
- 如需要持久化，则通过 Repository 写入数据库。
- API Route 通过 `apiSuccess` 返回生成结果。

## AI Provider Framework

v0.3.0 引入 AI Provider Framework。

核心结构：

```text
Page
-> POST /api/ai/generate
-> AI API Route
-> AI Service
-> Provider Factory
-> mock / dmxapi / openai / custom Provider
```

Provider 统一方法：

```text
generateImage(input)
```

统一输出：

```text
{
  taskId,
  status,
  images: [{ id, url, prompt, model }]
}
```

当前 provider：

- `mock`：本地开发 fallback，不需要 key。
- `dmxapi`：当前真实 provider，使用 `AI_BASE_URL` + `AI_API_KEY`。
- `openai`：保留官方 OpenAI 接入位置。
- `custom`：保留其它 OpenAI-compatible 平台接入位置。

## DMXAPI 真实文生图流程

当前真实生成链路：

```text
Page
-> POST /api/ai/generate
-> AI API Route
-> AI Service
-> Provider Factory
-> DMXAPI Provider
-> POST {AI_BASE_URL}/v1/images/generations
-> DMXAPI
-> DMXAPI Provider
-> API Route
-> Page
```

环境变量：

- `AI_PROVIDER=dmxapi`
- `AI_BASE_URL=https://www.dmxapi.cn`
- `AI_API_KEY=...`
- `AI_IMAGE_MODEL=gpt-image-2`

返回处理：

- 如果 DMXAPI 返回 URL，前端直接显示 URL 图片。
- 如果 DMXAPI 返回 base64，Provider 返回 `data:image/png;base64,...`。
- `/ai` 页面已支持真实显示 data URL 和 http/https 图片。

## Provider 连接测试流程

`GET /api/ai/test-provider` 用于验证 provider 配置，不生成图片。

```text
Page / Tooling
-> GET /api/ai/test-provider
-> API Route
-> AI Config
-> DMXAPI models endpoint or lightweight request
```

该接口不得暴露 API Key。

## 后续 OpenAI 接入位置

OpenAI 接入应放在 AI Service 层内或 AI Service 调用的专用 client 中。

推荐后续结构：

```text
Page
-> POST /api/ai/generate
-> AI API Route
-> AI Service
-> OpenAI Client
-> OpenAI API
-> AI Service
-> Repository
-> Prisma
-> SQLite
```

接入原则：

- 保持 `/api/ai/generate` 对前端的调用方式稳定。
- 保持 `apiSuccess` / `apiError` 返回格式稳定。
- 保留 Mock 模式用于本地开发或失败 fallback。
- OpenAI API key 与模型配置通过环境变量管理。
- 真实调用错误必须转成可控的 `apiError`。
