// Trạng thái BLE
export type BLEState =
  | 'unknown'
  | 'resetting'
  | 'unsupported'
  | 'unauthorized'
  | 'poweredOff'
  | 'poweredOn';

// 1 device thấy được khi scan
export interface BLEDevice {
  id: string; // UUID (iOS) hoặc MAC (Android)
  name: string | null;
  rssi: number; // signal strength (dBm), càng âm càng yếu
  isConnectable: boolean;
}

// 1 service trên peripheral
export interface BLEService {
  uuid: string;
  isPrimary: boolean;
}

// 1 characteristic trong service
export interface BLECharacteristic {
  uuid: string;
  serviceUuid: string;
  properties: {
    read: boolean;
    write: boolean;
    writeWithoutResponse: boolean;
    notify: boolean;
    indicate: boolean;
  };
}

// Value nhận về (base64 encoded)
export interface BLECharValue {
  serviceUuid: string;
  charUuid: string;
  value: string; // base64
}
