import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { platformClient } from '@/api/platformClient';
import { fetchGamesFromChessCom } from '@/api/gameSources';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Crown, 
  Brain, 
  TrendingUp, 
  Settings, 
  Download,
  ChevronRight,
  Activity,
  Target,
  Zap,
  Trash2
} from 'lucide-react';
import FetchGamesForm from '@/components/chess/FetchGamesForm';
import GameCard from '@/components/chess/GameCard';
import ProgressOverlay from '@/components/chess/ProgressOverlay';
import SettingsModal from '@/components/chess/SettingsModal';

// Demo games for offline testing
const DEMO_GAMES = [
  {
    game_id: 'demo-1',
    pgn: `[Event "Demo Game 1"]
[Site "Chess.com"]
[Date "2024.01.15"]
[White "Magnus"]
[Black "Hikaru"]
[Result "1-0"]
[WhiteElo "2850"]
[BlackElo "2800"]
[TimeControl "180"]
[ECO "B90"]
[Opening "Sicilian Defense: Najdorf Variation"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be3 e5 7. Nb3 Be6 8. f3 Be7 9. Qd2 O-O 10. O-O-O Nbd7 11. g4 b5 12. g5 Nh5 13. Kb1 Nb6 14. Na5 Rc8 15. Nc6 Qc7 16. Nxe7+ Qxe7 17. Nd5 Bxd5 18. exd5 f5 19. gxf6 Nxf6 20. Rg1 Kh8 21. c3 Rf7 22. Bg5 Rcf8 23. h4 Nfd7 24. Bh3 Nc4 25. Qe2 Nce5 26. Rd3 Qf6 27. Rg2 Nf4 28. Bxf4 exf4 29. Re2 Ne5 30. Bd7 g6 31. Qb5 Qd8 32. Qa5 Qxa5 33. bxa5 Rxd7 34. Rd4 Rf5 35. Rxf4 Rxf4 36. Kc2 Rf5 37. Kd2 Kf7 38. Re4 Nf3+ 39. Kd3 Nh2 40. Re2 Ng4 41. Ke4 Rf1 42. Kd4 Nf6 43. Re6 Rd8 44. Kc4 Rd7 45. Kb3 Rb1+ 46. Ka2 Rb5 47. Re3 Rxa5 48. Rd3 Ke7 49. h5 gxh5 50. f4 h4 51. f5 h3 52. Rxd6 Rxd6 53. cxd6+ Kxd6 54. f6 h2 55. f7 h1=Q 56. f8=Q+ Kxd5 57. Qf5+ 1-0`,
    date: Math.floor(Date.now() / 1000) - 86400,
    result: '1-0',
    white_username: 'Magnus',
    black_username: 'Hikaru',
    white_rating: 2850,
    black_rating: 2800,
    time_control: '180',
    opening: 'Sicilian Defense: Najdorf Variation',
    eco: 'B90'
  },
  {
    game_id: 'demo-2',
    pgn: `[Event "Demo Game 2"]
[Site "Chess.com"]
[Date "2024.01.14"]
[White "Hikaru"]
[Black "Caruana"]
[Result "1/2-1/2"]
[WhiteElo "2800"]
[BlackElo "2790"]
[TimeControl "600"]
[ECO "C65"]
[Opening "Ruy Lopez: Berlin Defense"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. d3 Bc5 5. Bxc6 dxc6 6. Nbd2 Be6 7. O-O Nd7 8. Nb3 Bb6 9. Ng5 Bxb3 10. axb3 h6 11. Nf3 Qe7 12. Be3 Bxe3 13. fxe3 O-O-O 14. Qe2 Kb8 15. b4 g5 16. b5 cxb5 17. Qxb5 Qe6 18. Qc5 f6 19. b3 Nc5 20. Rfc1 Na6 21. Qb5 Nc5 22. Qc4 Na6 23. Qa4 Nc5 24. Qb5 1/2-1/2`,
    date: Math.floor(Date.now() / 1000) - 172800,
    result: '1/2-1/2',
    white_username: 'Hikaru',
    black_username: 'Caruana',
    white_rating: 2800,
    black_rating: 2790,
    time_control: '600',
    opening: 'Ruy Lopez: Berlin Defense',
    eco: 'C65'
  },
  {
    game_id: 'demo-3',
    pgn: `[Event "Demo Game 3"]
[Site "Chess.com"]
[Date "2024.01.13"]
[White "Caruana"]
[Black "Magnus"]
[Result "0-1"]
[WhiteElo "2790"]
[BlackElo "2850"]
[TimeControl "60"]
[ECO "D37"]
[Opening "Queen's Gambit Declined"]

1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 Be7 5. Bf4 O-O 6. e3 c5 7. dxc5 Bxc5 8. Qc2 Nc6 9. a3 Qa5 10. Rd1 Be7 11. Be2 dxc4 12. Bxc4 e5 13. Bg3 Bg4 14. O-O Rad8 15. h3 Bh5 16. Rxd8 Rxd8 17. Rd1 Rxd1+ 18. Qxd1 Bxf3 19. gxf3 Nd4 20. Qd3 Qb6 21. Be2 Nxe2+ 22. Nxe2 Qxb2 23. Nc3 Qxa3 24. Nbe4 Nxe4 25. Nxe4 Qa1+ 26. Kg2 Qe1 27. Qa6 Qxe3 28. Qxe2 Qxe2 29. Kg3 b6 0-1`,
    date: Math.floor(Date.now() / 1000) - 259200,
    result: '0-1',
    white_username: 'Caruana',
    black_username: 'Magnus',
    white_rating: 2790,
    black_rating: 2850,
    time_control: '60',
    opening: "Queen's Gambit Declined",
    eco: 'D37'
  }
];

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [progress, setProgress] = useState({ visible: false, status: 'idle', progress: 0, message: '', type: 'fetch' });
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await platformClient.auth.me();
        setUser(userData);
      } catch (e) {
        // User not logged in
      }
    };
    loadUser();
  }, []);

  // Fetch games from database
  const { data: games = [], isLoading: gamesLoading } = useQuery({
    queryKey: ['games'],
    queryFn: () => platformClient.entities.Game.list('-date', 50),
  });

  // Fetch analyses
  const { data: analyses = [] } = useQuery({
    queryKey: ['analyses'],
    queryFn: () => platformClient.entities.Analysis.list(),
  });

  const analyzedGameIds = new Set(analyses.map(a => a.game_id));

  // Fetch games mutation
  const fetchGamesMutation = useMutation({
    mutationFn: async (params) => {
      setProgress({ visible: true, status: 'fetching', progress: 10, message: 'Connecting to Chess.com...', type: 'fetch' });

      if (params.mode === 'demo') {
        // Demo mode - insert demo games
        setProgress({ visible: true, status: 'fetching', progress: 50, message: 'Loading demo games...', type: 'fetch' });
        
        for (const game of DEMO_GAMES) {
          try {
            await platformClient.entities.Game.create(game);
          } catch (e) {
            // Game might already exist
          }
        }
        
        setProgress({ visible: true, status: 'completed', progress: 100, message: `Loaded ${DEMO_GAMES.length} demo games!`, type: 'fetch' });
        setTimeout(() => setProgress(p => ({ ...p, visible: false })), 2000);
        return { count: DEMO_GAMES.length };
      }

      // Fetch from Chess.com API
      try {
        setProgress({ visible: true, status: 'fetching', progress: 20, message: `Fetching games for ${params.username}...`, type: 'fetch' });
        
        // Call Chess.com API via InvokeLLM with internet context
        const fetchedGames = await fetchGamesFromChessCom({
          username: params.username,
          mode: params.mode,
          startDate: params.startDate,
          endDate: params.endDate,
          days: params.days,
          limit: 50
        });

        setProgress({ visible: true, status: 'fetching', progress: 60, message: 'Saving games to library...', type: 'fetch' });
        let savedCount = 0;

        for (const game of fetchedGames) {
          try {
            await platformClient.entities.Game.create({
              ...game,
              game_id: game.game_id || `chess-com-${Date.now()}-${savedCount}`,
              date: game.date || Math.floor(Date.now() / 1000)
            });
            savedCount++;
          } catch (e) {
            console.error('Failed to save game:', e);
          }
        }

        setProgress({ visible: true, status: 'completed', progress: 100, message: `Fetched ${savedCount} games!`, type: 'fetch' });
        setTimeout(() => setProgress(p => ({ ...p, visible: false })), 2000);
        return { count: savedCount };
      } catch (error) {
        setProgress({ visible: true, status: 'error', progress: 0, message: error.message || 'Failed to fetch games. Try Demo mode.', type: 'fetch' });
        setTimeout(() => setProgress(p => ({ ...p, visible: false })), 4000);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] });
    }
  });

  const clearLibraryMutation = useMutation({
    mutationFn: async () => {
      await platformClient.entities.Analysis.clear();
      await platformClient.entities.Game.clear();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] });
      queryClient.invalidateQueries({ queryKey: ['analyses'] });
    }
  });

  const handleClearLibrary = () => {
    if (clearLibraryMutation.isPending) return;
    const confirmed = window.confirm('Clear all saved games and analyses? This cannot be undone.');
    if (!confirmed) return;
    clearLibraryMutation.mutate();
  };

  const handleGameClick = (game) => {
    navigate(createPageUrl('GameAnalysis') + `?gameId=${game.id}`);
  };

  const totalGames = games.length;
  const analyzedCount = games.filter(g => analyzedGameIds.has(g.game_id)).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950">
      <ProgressOverlay {...progress} />
      <SettingsModal 
        open={settingsOpen} 
        onOpenChange={setSettingsOpen}
        onSave={() => queryClient.invalidateQueries()}
      />

      {/* Header */}
      <header className="border-b border-stone-800 bg-stone-900/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Crown className="w-6 h-6 text-stone-900" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Chess Analyzer v2</h1>
                <p className="text-xs text-stone-500">AI-Powered Game Analysis</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSettingsOpen(true)}
                className="text-stone-400 hover:text-white"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Stats & Fetch */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-stone-800/50 border-stone-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                      <Activity className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{totalGames}</div>
                      <div className="text-xs text-stone-500">Games</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-stone-800/50 border-stone-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <Brain className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{analyzedCount}</div>
                      <div className="text-xs text-stone-500">Analyzed</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Fetch Form */}
            <FetchGamesForm 
              onFetch={(params) => fetchGamesMutation.mutate(params)}
              isLoading={fetchGamesMutation.isPending}
            />

            {/* Quick Actions */}
            <Card className="bg-stone-800/50 border-stone-700">
              <CardContent className="p-4 space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-between border-stone-600 hover:bg-stone-700 text-white"
                  onClick={() => navigate(createPageUrl('Analysis'))}
                >
                  <span className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-amber-400" />
                    Batch Analysis
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-between border-stone-600 hover:bg-stone-700 text-white"
                  onClick={() => navigate(createPageUrl('Statistics'))}
                >
                  <span className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                    View Statistics
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-between border-red-500/40 text-red-300 hover:bg-red-500/10"
                  onClick={handleClearLibrary}
                  disabled={clearLibraryMutation.isPending}
                >
                  <span className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    Clear Library
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Games List */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Recent Games</h2>
              {games.length > 0 && (
                <Badge variant="outline" className="text-stone-400 border-stone-600">
                  {games.length} games
                </Badge>
              )}
            </div>

            {gamesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="bg-stone-800/50 border-stone-700 animate-pulse">
                    <CardContent className="p-4 h-24" />
                  </Card>
                ))}
              </div>
            ) : games.length === 0 ? (
              <Card className="bg-stone-800/50 border-stone-700">
                <CardContent className="p-8 text-center">
                  <Download className="w-12 h-12 mx-auto text-stone-600 mb-3" />
                  <h3 className="text-lg font-medium text-white mb-2">No games yet</h3>
                  <p className="text-stone-500 mb-4">
                    Fetch your games from Chess.com or try Demo mode to see the analyzer in action.
                  </p>
                  <Button
                    onClick={() => fetchGamesMutation.mutate({ mode: 'demo' })}
                    className="bg-amber-500 hover:bg-amber-600 text-stone-900"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Load Demo Games
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {games.map((game) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    onClick={() => handleGameClick(game)}
                    isAnalyzed={analyzedGameIds.has(game.game_id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}