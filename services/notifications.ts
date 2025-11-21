import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.angebeauty.net/';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'web') {
    console.log('[Notifications] Push notifications are not supported on web');
    return null;
  }

  if (!Device.isDevice) {
    console.log('[Notifications] Push notifications must use physical device');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('[Notifications] Permission not granted for push notifications');
      return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId || 'a5db08fb-fcd1-47ca-929f-e3d8ebe03d73';
    console.log('[Notifications] Using project ID:', projectId);
    
    const token = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    
    console.log('[Notifications] Push token obtained:', token.data);
    return token.data;
  } catch (error) {
    console.error('[Notifications] Error getting push token:', error);
    return null;
  }
}

async function logTelemetry(data: {
  endpoint: string;
  payload: any;
  response?: any;
  error?: any;
  statusCode?: number;
}): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}?action=log`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        type: 'notification_token',
        ...data,
      }),
    });
  } catch (logError) {
    console.error('[Notifications] Failed to log telemetry:', logError);
  }
}

export async function registerPushTokenWithServer(pushToken: string): Promise<boolean> {
  console.log('[Notifications] Registering push token with server:', pushToken);
  
  const appVersion = Constants.expoConfig?.version || '1.0.0';
  console.log('[Notifications] App version:', appVersion);
  
  const endpoint = `${API_BASE_URL}?action=register-push-token`;
  const payload = {
    token: pushToken,
    app_version: appVersion,
  };
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    console.log('[Notifications] Registration response status:', response.status);
    
    let responseData;
    try {
      responseData = await response.json();
    } catch {
      responseData = { error: 'Failed to parse response JSON' };
    }
    
    await logTelemetry({
      endpoint,
      payload,
      response: responseData,
      statusCode: response.status,
    });
    
    if (response && response.ok) {
      console.log('[Notifications] Push token registered successfully');
      return true;
    }
    
    console.error('[Notifications] Failed to register push token');
    return false;
  } catch (error) {
    console.error('[Notifications] Error registering push token:', error);
    
    await logTelemetry({
      endpoint,
      payload,
      error: error instanceof Error ? error.message : String(error),
      statusCode: 0,
    });
    
    return false;
  }
}

export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(callback);
}

export function addNotificationResponseReceivedListener(
  callback: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}
