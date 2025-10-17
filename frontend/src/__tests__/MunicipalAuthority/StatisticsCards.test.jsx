import React from 'react';
import { render, screen } from '@testing-library/react';
import StatisticsCards from '../../components/MunicipalAuthority/StatisticsCards';

describe('StatisticsCards', () => {
  it('renders labels and values', () => {
    const stats = { totalRequests: 10, pending: 3, approved: 5, rejected: 2 };
    render(<StatisticsCards statistics={stats} />);

    expect(screen.getByText('Total Requests')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Rejected')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('defaults to 0 when stats missing', () => {
    render(<StatisticsCards statistics={{}} />);
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
  });
});
