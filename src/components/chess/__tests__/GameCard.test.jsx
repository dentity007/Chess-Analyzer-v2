import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import GameCard from '../GameCard';

describe('GameCard', () => {
  const baseGame = {
    id: 'game-123',
    white_username: 'Magnus',
    black_username: 'Hikaru',
    white_rating: 2850,
    black_rating: 2800,
    result: '1-0',
    opening: 'Sicilian Defense',
    time_control: '180',
    date: Math.floor(Date.now() / 1000)
  };

  it('renders player names and result', () => {
    render(<GameCard game={baseGame} onClick={() => {}} />);

    expect(screen.getByText('Magnus')).toBeInTheDocument();
    expect(screen.getByText('Hikaru')).toBeInTheDocument();
    expect(screen.getByText('1-0')).toBeInTheDocument();
  });

  it('shows analyzed badge when isAnalyzed is true', () => {
    render(<GameCard game={baseGame} isAnalyzed onClick={() => {}} />);

    expect(screen.getByText(/Analyzed/i)).toBeInTheDocument();
  });
});
