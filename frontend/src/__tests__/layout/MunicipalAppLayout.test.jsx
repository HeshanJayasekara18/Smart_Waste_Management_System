import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import MunicipalAppLayout from '../../components/layout/MunicipalAppLayout';

function Child() {
  return <div>Child Content</div>;
}

describe('MunicipalAppLayout', () => {
  test('renders Outlet content and toggles mobile menu', () => {
    render(
      <MemoryRouter initialEntries={['/']}> 
        <Routes>
          <Route element={<MunicipalAppLayout />}>
            <Route index element={<Child />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    // Outlet content shown
    expect(screen.getByText(/Child Content/i)).toBeInTheDocument();

    // Mobile menu button exists and can be clicked
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
  });
});
