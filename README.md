# Book Me - 个人日记应用 | [English Version](https://github.com/yc09od/ai-learning-calendar/blob/master/readme.en.md)

一款支持表情、标签、日历视图的个人日记应用，分桌面端和手机端两个版本。

本日记app已实现
1. 可视化日历。日历显示当天是否有日记。且显示当天主要心情。
2. 显示所有日记，且提供按年，年月，搜索。分页已支持。
3. 支持多语种。

本日记app开发计划
1. 可选添加AI api-key (暂时考虑Gemini或kimi)
2. 添加日记时，语音转文字。
3. AI合并当天日记。
4. AI总结，或修改当天日记。


## 平台

| 平台 | 技术栈 | 存储 |
|------|--------|------|
| **桌面端** | Electron 28 + React 18 + TypeScript + Vite | JSON 文件（userData 目录） |
| **手机端** | React Native 0.84.1 (Android) | AsyncStorage |

## 项目结构

```
packages/
  shared/       # 共享类型、AI 工具（@diary/shared）
  desktop/      # Electron 桌面应用（@diary/desktop）
  DiaryMobile/  # React Native Android 应用（@diary/mobile）
```

## 常用命令

### 桌面端

```bash
pnpm dev:desktop      # 启动开发模式（Electron + Vite HMR）
pnpm build:desktop    # 构建桌面应用
```

### 手机端

```bash
pnpm metro            # 启动 Metro bundler（开发时需要）
pnpm dev:android      # 安装 Debug 版到已连接设备（需要 Metro 运行）
pnpm build:android    # 打包 Release APK（不安装）
pnpm install:android  # 打包 Release APK 并直接安装到设备
pnpm build:aab        # 打包 Release aab（不安装）
```

### **Release 安装说明**：
`install:android` 无需启动 Metro，JS bundle 已内嵌在 APK 中。

手机需开启 USB 调试并通过 USB 连接电脑。
签名证书命令。在andriod/app 下运行 keytool -genkeypair -v -keystore {keyname}.keystore -alias {keyname-alias} -keyalg RSA -keysize 2048 -validity 10000 -storepass {password} -keypass {password} -dname "{CN=Your Name, OU=Dev, O=Your Company, L=Beijing, ST=Beijing, C=CN}"

更改gradle.properties config
MYAPP_UPLOAD_STORE_FILE={keyname}.keystore
MYAPP_UPLOAD_KEY_ALIAS={keyname-alias}
MYAPP_UPLOAD_STORE_PASSWORD={password}
MYAPP_UPLOAD_KEY_PASSWORD={password}

## 环境要求

- Node.js >= 22.11.0
- pnpm 9.x
- Android Studio + JDK 17 + `ANDROID_HOME` 环境变量（手机端）
