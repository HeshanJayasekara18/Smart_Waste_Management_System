// backend/tests/notifications/NotificationService.test.js
import { jest } from '@jest/globals';

// Mock NotificationFactory
const sendNotificationMock = jest.fn();

jest.unstable_mockModule('../../services/NotificationFactory.js', () => ({
  default: { create: (type) => {
    if (type === 'email') return { sendNotification: sendNotificationMock };
    throw new Error(`Unsupported notification type: ${type}`);
  }}
}));

const { default: NotificationService } = await import('../../services/NotificationService.js');

beforeEach(() => sendNotificationMock.mockReset());

test('send uses factory and calls channel.sendNotification', async () => {
  const svc = new NotificationService();
  await svc.send('email', { title: 'T', message: 'M', recipient: 'a@b.c' });
  expect(sendNotificationMock).toHaveBeenCalledTimes(1);
});

test('send swallows factory errors and does not throw', async () => {
  const svc = new NotificationService();
  await expect(svc.send('sms', { title: 'T' })).resolves.toBeUndefined();
});
