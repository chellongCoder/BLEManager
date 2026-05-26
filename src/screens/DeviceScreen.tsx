import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { DeviceScreenProps } from '../navigation/types';
import type { BLECharacteristic } from '../native/types';
import { useDevice } from '../hook/useDevice';
import type { ConnState } from '../hook/useDevice';

// ─────────────────── Helpers ───────────────────
const CONN_COLOR: Record<ConnState, string> = {
  idle: '#94a3b8',
  connecting: '#f59e0b',
  connected: '#16a34a',
  disconnecting: '#f59e0b',
  disconnected: '#dc2626',
};

const CONN_LABEL: Record<ConnState, string> = {
  idle: 'Not connected',
  connecting: 'Connecting…',
  connected: 'Connected',
  disconnecting: 'Disconnecting…',
  disconnected: 'Disconnected',
};

function PropBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <View style={[styles.badge, !active && styles.badgeOff]}>
      <Text style={[styles.badgeText, !active && styles.badgeTextOff]}>
        {label}
      </Text>
    </View>
  );
}

// ─────────────────── CharRow ───────────────────
function CharRow({
  char,
  onRead,
}: {
  char: BLECharacteristic;
  onRead: () => Promise<string | null>;
}) {
  const [value, setValue] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRead = useCallback(async () => {
    setLoading(true);
    const v = await onRead();
    // v is base64 — decode to hex for display
    if (v) {
      // Decode base64 → readable hex string
      setValue(v); // Show raw base64 for now; decode on device later
    }
    setLoading(false);
  }, [onRead]);

  return (
    <View style={styles.charRow}>
      <View style={styles.charHeader}>
        <Text style={styles.charUuid} numberOfLines={1}>
          {char.uuid}
        </Text>
        <View style={styles.propRow}>
          <PropBadge label="R" active={char.properties.read} />
          <PropBadge label="W" active={char.properties.write} />
          <PropBadge label="W0" active={char.properties.writeWithoutResponse} />
          <PropBadge label="N" active={char.properties.notify} />
          <PropBadge label="I" active={char.properties.indicate} />
        </View>
      </View>

      {char.properties.read && (
        <TouchableOpacity
          style={styles.readBtn}
          onPress={handleRead}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#2563eb" />
          ) : (
            <Text style={styles.readBtnText}>Read</Text>
          )}
        </TouchableOpacity>
      )}

      {value !== null && (
        <View style={styles.valueRow}>
          <Text style={styles.valueLabel}>Value </Text>
          <Text style={styles.valueText}>{value}</Text>
        </View>
      )}
    </View>
  );
}

// ─────────────────── ServiceCard ───────────────────
function ServiceCard({
  serviceUuid,
  isPrimary,
  chars,
  onReadChar,
}: {
  serviceUuid: string;
  isPrimary: boolean;
  chars: BLECharacteristic[];
  onReadChar: (charUuid: string) => Promise<string | null>;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.serviceCard}>
      <TouchableOpacity
        style={styles.serviceHeader}
        onPress={() => setExpanded(v => !v)}
        activeOpacity={0.7}
      >
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceUuid} numberOfLines={1}>
            {serviceUuid}
          </Text>
          <Text style={styles.serviceMeta}>
            {isPrimary ? 'Primary' : 'Secondary'} · {chars.length}{' '}
            characteristics
          </Text>
        </View>
        <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.charList}>
          {chars.length === 0 ? (
            <Text style={styles.emptyText}>No characteristics found</Text>
          ) : (
            chars.map(char => (
              <CharRow
                key={char.uuid}
                char={char}
                onRead={() => onReadChar(char.uuid)}
              />
            ))
          )}
        </View>
      )}
    </View>
  );
}

