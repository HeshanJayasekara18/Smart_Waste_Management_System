import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { NotificationProvider, useNotification } from '../../contexts/NotificationContext';

function Demo() {
  const { push } = useNotification();
  return (
    <button onClick={() => push({ title: 'Hello', message: 'World' })}>Push</button>
  );
}

describe('NotificationContext', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('push shows and auto-dismisses message', () => {
    render(
      <NotificationProvider>
        <Demo />
      </NotificationProvider>
    );

    // push
    act(() => {
      screen.getByText('Push').click();
    });

    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('World')).toBeInTheDocument();

    // advance timers for auto-dismiss (4s)
    act(() => {
      jest.advanceTimersByTime(4000);
    });
  });
});
