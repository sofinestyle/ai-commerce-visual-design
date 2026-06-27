# PROJECT_CONTEXT

## 项目名称

AI 电商视觉设计平台

## 当前版本

v0.2.1

## 当前阶段

Sprint 3.5，准备进入真实 OpenAI 接入。

## 项目目标

构建一个面向电商团队的 AI 视觉设计平台，帮助用户围绕项目、商品、素材与生成任务完成电商视觉内容的上传、分析、生成与管理。

平台当前重点是打通从项目与商品管理，到素材上传与 Mock AI 生成的完整业务链路；下一阶段将把 Mock AI 生成替换或扩展为真实 OpenAI 能力。

## 已完成模块

- 项目管理基础能力
- 商品管理基础能力
- 媒体素材上传接口
- 媒体素材分析接口
- Mock AI 生成接口
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
- npm scripts
- ESLint

## 当前数据链路

当前核心链路为：

Page -> API Route -> Service -> Repository -> Prisma -> SQLite

媒体与 AI 相关链路为：

Page -> API Route -> Media / AI Service -> Repository -> Prisma -> SQLite

当前 AI 生成仍处于 Mock 阶段，生成请求进入 AI Service 后返回模拟结果，并按现有数据模型保存或返回给前端。

## 下一阶段目标：First AI Generation

下一阶段目标是完成 First AI Generation，即接入真实 OpenAI 生成能力，并在不破坏现有分层的前提下替换或扩展 Mock AI 流程。

优先目标：

- 明确 OpenAI 客户端封装位置
- 在 AI Service 内接入真实生成调用
- 保持 API Route 入参与返回格式稳定
- 保留 Mock AI 作为 fallback 或开发模式能力
- 增加生成过程中的错误处理、Loading 状态与失败提示
- 补充最小必要的环境变量说明与验证逻辑

