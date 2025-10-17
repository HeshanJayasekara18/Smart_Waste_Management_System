// backend/tests/notifications/EmailNotification.test.js
import { jest } from '@jest/globals';

// Mock nodemailer transport
const sendMailMock = jest.fn();
jest.unstable_mockModule('nodemailer', () => ({
  default: { createTransport: () => ({ sendMail: sendMailMock }) }
}));

const { default: EmailNotification } = await import('../../notifications/EmailNotification.js');

beforeEach(() => sendMailMock.mockReset());

test('does nothing when no recipient provided', async () => {
  const email = new EmailNotification();
  await email.sendNotification({ title: 'T', message: 'M' });
  expect(sendMailMock).not.toHaveBeenCalled();
});

test('sends email when recipient provided', async () => {
  sendMailMock.mockResolvedValueOnce({ accepted: ['a@example.com'] });
  const email = new EmailNotification();
  await email.sendNotification({ title: 'T', message: 'M', recipient: 'a@example.com' });
  expect(sendMailMock).toHaveBeenCalledTimes(1);
  const arg = sendMailMock.mock.calls[0][0];
  expect(arg.to).toBe('a@example.com');
  expect(arg.subject).toBe('T');
});

test('handles transporter error gracefully', async () => {
  sendMailMock.mockRejectedValueOnce(new Error('smtp-fail'));
  const email = new EmailNotification();
  await expect(email.sendNotification({ title: 'T', message: 'M', recipient: 'a@example.com' }))
    .resolves.toBeUndefined();
});
