import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import WasteSubmissionForm from '../components/WasteSubmissionForm';
import { NotificationProvider } from '../contexts/NotificationContext';

// Mock the WasteSubmissionService
jest.mock('../services/WasteSubmissionService', () => ({
  createWasteSubmission: jest.fn().mockResolvedValue({ data: { success: true } })
}));

describe('WasteSubmissionForm', () => {
  const renderForm = (props = {}) => {
    const defaultProps = {
      onSubmit: jest.fn(),
      ...props
    };

    return render(
      <MemoryRouter>
        <NotificationProvider>
          <WasteSubmissionForm {...defaultProps} />
        </NotificationProvider>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all form fields', () => {
    renderForm();
    
    // Check all form fields are rendered
    expect(screen.getByLabelText(/waste type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/quantity/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/unit/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/street/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/state/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/postal code/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    renderForm();
    
    // Try to submit empty form
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    
    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText(/waste type is required/i)).toBeInTheDocument();
      expect(screen.getByText(/category is required/i)).toBeInTheDocument();
      expect(screen.getByText(/quantity is required/i)).toBeInTheDocument();
    });
  });

  it('submits the form with valid data', async () => {
    const WasteSubmissionService = require('../services/WasteSubmissionService').default;
    const mockSubmit = jest.fn();
    
    renderForm({ onSubmit: mockSubmit });
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText(/waste type/i), { 
      target: { value: 'recyclable' } 
    });
    fireEvent.change(screen.getByLabelText(/category/i), { 
      target: { value: 'paper' } 
    });
    fireEvent.change(screen.getByLabelText(/quantity/i), { 
      target: { value: '10' } 
    });
    fireEvent.change(screen.getByLabelText(/unit/i), { 
      target: { value: 'kg' } 
    });
    fireEvent.change(screen.getByLabelText(/street/i), { 
      target: { value: '123 Test St' } 
    });
    fireEvent.change(screen.getByLabelText(/city/i), { 
      target: { value: 'Test City' } 
    });
    fireEvent.change(screen.getByLabelText(/state/i), { 
      target: { value: 'Test State' } 
    });
    fireEvent.change(screen.getByLabelText(/postal code/i), { 
      target: { value: '12345' } 
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    
    // Check if form was submitted with correct data
    await waitFor(() => {
      expect(WasteSubmissionService.createWasteSubmission).toHaveBeenCalledWith({
        wasteType: 'recyclable',
        category: 'paper',
        quantity: 10,
        unit: 'kg',
        collectionAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          postalCode: '12345'
        }
      });
    });
  });
});
