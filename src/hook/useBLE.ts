import { useCallback, useEffect, useState } from 'react';
import { BLEDevice, BLEState } from '../native/types';
import { ble } from '../native/ble';

export function useBLE() {
  const [state, setState] = useState<BLEState>('unknown');
  const [devices, setDevices] = useState<BLEDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  // 🔁 Subscribe lifecycle events
  useEffect(() => {
    const subs = [
      ble.onStateChange(setState),
      ble.onDeviceFound(device => {
        setDevices(prev => {
          // dedup theo id
          if (prev.some(d => d.id === device.id)) return prev;
          return [...prev, device];
        });
      }),
    ];

    // Init state
    ble.getState().then(setState);

    return () => subs.forEach(s => s.remove());
  }, []);

  const startScan = useCallback(async () => {
    setDevices([]);
    setIsScanning(true);
    await ble.startScan();
  }, []);

  const stopScan = useCallback(async () => {
    setIsScanning(false);
    await ble.stopScan();
  }, []);

  return { state, devices, isScanning, startScan, stopScan };
}
