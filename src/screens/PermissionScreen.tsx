import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  PermissionsAndroid,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useBLE } from '../hook/useBLE';
import type { PermissionScreenProps } from '../navigation/types';

type PermStatus = 'unknown' | 'granted' | 'denied' | 'blocked';

const STATUS_COLOR: Record<PermStatus, string> = {
  unknown: '#999',
  granted: '#16a34a',
  denied: '#dc2626',
  blocked: '#dc2626',
};

// Dùng ký tự ASCII thay emoji để tránh font rendering issue trên iOS simulator
const STATUS_ICON: Record<PermStatus, string> = {
  unknown: '○',
  granted: '✓',
  denied: '✕',
  blocked: '✕',
};

const BLE_STATE_COLOR: Record<string, string> = {
  poweredOn: '#16a34a',
  poweredOff: '#dc2626',
  unauthorized: '#dc2626',
  unsupported: '#dc2626',
  resetting: '#f59e0b',
  unknown: '#999',
};

function PermCard({
  icon,
  label,
  sublabel,
  status,
  hint,
}: {
  icon: string;
  label: string;
  sublabel?: string;
  status: PermStatus;
  hint?: string;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        {/* Badge view thay emoji để tránh font issue */}
        <View style={styles.cardIcon}>
          <Text style={styles.cardIconText}>{icon}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardLabel}>{label}</Text>
          {sublabel ? (
            <Text style={styles.cardSublabel}>{sublabel}</Text>
          ) : null}
        </View>
        <View
          style={[styles.statusPill, { borderColor: STATUS_COLOR[status] }]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: STATUS_COLOR[status] },
            ]}
          />
          <Text style={[styles.statusBadge, { color: STATUS_COLOR[status] }]}>
            {STATUS_ICON[status]} {status}
          </Text>
        </View>
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

