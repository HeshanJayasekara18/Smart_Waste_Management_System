import React from 'react';
import { render, screen } from '@testing-library/react';
import MunicipalHeader from '../../components/layout/municipalLayout/MunicipalHeader';

describe('MunicipalHeader', () => {
  test('renders app title', () => {
    render(<MunicipalHeader />);
    expect(screen.getByText(/TrashTrack/i)).toBeInTheDocument();
  });
});
