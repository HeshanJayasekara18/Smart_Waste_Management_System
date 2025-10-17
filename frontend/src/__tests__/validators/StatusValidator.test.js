import { getAllowedNextStatuses, canTransition, getDisallowMessage } from '../../validators/StatusValidator';

describe('StatusValidator', () => {
  test('allowed transitions from pending', () => {
    expect(getAllowedNextStatuses('pending')).toEqual(
      expect.arrayContaining(['approved', 'rejected', 'in-progress', 'completed'])
    );
  });

  test('canTransition works', () => {
    expect(canTransition('approved', 'completed')).toBe(true);
    expect(canTransition('rejected', 'completed')).toBe(false);
  });

  test('getDisallowMessage has specific messages', () => {
    expect(getDisallowMessage('rejected', 'approved')).toMatch(/Cannot change status/);
    expect(typeof getDisallowMessage('pending', 'approved')).toBe('string');
  });
});
