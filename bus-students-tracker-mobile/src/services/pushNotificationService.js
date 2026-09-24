// FILE: src/services/pushNotificationService.js
import messaging from '@react-native-firebase/messaging';
import { Alert, Platform } from 'react-native';

export const requestUserPermission = async () => {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Firebase Push Authorization status:', authStatus);
      const fcmToken = await messaging().getToken();
      console.log('FCM Registration Device Token:', fcmToken);
      return fcmToken;
    }
  } catch (err) {
    console.warn('Firebase Messaging permission error:', err);
  }
  return null;
};

export const initPushNotifications = (onNotificationReceived) => {
  try {
    requestUserPermission();

    // Foreground message handler
    const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
      console.log('FCM Notification received in foreground:', remoteMessage);
      if (onNotificationReceived) {
        onNotificationReceived(remoteMessage);
      } else {
        Alert.alert(
          remoteMessage.notification?.title || 'Bus Alert',
          remoteMessage.notification?.body || 'New operational update received'
        );
      }
    });

    // Background interaction handler
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Notification opened from background:', remoteMessage);
    });

    // Cold-boot notification handler
    messaging().getInitialNotification().then((remoteMessage) => {
      if (remoteMessage) {
        console.log('Notification opened app from quit state:', remoteMessage);
      }
    });

    return () => {
      unsubscribeForeground();
    };
  } catch (err) {
    console.warn('Failed to bind push listeners:', err);
    return () => {};
  }
};
