// Простая обертка для push notifications без зависимостей
export class SimplePushService {
  async init() {
    return false; // Временно отключено
  }

  async isSubscribed() {
    return false;
  }

  async subscribe(userId: string) {
    return false;
  }

  async unsubscribe(userId: string) {
    return false;
  }

  async showNotification(title: string, options: any) {
    // Простое браузерное уведомление
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, options);
    }
  }

  async requestPermission() {
    if ('Notification' in window) {
      return await Notification.requestPermission();
    }
    return 'denied';
  }
}

export default SimplePushService;