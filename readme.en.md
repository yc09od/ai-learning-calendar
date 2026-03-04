# Book Me - Personal Diary App

A personal diary app with emoji support, tags, and calendar view. Available on both desktop and mobile.

## Features (Implemented)

1. **Visual Calendar** — Shows whether a diary entry exists for each day, and displays the main mood of the day.
2. **All Entries View** — Browse all entries with filtering by year, year/month, and full-text search. Pagination supported.
3. **Multi-language support.**

## Roadmap

1. Optional AI API key integration (considering Gemini or Kimi).
2. Voice-to-text when adding entries.
3. AI-assisted merging of multiple entries in a day.
4. AI summary or editing suggestions for daily entries.


## Platforms

| Platform | Tech Stack | Storage |
|----------|------------|---------|
| **Desktop** | Electron 28 + React 18 + TypeScript + Vite | JSON file (userData directory) |
| **Mobile** | React Native 0.84.1 (Android) | AsyncStorage |

## Project Structure

```
packages/
  shared/       # Shared types and AI utilities (@diary/shared)
  desktop/      # Electron desktop app (@diary/desktop)
  DiaryMobile/  # React Native Android app (@diary/mobile)
```

## Commands

### Desktop

```bash
pnpm dev:desktop      # Start dev mode (Electron + Vite HMR)
pnpm build:desktop    # Build desktop app
```

### Mobile

```bash
pnpm metro            # Start Metro bundler (required for dev)
pnpm dev:android      # Install debug build to connected device (requires Metro)
pnpm build:android    # Build release APK (no install)
pnpm install:android  # Build release APK and install to device
```

> **Release install note**: `install:android` does not require Metro — the JS bundle is bundled inside the APK.
> USB debugging must be enabled on the device and connected via USB.

## Requirements

- Node.js >= 22.11.0
- pnpm 9.x
- Android Studio + JDK 17 + `ANDROID_HOME` environment variable (mobile only)
