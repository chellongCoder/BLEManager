import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useBLE } from '../hook/useBLE';
import type { ScannerScreenProps } from '../navigation/types';

const BLE_STATE_COLOR: Record<string, string> = {
  poweredOn: '#16a34a',
  poweredOff: '#dc2626',
  unauthorized: '#dc2626',
  unsupported: '#dc2626',
  resetting: '#f59e0b',
  unknown: '#94a3b8',
};

export function ScannerScreen({ navigation }: ScannerScreenProps) {
  const { state, devices, isScanning, startScan, stopScan } = useBLE();
  const isPoweredOn = state === 'poweredOn';

  return (
    <View style={styles.container}>
      {/* BT state bar */}
      <View style={styles.stateBar}>
        <View
          style={[
            styles.stateDot,
            { backgroundColor: BLE_STATE_COLOR[state] ?? '#94a3b8' },
          ]}
        />
        <Text style={styles.stateText}>
          Bluetooth:{' '}
          <Text
            style={{
              color: BLE_STATE_COLOR[state] ?? '#94a3b8',
              fontWeight: '700',
            }}
          >
            {state}
          </Text>
        </Text>
      </View>

      {/* Scan button */}
      <TouchableOpacity
        style={[
          styles.scanBtn,
          isScanning ? styles.scanBtnStop : styles.scanBtnStart,
          !isPoweredOn && !isScanning && styles.scanBtnDisabled,
        ]}
        onPress={isScanning ? stopScan : startScan}
        disabled={!isPoweredOn && !isScanning}
      >
        {isScanning ? (
          <View style={styles.scanBtnInner}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.scanBtnText}>Stop Scan</Text>
          </View>
        ) : (
          <Text style={styles.scanBtnText}>Start Scan</Text>
        )}
      </TouchableOpacity>

      {/* Device count */}
      {devices.length > 0 && (
        <Text style={styles.countLabel}>
          {devices.length} device{devices.length > 1 ? 's' : ''} found
        </Text>
      )}

      {/* Device list */}
      <FlatList
        data={devices}
        keyExtractor={item => item.id}
        contentContainerStyle={
          devices.length === 0 ? styles.emptyContainer : undefined
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() =>
              navigation.navigate('Device', {
                deviceId: item.id,
                name: item.name,
              })
            }
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={styles.deviceIconBadge}>
                <Text style={styles.deviceIconText}>
                  {(item.name ?? 'UN').slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={styles.name}>{item.name ?? 'Unknown Device'}</Text>
                <Text style={styles.id} numberOfLines={1}>
                  {item.id}
                </Text>
              </View>
            </View>
            <View style={styles.rowRight}>
              <Text
                style={[
                  styles.rssi,
                  {
                    color:
                      item.rssi > -70
                        ? '#16a34a'
                        : item.rssi > -90
                        ? '#f59e0b'
                        : '#dc2626',
                  },
                ]}
              >
                {item.rssi} dBm
              </Text>
              <Text style={styles.chevron}>{'>'}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>BLE</Text>
            </View>
            <Text style={styles.emptyTitle}>
              {isScanning ? 'Scanning for devices...' : 'No devices found'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {isScanning
                ? 'Make sure nearby BLE devices are advertising'
                : 'Tap Start Scan to discover nearby BLE devices'}
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },

  // State bar
  stateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 8,
  },
  stateDot: { width: 8, height: 8, borderRadius: 4 },
  stateText: { fontSize: 13, color: '#64748b' },

  // Scan button
  scanBtn: {
    margin: 16,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  scanBtnStart: { backgroundColor: '#2563eb' },
  scanBtnStop: { backgroundColor: '#dc2626' },
  scanBtnDisabled: { backgroundColor: '#cbd5e1' },
  scanBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  scanBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  // Count label
  countLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginHorizontal: 16,
    marginBottom: 8,
  },

  // Device row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  deviceIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceIconText: { fontSize: 11, fontWeight: '800', color: '#2563eb' },
  name: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  id: { fontSize: 11, color: '#94a3b8', fontFamily: 'Menlo', maxWidth: 200 },
  rssi: { fontSize: 12, fontWeight: '600' },
  chevron: { fontSize: 14, color: '#cbd5e1', fontWeight: '700' },
  separator: { height: 1, backgroundColor: '#f1f5f9', marginLeft: 68 },

  // Empty state
  emptyContainer: { flex: 1 },
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyIconText: { fontSize: 18, fontWeight: '800', color: '#94a3b8' },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
});
