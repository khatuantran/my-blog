import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { App } from './App';
import HomePage from './pages/HomePage';

describe('App', () => {
  it('renders HomePage at /', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<App />}>
            <Route index element={<HomePage />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('kha.blog')).toBeInTheDocument();
  });
});
