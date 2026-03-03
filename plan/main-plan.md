# 日记 APP 开发计划

## 项目概述
跨平台日记应用：
- **桌面版**：Electron (Windows) + React + TypeScript
- **移动版**：React Native (Android)
- **存储**：纯本地 JSON 文件（desktop）/ AsyncStorage（mobile）
- **核心功能**：日历视图 + AI 辅助写作（规划中）

---

## 已完成

### 第一阶段：桌面版基础功能 ✅

- Monorepo 结构（pnpm workspaces）
- `@diary/shared`：共享类型（Entry、Tag、Settings）
- Electron 主进程：JSON 文件存储（`diary.json`），IPC handlers：
  - `db:createEntry`（支持指定 createdAt）
  - `db:listEntries`（过滤软删除）
  - `db:updateEntry`
  - `db:deleteEntry`（软删除）
- 渲染进程 UI（App.tsx）：
  - **顶部导航栏**：日历 / 列表切换 + 设置按钮
  - **日历视图**（CalendarView）：
    - 月份导航（input[type=month] + 前后箭头）
    - 7 列日期格，今日高亮（绿色），有日记的日期显示绿点
    - 周日/周六分色（红/蓝）
    - 点击日期进入 DayView
    - 本月日记列表（RecentEntries）：可展开/折叠，可配置显示数量
  - **日视图**（DayView）：
    - 新建日记（textarea + Ctrl+Enter 保存）
    - 已有日记列表：显示时间、内容
    - 编辑（inline，Ctrl+Enter / Esc）
    - 删除（ConfirmDialog 二次确认，支持 Enter/Esc 键盘操作）
  - **全部日记视图**（AllEntriesView）：
    - 按年/月筛选，快速跳到当前月
    - 显示总篇数
    - inline 编辑 + 删除确认
  - **设置面板**（SettingsPanel）：右侧滑出，显示版本号，Esc 关闭
  - 版本号通过 `VITE_APP_VERSION` 注入

### 第二阶段：移动端脚手架 ✅

- React Native 0.84.1 + pnpm monorepo 兼容配置
- Metro bundler 配置（watchFolders + extraNodeModules）
- `@diary/shared/types` 子路径导入（避免 Node.js 依赖）
- 页面：`CalendarScreen`、`DayScreen`
- 导航：`RootNavigator`（React Navigation）
- 存储：`entryStorage.ts`（AsyncStorage CRUD）

---

## 待开发

### 第三阶段：移动端功能完善

**前提条件**：Android Studio + JDK 17 + ANDROID_HOME 环境变量

- [ ] CalendarScreen 实现日历视图（同 desktop）
- [ ] DayScreen 实现日记 CRUD
- [ ] 与 desktop 保持 UI 风格一致

### 第四阶段：AI 辅助写作

- [ ] 集成 Ollama（本地模型 qwen2.5:7b）
  - `OllamaAI.enhanceDiary(content)` — 润色文字
  - `OllamaAI.analyzeMood(content)` — 情绪分析
- [ ] 在 DayView 中添加「AI 润色」按钮
- [ ] 在设置面板中添加 Ollama URL 配置项
- [ ] Entry 类型中的 `aiEnhanced`、`mood` 字段实际存储

### 第五阶段：语音转文字

- [ ] 调研方案：Web Speech API（Electron）vs whisper.cpp
- [ ] 录音按钮集成到 DayView 编辑区
- [ ] 转写结果填入 textarea

### 第六阶段：打包分发

- [ ] electron-builder 配置 Windows NSIS 安装包
- [ ] 版本号管理（`VITE_APP_VERSION`）
- [ ] React Native APK 构建配置

---

## 技术决策记录

| 问题 | 决策 | 原因 |
|------|------|------|
| SQLite 原生绑定 | 改用 JSON 文件 | 无 MSVC 构建工具，无法编译 better-sqlite3 |
| sql.js WASM | 已放弃 | Electron + Vite 路径配置复杂 |
| Mobile 数据库 | AsyncStorage | 与 desktop JSON 逻辑对称，无原生依赖 |
| Monorepo 兼容 | metro.config.js watchFolders | pnpm 符号链接需要特殊处理 |
