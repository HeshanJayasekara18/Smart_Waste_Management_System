// backend/services/NotificationService.js
import NotificationFactory from "./NotificationFactory.js";

export default class NotificationService {
  async send(type, payload) {
    try {
      // ✅ FIX: use .create(type) instead of .getNotificationChannel()
      const notification = NotificationFactory.create(type);
      await notification.sendNotification(payload);
      console.log(`✅ ${type.toUpperCase()} notification sent successfully.`);
    } catch (err) {
      console.error(`❌ NotificationService error: ${err.message}`);
    }
  }
}
