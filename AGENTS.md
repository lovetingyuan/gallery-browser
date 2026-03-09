# Gallery Browser AI Agent 操作指南

欢迎来到 `gallery-browser` 项目！本文件是本仓库中 AI 编程助手（Agent）的最终操作指南。你**必须**严格遵守这些约定、架构规则和代码风格。

## 1. 背景与架构

- **项目目标**：一个本地优先（local-first）的单页应用（SPA），旨在让用户能够在浏览器中无缝浏览本地的图片和视频。
- **核心 API**：严重依赖文件系统访问 API（File System Access API，如 `showOpenFilePicker`, `showDirectoryPicker`）以安全地访问文件，而无需将它们上传。
- **平台**：作为 Cloudflare Worker（通过 Cloudflare Pages/Workers）部署，前端使用 Vue 3。
- **模式**：使用组合式 API (Composition API) 以及本地优先的状态管理。没有后端存储；用户的文件系统是唯一的真实数据源 (single source of truth)。

## 2. 构建、代码检查与测试命令

当你需要验证代码或运行进程时，请使用以下 CLI 命令：

- **本地开发服务器**：`npm run dev` （运行 Vite + Cloudflare 本地代理）。
- **类型检查**：`npm run type-check` （关键步骤：必须运行此命令以捕获 TS 错误）。
- **代码检查 (Linting)**：`npm run lint` （运行 oxlint。写完代码后运行此命令）。
- **格式化**：`npm run format` （运行 oxfmt。不要手动挑剔格式问题；让格式化工具来处理）。
- **生产构建**：`npm run build`
- **预览生产环境**：`npm run preview` （构建并运行 `wrangler dev`）。
- **部署**：`npm run deploy` （通过 wrangler 部署）。
- **Worker 类型**：`npm run cf-typegen` （为 Cloudflare 环境生成 `worker-configuration.d.ts`）。

**测试**:
_注意_：目前没有配置明确的单元测试运行器。如果被要求添加测试，默认使用适用于 Vue 3 生态系统的 **Vitest**。
要运行单个测试（如果已安装 Vitest）：`npx vitest run path/to/file.test.ts`。

## 3. 技术栈

- **框架**：Vue 3 (Composition API 使用 `<script setup>`)
- **路由**：Vue Router
- **样式**：Tailwind CSS v4 + DaisyUI v5
- **构建工具**：Vite 配合 `@cloudflare/vite-plugin`
- **后端/部署**：Cloudflare Workers (`server/index.ts`)
- **Linter/格式化工具**：Oxlint & Oxfmt

## 4. 代码风格与格式化规范

- 所有 Vue 组件都使用 `<script setup lang="ts">`。不要使用选项式 API (Options API)。
- 严格使用 **TypeScript**。不惜一切代价避免使用 `any`。如果类型确实无法确定，请使用 `unknown` 并适当地进行断言/类型收窄。
- **格式化**：不要关心空格还是 Tab、引号类型等问题——`oxfmt` 会将其标准化。将重点放在逻辑结构上。
- **导入**：按逻辑对导入进行分组：
  1. Vue / 核心库 (`vue`, `vue-router`)。
  2. 第三方包。
  3. 内部工具和 store (`@/utils/...`)。
  4. 内部组件 (`@/components/...`)。
  5. 类型和接口 (`import type { ... }`)。
- 所有 `src` 文件夹的导入都使用绝对路径别名 (`@/`)，而不是相对路径 (`../../`)。

## 5. 命名约定

- **文件/组件**：Vue 组件使用大驼峰命名法 (PascalCase，例如 `MediaViewer.vue`, `ImageGrid.vue`)。工具文件使用短横线命名法 (kebab-case) 或小驼峰命名法 (camelCase，例如 `file-utils.ts` 或 `fileUtils.ts`)。
- **变量**：响应式变量、refs 和函数使用小驼峰命名法 (camelCase，例如 `mediaFiles`, `handleFileSelection`)。
- **常量**：全局常量或不可变的配置对象使用全大写加下划线命名法 (UPPER_SNAKE_CASE，例如 `MAX_FILE_SIZE`, `ALLOWED_TYPES`)。
- **Composables (组合式函数)**：以 `use` 为前缀 (例如 `useFileSystem.ts`, `useMediaGallery.ts`)。
- **类型/接口**：使用大驼峰命名法 (PascalCase)，通常不带 `I` 前缀 (例如 `MediaFile`, `GalleryConfig`)。

## 6. 类型安全与 TypeScript

- 为与 DOM 或文件系统 API 交互的对象定义明确的接口。
- 对于 `showOpenFilePicker`，请注意它返回一个 `Promise<FileSystemFileHandle[]>`。如果缺少类型，由于标准库的覆盖可能不完善，你可能需要提供内联类型声明或使用 `@types/dom-file-system-access`。
- 在 `<script setup>` 中始终使用 `.value` 解包 `ref`，但**绝对不要**在 `<template>` 中这样做。
- 将复杂的业务逻辑保留在组件之外。使用 composables 来提取状态和逻辑。

## 7. UI, 样式与 DaisyUI

- 使用 **Tailwind V4** 实用类结合 **DaisyUI V5** 组件类。
- 依赖 DaisyUI 的语义化类 (例如 `btn`, `btn-primary`, `card`, `modal`, `grid`) 来快速、一致地构建 UI。
- 除非绝对必要，否则不要在 `<style scoped>` 中编写自定义 CSS 来覆盖行为或创建 Tailwind 未涵盖的动画。
- 确保应用程序完全响应式。首先使用 Tailwind 的 `md:`, `lg:` 断点测试移动端布局。
- 如果接到指令，通过 DaisyUI 的主题处理动态支持深色/浅色模式。

## 8. 错误处理与状态

- 如果用户中止或拒绝权限（例如 `AbortError`, `NotAllowedError`），文件系统 API 会抛出错误。将 `showOpenFilePicker` 调用包裹在 `try/catch` 块中。
- 当文件选择被中止时，使用 Toast 通知或内联警告优雅地通知用户，而不是在控制台报错。
- 仔细管理对象 URL (Object URLs)！当媒体文件从图库中移除时，始终调用 `URL.revokeObjectURL()` 以防止严重的内存泄漏。

## 9. AI Agent 操作指令

1. **先读后写**：在进行更改之前，使用你的 `read` 和 `glob` 工具来熟悉现有代码。
2. **一个功能，一个范围**：仅专注于请求的功能。不要在受影响的文件之外执行未经请求的重构。
3. **验证**：在完成任务之前，仔细检查它是否能构建或通过类型检查 (`npm run type-check`)。
4. **假定本地优先**：除非明确被要求，否则不要尝试将用户文件上传到 Cloudflare Worker。文件保持在本地，并通过 `URL.createObjectURL()` 渲染。
5. **不要幻觉**：不要假设存在标准测试工具（如 Jest）。先检查 `package.json`。
6. **自我纠正**：如果工具返回错误（例如 TypeScript 编译失败），请在展示给用户之前立即修复它。
7. **Git操作**：如果你认为工作顺利完成，就按照Conventional Commits规范生成提交信息并自动提交，并且把提交信息打印出来。
