// notifications/BaseNotification.js
export default class BaseNotification {
  async sendNotification(data) {
    throw new Error("sendNotification() must be implemented in subclass");
  }
}