// ─────────────────── DeviceScreen ───────────────────
export function DeviceScreen({ route }: DeviceScreenProps) {
  const { deviceId, name } = route.params;
  const {
    connState,
    services,
    characteristics,
    isDiscovering,
    error,
    connect,
    disconnect,
    discoverAll,
    readChar,
  } = useDevice(deviceId);

  // Auto-discover once connected
  useEffect(() => {
    if (connState === 'connected') {
      discoverAll();
    }
  }, [connState, discoverAll]);

  // Error alert
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
    }
  }, [error]);

  const handleReadChar = useCallback(
    (serviceUuid: string) => (charUuid: string) =>
      readChar(serviceUuid, charUuid),
    [readChar],
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* ── Device Header ── */}
      <View style={styles.header}>
        <Text style={styles.deviceName}>{name ?? 'Unknown Device'}</Text>
        <Text style={styles.deviceId}>{deviceId}</Text>

        <View style={styles.stateRow}>
          <View
            style={[styles.dot, { backgroundColor: CONN_COLOR[connState] }]}
          />
          <Text style={[styles.connLabel, { color: CONN_COLOR[connState] }]}>
            {CONN_LABEL[connState]}
          </Text>
        </View>
      </View>

      {/* ── Connect / Disconnect ── */}
      <View style={styles.actionRow}>
        {(connState === 'idle' || connState === 'disconnected') && (
          <TouchableOpacity style={styles.btnConnect} onPress={connect}>
            <Text style={styles.btnConnectText}>Connect</Text>
          </TouchableOpacity>
        )}

        {connState === 'connecting' && (
          <View style={styles.btnLoading}>
            <ActivityIndicator size="small" color="#2563eb" />
            <Text style={styles.btnLoadingText}>Connecting…</Text>
          </View>
        )}

        {connState === 'connected' && (
          <TouchableOpacity style={styles.btnDisconnect} onPress={disconnect}>
            <Text style={styles.btnDisconnectText}>Disconnect</Text>
          </TouchableOpacity>
        )}

        {connState === 'disconnecting' && (
          <View style={styles.btnLoading}>
            <ActivityIndicator size="small" color="#dc2626" />
            <Text style={styles.btnLoadingText}>Disconnecting…</Text>
          </View>
        )}
      </View>

      {/* ── Services ── */}
      {connState === 'connected' && (
        <View style={styles.servicesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Services{services.length > 0 ? ` (${services.length})` : ''}
            </Text>
            {isDiscovering && (
              <ActivityIndicator size="small" color="#2563eb" />
            )}
          </View>

          {!isDiscovering && services.length === 0 && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No services discovered yet</Text>
            </View>
          )}

          {services.map(svc => (
            <ServiceCard
              key={svc.uuid}
              serviceUuid={svc.uuid}
              isPrimary={svc.isPrimary}
              chars={characteristics[svc.uuid] ?? []}
              onReadChar={handleReadChar(svc.uuid)}
            />
          ))}
        </View>
      )}

      {(connState === 'idle' || connState === 'disconnected') && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyHint}>
            Tap Connect to see services & characteristics
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

// ─────────────────── Styles ───────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },

  // Header
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  deviceName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  deviceId: {
    fontSize: 11,
    color: '#94a3b8',
    fontFamily: 'Menlo',
    marginBottom: 12,
  },
  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  connLabel: { fontSize: 14, fontWeight: '600' },

  // Action row
  actionRow: {
    padding: 16,
  },
  btnConnect: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnConnectText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  btnDisconnect: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#dc2626',
  },
  btnDisconnectText: { color: '#dc2626', fontWeight: '700', fontSize: 16 },
  btnLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 10,
  },
  btnLoadingText: { color: '#64748b', fontWeight: '600' },

  // Services section
  servicesSection: { paddingHorizontal: 16, paddingBottom: 32 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // Service card
  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#fff',
  },
  serviceInfo: { flex: 1 },
  serviceUuid: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    fontFamily: 'Menlo',
  },
  serviceMeta: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  chevron: { fontSize: 12, color: '#94a3b8', marginLeft: 8 },

  // Char list
  charList: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  charRow: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  charHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  charUuid: {
    flex: 1,
    fontSize: 11,
    color: '#475569',
    fontFamily: 'Menlo',
  },
  propRow: {
    flexDirection: 'row',
    gap: 3,
    marginLeft: 8,
  },
  badge: {
    backgroundColor: '#2563eb',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  badgeOff: { backgroundColor: '#f1f5f9' },
  badgeText: { fontSize: 9, fontWeight: '700', color: '#fff' },
  badgeTextOff: { color: '#cbd5e1' },
  readBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    minWidth: 52,
    alignItems: 'center',
  },
  readBtnText: { fontSize: 12, fontWeight: '600', color: '#2563eb' },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    padding: 6,
  },
  valueLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '600' },
  valueText: {
    fontSize: 11,
    color: '#334155',
    fontFamily: 'Menlo',
    flex: 1,
  },

  // Empty states
  emptyCard: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: { color: '#94a3b8', fontSize: 13 },
  emptyHint: { color: '#94a3b8', fontSize: 14, textAlign: 'center' },
});
