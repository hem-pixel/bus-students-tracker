import React, { useEffect } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import store from './src/store';
import RootNavigator from './src/navigation/RootNavigator';
import { initPushNotifications } from './src/services/pushNotificationService';
import { initDatabase } from './src/services/offlineStorage';
import { colors } from './src/theme/colors';

export default function App() {
  useEffect(() => {
    // Initialize offline SQLite caching layer
    initDatabase().catch(err => {
      console.warn('SQLite init warning (falling back to memory/AsyncStorage):', err);
    });

    // Initialize Firebase Cloud Messaging push notifications
    const unsubscribePush = initPushNotifications();

    return () => {
      if (typeof unsubscribePush === 'function') {
        unsubscribePush();
      }
    };
  }, []);

  return (
    <Provider store={store}>
      <SafeAreaProvider style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={colors.dark.background}
          translucent={false}
        />
        <NavigationContainer
          theme={{
            dark: true,
            colors: {
              primary: colors.dark.primary,
              background: colors.dark.background,
              card: colors.dark.surface,
              text: colors.dark.text,
              border: colors.dark.border,
              notification: colors.dark.warning,
            },
          }}
        >
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
});
