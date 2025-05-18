import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {
  static async requestPermissions() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      return false;
    }
    
    return true;
  }

  static async scheduleStreakNotification() {
    // Cancel any existing streak notifications
    await this.cancelStreakNotification();

    return await Notifications.scheduleNotificationAsync({
      content: {
        title: "Не прекъсвай серията си! 🔥",
        body: "Завърши урок днес, за да запазиш серията си!",
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { type: 'streak' },
      },
      trigger: {
        hour: 20,
        minute: 0,
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
      },
    });
  }

  static async cancelStreakNotification() {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    const streakNotifications = notifications.filter(
      notification => notification.content.data?.type === 'streak'
    );
    
    for (const notification of streakNotifications) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }

  static async updateStreakNotificationStatus(enabled: boolean) {
    if (enabled) {
      const hasPermission = await this.requestPermissions();
      if (hasPermission) {
        await this.scheduleStreakNotification();
      }
    } else {
      await this.cancelStreakNotification();
    }
  }
}

export default NotificationService; 