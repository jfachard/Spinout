import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { AppState, Platform, type AppStateStatus } from 'react-native';

import { authFetch, getAccessToken } from './auth';
import { apiFetch } from './api';

const BACKGROUND_GRACE_MS = 30_000;

let appState: AppStateStatus = AppState.currentState;
let lastBackgroundAt = 0;
let trackingStarted = false;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function startAppStateTracking() {
  if (trackingStarted) return;
  trackingStarted = true;

  AppState.addEventListener('change', (next) => {
    if (appState === 'active' && (next === 'background' || next === 'inactive')) {
      lastBackgroundAt = Date.now();
    }
    appState = next;
  });
}

/** True when the user isn't actively on the spin tab. */
export function shouldNotifyUser(activeTab?: string | null) {
  startAppStateTracking();

  if (appState === 'background' || appState === 'inactive') return true;

  // Socket events often flush only after resume — user was away moments ago.
  if (lastBackgroundAt > 0 && Date.now() - lastBackgroundAt < BACKGROUND_GRACE_MS) {
    return true;
  }

  // Still in the app but on Lobby / Recap.
  if (activeTab && activeTab !== 'spin') return true;

  return false;
}

export function isAppInBackground() {
  startAppStateTracking();
  return appState !== 'active';
}

export async function ensureNotificationPermissions() {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  return status === 'granted';
}

export async function configureNotifications() {
  startAppStateTracking();
  await ensureNotificationPermissions();

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Spinout',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
}

async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null;
  if (!(await ensureNotificationPermissions())) return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    return tokenData.data;
  } catch {
    return null;
  }
}

export async function registerPushTokenWithBackend() {
  const token = await getExpoPushToken();
  if (!token) return;

  await authFetch('/auth/push-token', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

export async function syncSessionPushToken(code: string, memberId: string) {
  const token = await getExpoPushToken();
  if (!token) return;

  await apiFetch('/session/members/push-token', {
    method: 'POST',
    body: JSON.stringify({
      memberId,
      code: code.trim().toUpperCase(),
      token,
    }),
  });

  if ((await getAccessToken()) !== null) {
    try {
      await registerPushTokenWithBackend();
    } catch {
      /* user token is best-effort */
    }
  }
}

export async function showLocalNotification(title: string, body: string) {
  if (!(await ensureNotificationPermissions())) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      ...(Platform.OS === 'android' ? { channelId: 'default' } : {}),
    },
    trigger: null,
  });
}

export function notifyVoteResult(
  result: 'accepted' | 'rejected',
  activityTitle?: string,
  activeTab?: string | null,
) {
  if (!shouldNotifyUser(activeTab)) return;

  const title = result === 'accepted' ? "It's a yes!" : 'Not it';
  const body =
    result === 'accepted'
      ? activityTitle
        ? `${activityTitle} — let's go!`
        : 'The group accepted the activity.'
      : activityTitle
        ? `${activityTitle} didn't make the cut.`
        : 'The group passed on the activity.';

  void showLocalNotification(title, body);
}

export function notifySessionStarted(activeTab?: string | null) {
  if (!shouldNotifyUser(activeTab)) return;
  void showLocalNotification('Game on!', 'The host started the session. Time to spin!');
}
