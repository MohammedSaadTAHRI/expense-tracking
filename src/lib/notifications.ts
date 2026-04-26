export function supportsNotifications(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export async function requestPermission(): Promise<boolean> {
  if (!supportsNotifications()) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function notify(title: string, body: string): void {
  if (!supportsNotifications() || Notification.permission !== 'granted') return;
  try {
    new Notification(title, { body, icon: '/icon.svg', silent: false });
  } catch {
    // ignore
  }
}
