import { NativeEventEmitter, NativeModules } from 'react-native';
import type {
  BLECharacteristic,
  BLECharValue,
  BLEDevice,
  BLEService,
  BLEState,
} from './types';

// ─────────────────── 🌉 Module guard ───────────────────
const { BLEModule } = NativeModules;

export const BLE_AVAILABLE = !!BLEModule;

if (!BLE_AVAILABLE) {
  console.warn(
    '[BLE] BLEModule not linked — running in UI-preview mode.\n' +
      'Run pod install + rebuild to enable native Bluetooth.',
  );
}

// ─────────────────── 📡 Event emitter ───────────────────
// NativeEventEmitter crashes when module is null, so we guard it
const emitter = BLE_AVAILABLE ? new NativeEventEmitter(BLEModule) : null;

const EVENTS = {
  STATE_CHANGE: 'BLE_STATE_CHANGE',
  DEVICE_FOUND: 'BLE_DEVICE_FOUND',
  CONNECTED: 'BLE_CONNECTED',
  DISCONNECTED: 'BLE_DISCONNECTED',
  CHAR_VALUE: 'BLE_CHAR_VALUE',
} as const;

// Noop subscription returned when emitter is unavailable
const NOOP_SUB = { remove: () => {} };

// ─────────────────── 🎯 Public API ───────────────────
export const ble = {
  // 🔍 State
  getState: (): Promise<BLEState> =>
    BLE_AVAILABLE
      ? BLEModule.getState()
      : Promise.resolve('unknown' as BLEState),

  // 🔍 Scan
  startScan: (serviceUuids: string[] | null = null): Promise<void> =>
    BLE_AVAILABLE ? BLEModule.startScan(serviceUuids) : Promise.resolve(),

  stopScan: (): Promise<void> =>
    BLE_AVAILABLE ? BLEModule.stopScan() : Promise.resolve(),

  // 🤝 Connect
  connect: (deviceId: string): Promise<void> =>
    BLE_AVAILABLE
      ? BLEModule.connect(deviceId)
      : Promise.reject(new Error('BLEModule not available')),

  disconnect: (deviceId: string): Promise<void> =>
    BLE_AVAILABLE
      ? BLEModule.disconnect(deviceId)
      : Promise.reject(new Error('BLEModule not available')),

  // 🔍 Discover
  discoverServices: (deviceId: string): Promise<BLEService[]> =>
    BLE_AVAILABLE
      ? BLEModule.discoverServices(deviceId)
      : Promise.reject(new Error('BLEModule not available')),

  discoverCharacteristics: (
    deviceId: string,
    serviceUuid: string,
  ): Promise<BLECharacteristic[]> =>
    BLE_AVAILABLE
      ? BLEModule.discoverCharacteristics(deviceId, serviceUuid)
      : Promise.reject(new Error('BLEModule not available')),

  // 📖 Read
  readCharacteristic: (
    deviceId: string,
    serviceUuid: string,
    charUuid: string,
  ): Promise<string> =>
    BLE_AVAILABLE
      ? BLEModule.readCharacteristic(deviceId, serviceUuid, charUuid)
      : Promise.reject(new Error('BLEModule not available')),

  // ✍️ Write (data = base64)
  writeCharacteristic: (
    deviceId: string,
    serviceUuid: string,
    charUuid: string,
    base64Data: string,
    withResponse = true,
  ): Promise<void> =>
    BLE_AVAILABLE
      ? BLEModule.writeCharacteristic(
          deviceId,
          serviceUuid,
          charUuid,
          base64Data,
          withResponse,
        )
      : Promise.reject(new Error('BLEModule not available')),

  // 🔔 Notify
  setNotification: (
    deviceId: string,
    serviceUuid: string,
    charUuid: string,
    enable: boolean,
  ): Promise<void> =>
    BLE_AVAILABLE
      ? BLEModule.setNotification(deviceId, serviceUuid, charUuid, enable)
      : Promise.reject(new Error('BLEModule not available')),

  // ─────────── 📡 Event subscriptions ───────────
  onStateChange: (cb: (state: BLEState) => void) =>
    emitter?.addListener(EVENTS.STATE_CHANGE, data => cb(data.state)) ??
    NOOP_SUB,

  onDeviceFound: (cb: (device: BLEDevice) => void) =>
    emitter?.addListener(EVENTS.DEVICE_FOUND, cb) ?? NOOP_SUB,

  onConnected: (cb: (deviceId: string) => void) =>
    emitter?.addListener(EVENTS.CONNECTED, data => cb(data.deviceId)) ??
    NOOP_SUB,

  onDisconnected: (cb: (deviceId: string) => void) =>
    emitter?.addListener(EVENTS.DISCONNECTED, data => cb(data.deviceId)) ??
    NOOP_SUB,

  onCharValue: (cb: (value: BLECharValue) => void) =>
    emitter?.addListener(EVENTS.CHAR_VALUE, cb) ?? NOOP_SUB,
};