export function PermissionScreen({ navigation }: PermissionScreenProps) {
  const { state } = useBLE();
  const [btPerm, setBtPerm] = useState<PermStatus>('unknown');
  const [locationPerm, setLocationPerm] = useState<PermStatus>('unknown');

  // ─── iOS: permission is implicit via CoreBluetooth ───
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    if (state === 'unauthorized') {
      setBtPerm('blocked');
    } else if (state === 'unsupported') {
      setBtPerm('denied');
    } else if (state !== 'unknown') {
      // poweredOn / poweredOff / resetting → permission was granted
      setBtPerm('granted');
    }
    // iOS 13+ does not require Location for BLE
    setLocationPerm('granted');
  }, [state]);

  // ─── Android: explicit PermissionsAndroid ───
  const checkAndroid = useCallback(async () => {
    if (Platform.OS !== 'android') return;
    if (Platform.Version >= 31) {
      const results = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]);
      const scan = results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN];
      const conn = results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT];
      if (scan === 'granted' && conn === 'granted') {
        setBtPerm('granted');
      } else if (scan === 'never_ask_again' || conn === 'never_ask_again') {
        setBtPerm('blocked');
      } else {
        setBtPerm('denied');
      }
      setLocationPerm('granted'); // API 31+ doesn't need Location for BLE
    } else {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      if (result === 'granted') {
        setLocationPerm('granted');
        setBtPerm('granted');
      } else if (result === 'never_ask_again') {
        setLocationPerm('blocked');
      } else {
        setLocationPerm('denied');
      }
    }
  }, []);

  // ─── Derived: are we ready to scan? ───
  const isReady =
    Platform.OS === 'ios'
      ? state === 'poweredOn'
      : btPerm === 'granted' && locationPerm === 'granted';

  // In DEV / simulator mode, allow bypass so we can preview UI
  const canNavigate = isReady || __DEV__;

  const openSettings = () => {
    Alert.alert(
      'Open Settings',
      'Allow Bluetooth access in Settings → Privacy → Bluetooth',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Settings', onPress: () => Linking.openSettings() },
      ],
    );
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={styles.hero}>
        {/* Styled icon thay vì emoji để tránh font rendering issue */}
        <View style={styles.heroIconBadge}>
          <Text style={styles.heroIconText}>BLE</Text>
        </View>
        <Text style={styles.heroTitle}>Bluetooth Manager</Text>
        <Text style={styles.heroSub}>
          Scan, connect and explore BLE devices
        </Text>
      </View>

      {/* BLE State */}
      <Text style={styles.section}>Bluetooth Status</Text>
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View
            style={[
              styles.dot,
              { backgroundColor: BLE_STATE_COLOR[state] ?? '#999' },
            ]}
          />
          <Text
            style={[
              styles.stateText,
              { color: BLE_STATE_COLOR[state] ?? '#999' },
            ]}
          >
            {state}
          </Text>
        </View>
        {state === 'poweredOff' && (
          <Text style={styles.hint}>
            Turn on Bluetooth in Control Center or Settings
          </Text>
        )}
        {state === 'unknown' && (
          <Text style={styles.hint}>
            Waiting for CoreBluetooth to initialize…
          </Text>
        )}
      </View>

      {/* Permissions */}
      <Text style={styles.section}>Permissions</Text>

      <PermCard
        icon="BT"
        label="Bluetooth"
        sublabel={
          Platform.OS === 'android'
            ? 'BLUETOOTH_SCAN + BLUETOOTH_CONNECT'
            : 'Managed by CoreBluetooth'
        }
        status={btPerm}
        hint={
          btPerm === 'blocked'
            ? 'Permission permanently denied — open Settings to enable'
            : undefined
        }
      />

      {Platform.OS === 'android' || locationPerm !== 'granted' ? (
        <PermCard
          icon="LOC"
          label="Location"
          sublabel="Required for BLE scan on Android <= 11"
          status={locationPerm}
        />
      ) : null}

      {/* Actions */}
      <View style={styles.actions}>
        {Platform.OS === 'android' && !isReady && (
          <TouchableOpacity style={styles.btnSecondary} onPress={checkAndroid}>
            <Text style={styles.btnSecondaryText}>Request Permissions</Text>
          </TouchableOpacity>
        )}

        {btPerm === 'blocked' && (
          <TouchableOpacity style={styles.btnSecondary} onPress={openSettings}>
            <Text style={styles.btnSecondaryText}>⚙️ Open Settings</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.btnPrimary, !canNavigate && styles.btnDisabled]}
          disabled={!canNavigate}
          onPress={() => navigation.navigate('Scanner')}
        >
          <Text style={styles.btnPrimaryText}>
            {isReady
              ? 'Open Scanner →'
              : __DEV__
              ? 'Open Scanner (Preview) →'
              : 'Open Scanner →'}
          </Text>
        </TouchableOpacity>
      </View>

      {__DEV__ && !isReady && (
        <Text style={styles.devNote}>
          [i] Running in preview mode — BLEModule not linked
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f1f5f9',
  },

  // Hero
  hero: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 8,
  },
  heroIconBadge: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  heroIconText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
  heroTitle: { fontSize: 26, fontWeight: '700', color: '#0f172a' },
  heroSub: { fontSize: 14, color: '#64748b', marginTop: 4 },

  // Section label
  section: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 16,
  },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // cardIcon là View badge — render trong PermCard
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardIconText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563eb',
    letterSpacing: 0.5,
  },
  cardInfo: { flex: 1 },
  cardLabel: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  cardSublabel: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadge: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },

  // BLE state row
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  stateText: {
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'capitalize',
  },

  hint: { fontSize: 12, color: '#94a3b8', marginTop: 8 },

  // Buttons
  actions: { marginTop: 24, gap: 10 },
  btnPrimary: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  btnDisabled: { backgroundColor: '#cbd5e1' },
  btnSecondary: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#2563eb',
  },
  btnSecondaryText: {
    color: '#2563eb',
    fontWeight: '600',
    fontSize: 15,
  },

  devNote: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 16,
    marginBottom: 8,
  },
});
