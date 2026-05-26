import { useCallback, useEffect, useState } from 'react';
import { ble } from '../native/ble';
import type { BLECharacteristic, BLEService } from '../native/types';

export type ConnState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnecting'
  | 'disconnected';

export function useDevice(deviceId: string) {
  const [connState, setConnState] = useState<ConnState>('idle');
  const [services, setServices] = useState<BLEService[]>([]);
  // serviceUuid → characteristic list
  const [characteristics, setCharacteristics] = useState<
    Record<string, BLECharacteristic[]>
  >({});
  const [error, setError] = useState<string | null>(null);
  const [isDiscovering, setIsDiscovering] = useState(false);

  // ─────────── Subscribe connect/disconnect events ───────────
  useEffect(() => {
    const subs = [
      ble.onConnected(id => {
        if (id === deviceId) {
          setConnState('connected');
          setError(null);
        }
      }),
      ble.onDisconnected(id => {
        if (id === deviceId) {
          setConnState('disconnected');
          setServices([]);
          setCharacteristics({});
        }
      }),
    ];
    return () => subs.forEach(s => s.remove());
  }, [deviceId]);

  // ─────────── Actions ───────────
  const connect = useCallback(async () => {
    setError(null);
    setConnState('connecting');
    try {
      await ble.connect(deviceId);
      // connState updated by onConnected event ↑
    } catch (e: unknown) {
      setConnState('idle');
      setError(e instanceof Error ? e.message : 'Connection failed');
    }
  }, [deviceId]);

  const disconnect = useCallback(async () => {
    setConnState('disconnecting');
    try {
      await ble.disconnect(deviceId);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Disconnect failed');
    }
  }, [deviceId]);

  const discoverAll = useCallback(async () => {
    setError(null);
    setIsDiscovering(true);
    try {
      const svcs = await ble.discoverServices(deviceId);
      setServices(svcs);

      // Discover characteristics for each service in parallel
      const entries = await Promise.all(
        svcs.map(async svc => {
          const chars = await ble.discoverCharacteristics(deviceId, svc.uuid);
          return [svc.uuid, chars] as const;
        }),
      );
      setCharacteristics(Object.fromEntries(entries));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Discovery failed');
    } finally {
      setIsDiscovering(false);
    }
  }, [deviceId]);

  const readChar = useCallback(
    async (serviceUuid: string, charUuid: string): Promise<string | null> => {
      try {
        return await ble.readCharacteristic(deviceId, serviceUuid, charUuid);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Read failed');
        return null;
      }
    },
    [deviceId],
  );

  return {
    connState,
    services,
    characteristics,
    isDiscovering,
    error,
    connect,
    disconnect,
    discoverAll,
    readChar,
  };
}
