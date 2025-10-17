import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Service User layout by default', async () => {
  render(<App />);
  // Default route now renders ServiceUser layout, assert a known nav item
  const link = await screen.findByText(/Special Waste Request/i);
  expect(link).toBeInTheDocument();
});
