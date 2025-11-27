import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FetchGamesForm from '../FetchGamesForm';

describe('FetchGamesForm', () => {
  it('submits the username using the default mode', async () => {
    const user = userEvent.setup();
    const onFetch = vi.fn();
    render(<FetchGamesForm onFetch={onFetch} />);

    const input = screen.getByPlaceholderText('e.g., hikaru');
    await user.type(input, 'hikaru');
    await user.click(screen.getByRole('button', { name: /fetch games/i }));

    expect(onFetch).toHaveBeenCalledWith({
      username: 'hikaru',
      mode: 'last',
      startDate: null,
      endDate: null,
      days: 30
    });
  });

  it('invokes demo mode without requiring a username', async () => {
    const user = userEvent.setup();
    const onFetch = vi.fn();
    render(<FetchGamesForm onFetch={onFetch} />);

    await user.click(screen.getByLabelText('Demo Mode'));
    await user.click(screen.getByRole('button', { name: /load demo games/i }));

    expect(onFetch).toHaveBeenCalledWith({
      username: '',
      mode: 'demo',
      startDate: null,
      endDate: null,
      days: 30
    });
  });
});
