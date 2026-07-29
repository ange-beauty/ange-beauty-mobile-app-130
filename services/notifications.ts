import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { withClientSourceHeader } from '@/services/requestHeaders';
import { debugFetch } from '@/services/httpDebug';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.angebeauty.net/';
const API_BASE = API_BASE_URL.replace(/\/+$/, '');

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
    await logTelemetry({
      endpoint: 'registerForPushNotifications',
      payload: { reason: 'unsupported_platform', platform: Platform.OS },
    });
    return null;
  }

  if (!Device.isDevice) {
    await logTelemetry({
      endpoint: 'registerForPushNotifications',
      payload: { reason: 'simulator', platform: Platform.OS },
    });
    return null;
  }

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'General',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#8A4F58',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      await logTelemetry({
        endpoint: 'registerForPushNotifications',
        payload: { reason: 'permission_denied', platform: Platform.OS },
      });
      return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId || 'a5db08fb-fcd1-47ca-929f-e3d8ebe03d73';
    
    const token = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    await logTelemetry({
      endpoint: 'registerForPushNotifications',
      payload: {
        reason: 'success',
        platform: Platform.OS,
        projectId,
        tokenSuffix: token.data.slice(-6),
      },
    });
    return token.data;
  } catch (error) {
    console.error('[Notifications] Error getting push token:', error);
    await logTelemetry({
      endpoint: 'registerForPushNotifications',
      payload: { reason: 'error', platform: Platform.OS },
      error: error instanceof Error ? error.message : String(error),
    });
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
  console.debug('[Notifications]', {
    timestamp: new Date().toISOString(),
    type: 'notification_token',
    ...data,
  });
}

export async function registerPushTokenWithServer(pushToken: string): Promise<boolean> {
  
  const appVersion = Constants.expoConfig?.version || '1.0.0';
  
  const endpoint = `${API_BASE}/api/v1/notifications/devices`;
  const payload = {
    token: pushToken,
    platform: Platform.OS,
    app_version: appVersion,
  };
  
  try {
    const response = await debugFetch(endpoint, {
      method: 'POST',
      headers: withClientSourceHeader({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(payload),
    }, 'Notifications');
    
    
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

export function getLastNotificationResponseAsync() {
  return Notifications.getLastNotificationResponseAsync();
}
