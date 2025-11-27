import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../Dashboard';

const { mockGameList, mockAnalysisList, mockAuthMe } = vi.hoisted(() => ({
  mockGameList: vi.fn(),
  mockAnalysisList: vi.fn(),
  mockAuthMe: vi.fn()
}));

vi.mock('@/api/platformClient', () => ({
  platformClient: {
    auth: {
      me: mockAuthMe,
      updateMe: vi.fn()
    },
    entities: {
      Game: {
        list: mockGameList,
        create: vi.fn(),
        update: vi.fn()
      },
      Analysis: {
        list: mockAnalysisList,
        create: vi.fn(),
        update: vi.fn()
      }
    }
  }
}));

vi.mock('@/api/gameSources', () => ({
  fetchGamesFromChessCom: vi.fn().mockResolvedValue([])
}));

function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0
      }
    }
  });

  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <Dashboard />
      </QueryClientProvider>
    </MemoryRouter>
  );
}

describe('Dashboard', () => {
  beforeEach(() => {
    mockAuthMe.mockResolvedValue({ id: 'user-1', display_name: 'Test User' });
    mockAnalysisList.mockResolvedValue([]);
    mockGameList.mockResolvedValue([]);
  });

  it('renders recent games when data is available', async () => {
    mockGameList.mockResolvedValue([
      {
        id: '1',
        game_id: 'g1',
        white_username: 'Magnus',
        black_username: 'Hikaru',
        result: '1-0',
        opening: 'Sicilian Defense',
        date: Math.floor(Date.now() / 1000)
      },
      {
        id: '2',
        game_id: 'g2',
        white_username: 'Carlsen',
        black_username: 'Nepomniachtchi',
        result: '0-1',
        opening: 'Ruy Lopez',
        date: Math.floor(Date.now() / 1000)
      }
    ]);

    renderDashboard();

    expect(await screen.findByText('Recent Games')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/2 games/i)).toBeInTheDocument();
    });
    expect(screen.getByText('Magnus')).toBeInTheDocument();
    expect(screen.getByText('Hikaru')).toBeInTheDocument();
  });

  it('shows demo prompt when no games exist', async () => {
    mockGameList.mockResolvedValue([]);

    renderDashboard();

    expect(await screen.findByText('No games yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Load Demo Games/i })).toBeInTheDocument();
  });
});
