// backend/factories/NotificationFactory.js
import EmailNotification from "../notifications/EmailNotification.js";

export default class NotificationFactory {
  /**
   * Factory method to create the correct notification channel
   * @param {string} type - Notification type ('email', 'sms', etc.)
   * @returns {BaseNotification} - Notification channel instance
   */
  static create(type) {
    switch (type) {
      case "email":
        return new EmailNotification();

      default:
        throw new Error(`Unsupported notification type: ${type}`);
    }
  }
}
