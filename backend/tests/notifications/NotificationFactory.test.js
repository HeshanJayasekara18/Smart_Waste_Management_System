// backend/tests/notifications/NotificationFactory.test.js
import NotificationFactory from '../../services/NotificationFactory.js';

test('creates email notification channel', () => {
  const channel = NotificationFactory.create('email');
  expect(channel).toBeDefined();
  expect(typeof channel.sendNotification).toBe('function');
});

test('throws for unsupported type', () => {
  expect(() => NotificationFactory.create('sms')).toThrow(/Unsupported notification type/i);
});
