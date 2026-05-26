import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Permission: undefined;
  Scanner: undefined;
  Device: { deviceId: string; name: string | null };
};

export type PermissionScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Permission'
>;
export type ScannerScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Scanner'
>;
export type DeviceScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Device'
>;
