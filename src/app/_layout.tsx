import { Stack, DarkTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import TabBar from '../components/TabBar';
import { usePathname } from 'expo-router';

SplashScreen.preventAutoHideAsync();

function AppShell() {
  const pathname = usePathname();
  const hideTabBar = pathname.startsWith('/camera');

  return (
    <View style={styles.root}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0D0D1F' },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="lists" />
        <Stack.Screen name="squads" />
        <Stack.Screen
          name="camera/index"
          options={{ animation: 'fade', presentation: 'fullScreenModal' }}
        />
        <Stack.Screen
          name="camera/crop"
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="camera/result"
          options={{ animation: 'slide_from_bottom' }}
        />
      </Stack>
      {!hideTabBar && <TabBar />}
    </View>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider value={DarkTheme}>
          <AppShell />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0D0D1F',
  },
});
