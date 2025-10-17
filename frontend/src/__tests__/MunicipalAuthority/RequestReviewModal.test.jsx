import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RequestReviewModal from '../../components/MunicipalAuthority/RequestReviewModal';

// Mock services and hooks used inside the component
jest.mock('../../services/WasteSubmissionService', () => ({
  __esModule: true,
  default: {
    updateRequestStatus: jest.fn().mockResolvedValue({})
  }
}));

// Mock notification context
jest.mock('../../contexts/NotificationContext', () => ({
  useNotification: () => ({
    push: jest.fn()
  })
}));

// Mock status validator utilities
jest.mock('../../validators/StatusValidator', () => ({
  getAllowedNextStatuses: () => ['approved', 'rejected', 'in-progress', 'completed'],
  canTransition: () => true
}));

describe('RequestReviewModal', () => {
  const baseRequest = {
    _id: 'abc123',
    status: 'pending',
    wasteType: 'organic',
    category: 'kitchen',
    quantity: 3,
    unit: 'kg',
    paymentAmount: 100
  };

  it('renders request details', () => {
    render(
      <RequestReviewModal
        request={baseRequest}
        onClose={jest.fn()}
        onSuccess={jest.fn()}
      />
    );

    expect(screen.getByText(/Review Waste Request/i)).toBeInTheDocument();
    expect(screen.getByText(/Type: organic/i)).toBeInTheDocument();
    expect(screen.getByText(/Category: kitchen/i)).toBeInTheDocument();
    expect(screen.getByText(/Quantity: 3 kg/i)).toBeInTheDocument();
  });

  it('submits approved with payback amount', async () => {
    const onClose = jest.fn();
    const onSuccess = jest.fn();

    render(
      <RequestReviewModal
        request={baseRequest}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    // select approved (label not associated; query by role)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'approved' } });

    // enter payback amount
    fireEvent.change(await screen.findByPlaceholderText(/Enter payback amount/i), { target: { value: '25' } });

    // submit
    fireEvent.click(screen.getByRole('button', { name: /submit review/i }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(onClose).toHaveBeenCalled();
  });
});
