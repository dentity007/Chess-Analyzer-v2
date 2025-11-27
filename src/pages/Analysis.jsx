import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { platformClient } from '@/api/platformClient';
import { analyzeWithProvider } from '@/api/aiProviders';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  Brain, 
  Loader2, 
  Crown,
  Play,
  CheckCircle,
  AlertTriangle,
  Clock,
  Target
} from 'lucide-react';
import GameCard from '@/components/chess/GameCard';
import ProgressOverlay from '@/components/chess/ProgressOverlay';

export default function Analysis() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedGames, setSelectedGames] = useState(new Set());
  const [progress, setProgress] = useState({ visible: false, status: 'idle', progress: 0, message: '', type: 'analyze' });
  const [batchResults, setBatchResults] = useState([]);

  // Fetch games
  const { data: games = [], isLoading } = useQuery({
    queryKey: ['games'],
    queryFn: () => platformClient.entities.Game.list('-date', 100),
  });

  // Fetch existing analyses
  const { data: analyses = [] } = useQuery({
    queryKey: ['analyses'],
    queryFn: () => platformClient.entities.Analysis.list(),
  });

  const { data: userSettings } = useQuery({
    queryKey: ['user-settings'],
    queryFn: () => platformClient.auth.me(),
    staleTime: 1000 * 60 * 5
  });

  const analyzedGameIds = new Set(analyses.map(a => a.game_id));
  const unanalyzedGames = games.filter(g => !analyzedGameIds.has(g.game_id));

  const toggleGame = (gameId) => {
    const newSelected = new Set(selectedGames);
    if (newSelected.has(gameId)) {
      newSelected.delete(gameId);
    } else {
      newSelected.add(gameId);
    }
    setSelectedGames(newSelected);
  };

  const selectAll = () => {
    if (selectedGames.size === unanalyzedGames.length) {
      setSelectedGames(new Set());
    } else {
      setSelectedGames(new Set(unanalyzedGames.map(g => g.id)));
    }
  };

  // Batch analyze mutation
  const batchAnalyzeMutation = useMutation({
    mutationFn: async () => {
      const gamesToAnalyze = games.filter(g => selectedGames.has(g.id));
      const results = [];
      
      for (let i = 0; i < gamesToAnalyze.length; i++) {
        const game = gamesToAnalyze[i];
        const progressPercent = ((i + 1) / gamesToAnalyze.length) * 100;
        
        setProgress({
          visible: true,
          status: 'analyzing',
          progress: progressPercent,
          message: `Analyzing game ${i + 1} of ${gamesToAnalyze.length}...`,
          type: 'analyze'
        });

        try {
          const analysisResult = await analyzeWithProvider(game, userSettings);

          const analysisData = {
            game_id: game.game_id,
            total_moves: analysisResult.total_moves || 0,
            blunder_count: analysisResult.blunders?.length || 0,
            mistake_count: analysisResult.mistakes?.length || 0,
            white_accuracy: analysisResult.white_accuracy || 0,
            black_accuracy: analysisResult.black_accuracy || 0,
            blunders: analysisResult.blunders || [],
            mistakes: analysisResult.mistakes || [],
            ai_insights: analysisResult.coaching_advice || '',
            analyzed_at: Math.floor(Date.now() / 1000)
          };

          await platformClient.entities.Analysis.create(analysisData);
          results.push({ game, status: 'success', analysis: analysisData });
        } catch (error) {
          results.push({ game, status: 'error', error: error.message });
        }
      }

      setBatchResults(results);
      setProgress({
        visible: true,
        status: 'completed',
        progress: 100,
        message: `Analyzed ${results.filter(r => r.status === 'success').length} games successfully!`,
        type: 'analyze'
      });
      
      setTimeout(() => setProgress(p => ({ ...p, visible: false })), 3000);
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analyses'] });
      setSelectedGames(new Set());
    }
  });

  const successCount = batchResults.filter(r => r.status === 'success').length;
  const errorCount = batchResults.filter(r => r.status === 'error').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950">
      <ProgressOverlay {...progress} />

      {/* Header */}
      <header className="border-b border-stone-800 bg-stone-900/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(createPageUrl('Dashboard'))}
                className="text-stone-400 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <Crown className="w-6 h-6 text-stone-900" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">Batch Analysis</h1>
                  <p className="text-xs text-stone-500">Analyze multiple games at once</p>
                </div>
              </div>
            </div>
            <Button
              onClick={() => batchAnalyzeMutation.mutate()}
              disabled={selectedGames.size === 0 || batchAnalyzeMutation.isPending}
              className="bg-amber-500 hover:bg-amber-600 text-stone-900"
            >
              {batchAnalyzeMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Analyze {selectedGames.size} Games
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-stone-800/50 border-stone-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{games.length}</div>
                  <div className="text-xs text-stone-500">Total Games</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-stone-800/50 border-stone-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{analyses.length}</div>
                  <div className="text-xs text-stone-500">Analyzed</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-stone-800/50 border-stone-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Target className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{unanalyzedGames.length}</div>
                  <div className="text-xs text-stone-500">Pending</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-stone-800/50 border-stone-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{selectedGames.size}</div>
                  <div className="text-xs text-stone-500">Selected</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Batch Results */}
        {batchResults.length > 0 && (
          <Card className="bg-stone-800/50 border-stone-700 mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-white">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Batch Analysis Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <Badge className="bg-green-500/20 text-green-400">
                  {successCount} Successful
                </Badge>
                {errorCount > 0 && (
                  <Badge className="bg-red-500/20 text-red-400">
                    {errorCount} Failed
                  </Badge>
                )}
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {batchResults.map((result, idx) => (
                  <div 
                    key={idx}
                    className={`flex items-center justify-between p-2 rounded ${
                      result.status === 'success' ? 'bg-green-500/10' : 'bg-red-500/10'
                    }`}
                  >
                    <span className="text-white text-sm">
                      {result.game.white_username} vs {result.game.black_username}
                    </span>
                    {result.status === 'success' ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Games Selection */}
        <Card className="bg-stone-800/50 border-stone-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-white">Select Games to Analyze</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={selectAll}
                className="border-stone-600 hover:bg-stone-700"
              >
                {selectedGames.size === unanalyzedGames.length ? 'Deselect All' : 'Select All Pending'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
              </div>
            ) : games.length === 0 ? (
              <div className="text-center py-8 text-stone-500">
                No games available. Fetch some games first.
              </div>
            ) : (
              <div className="space-y-3">
                {games.map((game) => {
                  const isAnalyzed = analyzedGameIds.has(game.game_id);
                  const isSelected = selectedGames.has(game.id);
                  
                  return (
                    <div 
                      key={game.id}
                      className={`flex items-center gap-4 p-3 rounded-lg border transition-all ${
                        isSelected 
                          ? 'bg-amber-500/10 border-amber-500/50' 
                          : isAnalyzed
                            ? 'bg-green-500/5 border-green-500/20'
                            : 'bg-stone-700/30 border-stone-700 hover:border-stone-600'
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleGame(game.id)}
                        disabled={isAnalyzed}
                        className="border-stone-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">
                            {game.white_username || 'White'}
                          </span>
                          <span className="text-stone-500">vs</span>
                          <span className="text-white font-medium">
                            {game.black_username || 'Black'}
                          </span>
                          <Badge variant="outline" className="text-stone-400 border-stone-600 ml-2">
                            {game.result || '?'}
                          </Badge>
                        </div>
                        <div className="text-sm text-stone-500">
                          {game.opening || 'Unknown opening'}
                        </div>
                      </div>
                      {isAnalyzed && (
                        <Badge className="bg-green-500/20 text-green-400">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Analyzed
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}