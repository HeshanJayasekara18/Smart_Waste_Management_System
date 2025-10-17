import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FilterBar from '../../components/MunicipalAuthority/FilterBar';

describe('FilterBar', () => {
  it('calls setFilters on change', () => {
    const setFilters = jest.fn();
    render(<FilterBar filters={{ status: 'all' }} setFilters={setFilters} />);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'approved' } });

    expect(setFilters).toHaveBeenCalledTimes(1);
    expect(typeof setFilters.mock.calls[0][0]).toBe('function');
  });
});
