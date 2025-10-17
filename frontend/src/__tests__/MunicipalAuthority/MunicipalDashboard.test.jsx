import React from 'react';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import MunicipalAuthorityService from '../../services/WasteSubmissionService';

// Mock the service
jest.mock('../../services/WasteSubmissionService', () => ({
  __esModule: true,
  default: {
    list: jest.fn().mockResolvedValue([
      { 
        _id: '1', 
        wasteType: 'organic', 
        category: 'kitchen', 
        quantity: 2, 
        unit: 'kg', 
        status: 'pending',
        createdAt: new Date().toISOString()
      },
      { 
        _id: '2', 
        wasteType: 'plastic', 
        category: 'bottles', 
        quantity: 10, 
        unit: 'pcs', 
        status: 'approved',
        createdAt: new Date().toISOString()
      },
    ]),
    getStatistics: jest.fn().mockResolvedValue({ 
      totalRequests: 2, 
      pending: 1, 
      approved: 1, 
      rejected: 0 
    }),
  },
}));

import MunicipalDashboard from '../../components/MunicipalAuthority/MunicipalDashboard';

describe('MunicipalDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the dashboard with loading state', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <MunicipalDashboard />
        </MemoryRouter>
      );
    });

    expect(screen.getByText('Municipal Authority Dashboard')).toBeInTheDocument();
  });

  it('loads and displays statistics', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <MunicipalDashboard />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(MunicipalAuthorityService.getStatistics).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/Total Requests/i)).toBeInTheDocument();
    });
  });

  it('loads and displays requests', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <MunicipalDashboard />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(MunicipalAuthorityService.list).toHaveBeenCalledTimes(1);
    });
  });

  it('filters requests based on status', async () => {
    const mockRequests = [
      { 
        _id: '1', 
        wasteType: 'organic', 
        category: 'kitchen', 
        quantity: 2, 
        unit: 'kg', 
        status: 'pending',
        createdAt: new Date().toISOString()
      },
      { 
        _id: '2', 
        wasteType: 'plastic', 
        category: 'bottles', 
        quantity: 10, 
        unit: 'pcs', 
        status: 'approved',
        createdAt: new Date().toISOString()
      },
    ];

    // Mock the service to return our test data
    MunicipalAuthorityService.list.mockResolvedValueOnce(mockRequests);
    
    // Mock getStatistics to return test stats
    MunicipalAuthorityService.getStatistics.mockResolvedValueOnce({
      totalRequests: 2,
      pending: 1,
      approved: 1,
      rejected: 0
    });

    await act(async () => {
      render(
        <MemoryRouter>
          <MunicipalDashboard />
        </MemoryRouter>
      );
    });

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText(/Total Requests/i)).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // Total requests
    });

    // Test filtering
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'pending' } });

    // Check that the component updates with filtered results
    await waitFor(() => {
      const tableRows = screen.getAllByRole('row');
      // Should have header row + 1 data row
      expect(tableRows).toHaveLength(2);
      expect(screen.getByText('organic')).toBeInTheDocument();
    });
  });

  it('handles error when loading data fails', async () => {
    // Mock the service to reject with an error
    MunicipalAuthorityService.list.mockRejectedValueOnce(new Error('Failed to load'));
    MunicipalAuthorityService.getStatistics.mockRejectedValueOnce(new Error('Failed to load stats'));

    // Mock console.error to prevent error logs in test output
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    await act(async () => {
      render(
        <MemoryRouter>
          <MunicipalDashboard />
        </MemoryRouter>
      );
    });

    // Verify error handling
    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled();
    });

    // Cleanup
    consoleError.mockRestore();
  });
});
