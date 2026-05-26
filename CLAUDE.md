# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

React Native 0.85.3 (TypeScript) app for managing BLE (Bluetooth Low Energy) devices. This is a **learning project** — the goal is to write native modules from scratch (Swift + Kotlin) without using BLE libraries, to understand the RN ↔ Native ↔ CoreBluetooth/Android BLE bridge.

## Commands

```bash
# Node version (REQUIRED — project engine requires >=22.11.0)
nvm use 22.14.0

# Start Metro bundler (must run BEFORE Xcode build)
npx react-native start --reset-cache

# Build iOS (see note below — CLI broken with Xcode 26)
open ios/BLEManager.xcworkspace

# Lint
./node_modules/.bin/eslint src/ --format stylish

# TypeScript check
./node_modules/.bin/tsc --noEmit

# Install pods (after adding native deps)
cd ios && pod install && cd ..

# Install packages (use --ignore-engines with Node 22 + older yarn)
yarn add <package> --ignore-engines
```

> **iOS Build Note:** `yarn ios` / `react-native run-ios` fail with **error code 70** because Xcode 26.2 does not accept iOS 18 simulators via CLI. Workaround: open `ios/BLEManager.xcworkspace` in Xcode, select an **iOS 26.x** simulator from `Product → Destination`, click Run. Metro must already be running.

## Architecture

### Navigation Flow
```
PermissionScreen (initial, no header) → ScannerScreen → DeviceScreen
```

Typed params live in `src/navigation/types.ts`. Always import `*ScreenProps` from there — never inline `NativeStackScreenProps<any>`.

### Layer Stack
```
src/screens/          ← UI only, no business logic
    ↓
src/hook/             ← useBLE.ts (adapter + scan), useDevice.ts (per-device)
    ↓
src/native/ble.ts     ← thin wrapper + BLE_AVAILABLE guard
    ↓
NativeModules.BLEModule  ← Swift (iOS) / Kotlin (Android) — not yet linked in simulator
```

### BLEModule Mock Mode
`src/native/ble.ts` exports `BLE_AVAILABLE = !!NativeModules.BLEModule`. When null (simulator / not linked), all calls return graceful defaults — **never throw**. Event subscriptions return `NOOP_SUB = { remove: () => {} }`.

```ts
// Correct guard pattern:
getState: () => BLE_AVAILABLE ? BLEModule.getState() : Promise.resolve('unknown'),
onStateChange: (cb) => emitter?.addListener(EVENTS.STATE_CHANGE, cb) ?? NOOP_SUB,
```

### Hook Responsibilities
- `useBLE` — BLE adapter state + device scan list → used in ScannerScreen
- `useDevice(deviceId)` — ConnState, services[], characteristics map → used in DeviceScreen
- Folder is `src/hook/` (singular)

### Native Event Names (must match native side exactly)
| Event constant | Payload |
|---|---|
| `BLE_STATE_CHANGE` | `{ state: BLEState }` |
| `BLE_DEVICE_FOUND` | `BLEDevice` |
| `BLE_CONNECTED` | `{ deviceId: string }` |
| `BLE_DISCONNECTED` | `{ deviceId: string }` |
| `BLE_CHAR_VALUE` | `{ serviceUuid, charUuid, value: string }` (base64) |

## Critical Constraints

### No Emoji in Text Components
Emoji display as **"?" boxes** on iOS 26 simulator with Xcode 26 + RN 0.85 + Hermes. Replace with:
- Short-text View badges (`"BLE"`, `"BT"`, `"LOC"`, `"R"`, `"W"`)
- Colored dot `View` (w:8-10, h:8-10, borderRadius: half)
- ASCII alternatives: `>`, `▲`, `▼`, `✓`, `✕`, `○`

### Node Version
Always `nvm use 22.14.0` before running any command. `yarn start` fails on Node 20 with `util.styleText is not a function`. Use `npx react-native start` directly if yarn engine check blocks you.

### Simulator vs Real Device
- `BLE_AVAILABLE` is `false` in simulator (BLEModule not linked)
- `__DEV__` bypasses the permission gate on PermissionScreen for UI preview
- Actual BLE scanning/connecting requires a physical device with the native module built

## Key Types

```ts
// src/native/types.ts
type BLEState = 'unknown' | 'resetting' | 'unsupported' | 'unauthorized' | 'poweredOff' | 'poweredOn'
type ConnState = 'idle' | 'connecting' | 'connected' | 'disconnecting' | 'disconnected'
interface BLEDevice { id: string; name: string | null; rssi: number; isConnectable: boolean }
interface BLEService { uuid: string; isPrimary: boolean }
interface BLECharacteristic { uuid: string; serviceUuid: string; properties: { read, write, writeWithoutResponse, notify, indicate: boolean } }
```

## Code Conventions
- `import type` for type-only imports
- Device badge: `(item.name ?? 'UN').slice(0, 2).toUpperCase()`
- RSSI color: `> -70` → green `#16a34a`, `> -90` → amber `#f59e0b`, else red `#dc2626`
- Characteristic values from native are **base64 encoded strings**
- `StyleSheet.create` for all styles — no inline style objects

## ESLint + Prettier
- `.eslintrc.js`: extends `['@react-native', 'plugin:prettier/recommended']`
- `.prettierrc.js`: `singleQuote: true`, `trailingComma: 'all'`, `arrowParens: 'avoid'`
- VS Code: `editor.defaultFormatter` → `esbenp.prettier-vscode` (set for js/ts/jsx/tsx)
- Prettier violations show as ESLint errors — run `eslint --fix` to auto-format
