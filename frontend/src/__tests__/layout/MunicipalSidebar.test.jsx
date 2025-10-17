import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MunicipalSidebar from '../../components/layout/municipalLayout/MunicipalSidebar';

describe('MunicipalSidebar', () => {
  test('renders links and toggles submenu', () => {
    render(
      <MemoryRouter>
        <MunicipalSidebar />
      </MemoryRouter>
    );

    // top-level link
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();

    // expandable menu
    const wm = screen.getByText(/Waste Management/i);
    fireEvent.click(wm);
    expect(screen.getByText(/Collections/i)).toBeInTheDocument();
  });
});
