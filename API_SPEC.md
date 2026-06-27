# API_SPEC

## 统一返回格式

所有 API 必须使用统一返回格式。

成功返回：

```ts
apiSuccess(data, message?)
```

建议响应结构：

```json
{
  "success": true,
  "data": {},
  "message": "OK"
}
```

失败返回：

```ts
apiError(message, status?, details?)
```

建议响应结构：

```json
{
  "success": false,
  "error": {
    "message": "Something went wrong",
    "details": {}
  }
}
```

API Route 不应直接手写不一致的 JSON 结构。

## 现有 GET API

当前项目已存在 GET 类查询 API，用于读取项目、商品、媒体、生成结果或相关列表数据。

后续 AI 工具接力开发时，应先查看现有 `app/api/**/route.ts` 文件确认准确路径、入参和返回数据结构，不得仅凭猜测修改调用方。

GET API 开发约定：

- 只负责读取数据。
- query 参数必须显式解析。
- 缺失或非法参数返回 `apiError`。
- 成功时返回 `apiSuccess`。
- 不在 GET 请求中执行创建、更新或删除。

## 已有 POST API

### POST /api/projects

用途：创建项目。

职责：

- 接收项目创建参数。
- 调用 Project Service。
- 通过 Repository 写入数据库。
- 返回创建后的项目数据。

### POST /api/products

用途：创建商品。

职责：

- 接收商品创建参数。
- 关联项目或其它必要上下文。
- 调用 Product Service。
- 通过 Repository 写入数据库。
- 返回创建后的商品数据。

### POST /api/media/upload

用途：上传媒体素材。

职责：

- 接收上传文件或媒体信息。
- 调用 Media Service。
- 保存文件或记录媒体元数据。
- 通过 Repository 写入数据库。
- 返回媒体记录。

### POST /api/media/analyze

用途：分析媒体素材。

职责：

- 接收媒体 ID 或媒体上下文。
- 调用 Media Service 或分析服务。
- 返回媒体分析结果。
- 如需持久化分析结果，必须通过 Repository 写入数据库。

### POST /api/ai/generate

用途：发起 AI 生成。

职责：

- 接收生成参数。
- 调用 AI Service。
- 通过 Provider Factory 选择 AI Provider。
- `AI_PROVIDER=mock` 时执行 Mock AI 生成。
- `AI_PROVIDER=dmxapi` 时调用 DMXAPI OpenAI-compatible image generation endpoint。
- 当前真实图片模型为 `gpt-image-2`。
- 返回生成结果。

返回数据保持：

```json
{
  "taskId": "dmx-task-...",
  "status": "Completed",
  "images": [
    {
      "id": "dmx-image-...",
      "url": "data:image/png;base64,...",
      "prompt": "Prompt text",
      "model": "gpt-image-2"
    }
  ]
}
```

如果 provider 返回 URL，`images[].url` 直接使用该 URL；如果 provider 返回 base64，`images[].url` 使用 `data:image/png;base64,...`。

### GET /api/ai/test-provider

用途：验证当前 AI Provider 配置是否可用，不生成图片。

职责：

- 读取 `AI_PROVIDER`、`AI_BASE_URL`、`AI_API_KEY`、`AI_IMAGE_MODEL`。
- `AI_PROVIDER=mock` 时返回 mock mode 成功状态。
- `AI_PROVIDER=dmxapi` 时检查 `AI_BASE_URL` 和 `AI_API_KEY`。
- DMXAPI 配置齐全时调用 OpenAI-compatible models endpoint 或轻量测试请求。
- 不暴露 API Key。

成功返回示例：

```json
{
  "success": true,
  "data": {
    "provider": "dmxapi",
    "mode": "connection-test",
    "message": "DMXAPI provider connection succeeded.",
    "imageModel": "gpt-image-2",
    "baseUrlConfigured": true
  }
}
```

## 后续待开发 API

First AI Generation 已在 v0.3.0 完成。后续可能需要补充以下 API 或能力：

- 获取单次生成任务详情
- 获取生成历史列表
- 重新生成或变体生成
- 保存生成结果到资产库
- 删除生成结果
- 更新生成结果状态
- 获取 AI 模型配置
- 获取 provider 连接健康状态
- 保存真实生成图片到媒体库
- 媒体分析结果详情查询
- 项目级素材库查询与筛选

新增 API 前必须确认：

- 是否已有相近 API 可复用
- 是否符合 Page -> API Route -> Service -> Repository -> Prisma -> SQLite 分层
- 是否使用 `apiSuccess` / `apiError`
- 是否需要数据库 schema 变更
- 是否影响现有前端调用
