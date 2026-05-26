/**
 * BLE Manager — Root navigation setup
 * Flow: Permission → Scanner → Device
 */

import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PermissionScreen } from './src/screens/PermissionScreen';
import { ScannerScreen } from './src/screens/ScannerScreen';
import { DeviceScreen } from './src/screens/DeviceScreen';
import type { RootStackParamList } from './src/navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const isDark = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Permission"
          screenOptions={{
            headerStyle: { backgroundColor: isDark ? '#0f172a' : '#fff' },
            headerTitleStyle: { fontWeight: '700' },
            headerTintColor: '#2563eb',
          }}
        >
          <Stack.Screen
            name="Permission"
            component={PermissionScreen}
            options={{ title: 'BLE Manager', headerShown: false }}
          />
          <Stack.Screen
            name="Scanner"
            component={ScannerScreen}
            options={{ title: 'Scanner' }}
          />
          <Stack.Screen
            name="Device"
            component={DeviceScreen}
            options={({ route }) => ({
              title: route.params.name ?? 'Unknown Device',
            })}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
