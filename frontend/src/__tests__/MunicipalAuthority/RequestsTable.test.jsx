import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RequestsTable from '../../components/MunicipalAuthority/RequestsTable';

// Mock the modal to avoid deep dependencies
jest.mock('../../components/MunicipalAuthority/RequestReviewModal', () => () => (
  <div data-testid="review-modal">Modal</div>
));

describe('RequestsTable', () => {
  const sample = [
    {
      _id: '1',
      wasteType: 'organic',
      category: 'kitchen',
      quantity: 5,
      unit: 'kg',
      status: 'pending',
    },
  ];

  it('shows loading state', () => {
    render(<RequestsTable requests={[]} loading={true} onRefresh={jest.fn()} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders rows and opens modal on action', () => {
    render(<RequestsTable requests={sample} loading={false} onRefresh={jest.fn()} />);

    expect(screen.getByText('REQ-1')).toBeInTheDocument();
    expect(screen.getByText('organic')).toBeInTheDocument();
    expect(screen.getByText('kitchen')).toBeInTheDocument();

    const actionBtn = screen.getByTitle(/review request/i);
    fireEvent.click(actionBtn);

    expect(screen.getByTestId('review-modal')).toBeInTheDocument();
  });
});
