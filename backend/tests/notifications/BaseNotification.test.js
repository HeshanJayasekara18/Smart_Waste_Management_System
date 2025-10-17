// backend/tests/notifications/BaseNotification.test.js
import BaseNotification from '../../notifications/BaseNotification.js';

test('BaseNotification.sendNotification throws by default', async () => {
  const base = new BaseNotification();
  await expect(base.sendNotification({})).rejects.toThrow(/must be implemented/i);
});
