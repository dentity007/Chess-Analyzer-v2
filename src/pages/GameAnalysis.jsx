import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { platformClient } from '@/api/platformClient';
import { analyzeWithProvider } from '@/api/aiProviders';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Brain, 
  Loader2, 
  Crown,
  Sparkles,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import GameViewer from '@/components/chess/GameViewer';
import AnalysisPanel from '@/components/chess/AnalysisPanel';
import ProgressOverlay from '@/components/chess/ProgressOverlay';

export default function GameAnalysis() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const gameId = urlParams.get('gameId');
  
  const [progress, setProgress] = useState({ visible: false, status: 'idle', progress: 0, message: '', type: 'analyze' });

  // Fetch game
  const { data: game, isLoading: gameLoading } = useQuery({
    queryKey: ['game', gameId],
    queryFn: () => platformClient.entities.Game.filter({ id: gameId }),
    enabled: !!gameId,
    select: (data) => data?.[0]
  });

  // Fetch existing analysis
  const { data: existingAnalysis } = useQuery({
    queryKey: ['analysis', game?.game_id],
    queryFn: () => platformClient.entities.Analysis.filter({ game_id: game?.game_id }),
    enabled: !!game?.game_id,
    select: (data) => data?.[0]
  });

  const { data: userSettings } = useQuery({
    queryKey: ['user-settings'],
    queryFn: () => platformClient.auth.me(),
    staleTime: 1000 * 60 * 5
  });

  // Analyze game mutation
  const analyzeMutation = useMutation({
    mutationFn: async () => {
      if (!game?.pgn) throw new Error('No game PGN available');

      setProgress({ visible: true, status: 'analyzing', progress: 10, message: 'Parsing game moves...', type: 'analyze' });

      // Use AI to analyze the game
      setProgress({ visible: true, status: 'analyzing', progress: 30, message: 'Running position analysis...', type: 'analyze' });

      const analysisResult = await analyzeWithProvider(game, userSettings);

      setProgress({ visible: true, status: 'analyzing', progress: 80, message: 'Saving analysis...', type: 'analyze' });

      // Save analysis to database
      const analysisData = {
        game_id: game.game_id,
        total_moves: analysisResult.total_moves || 0,
        blunder_count: analysisResult.blunders?.length || 0,
        mistake_count: analysisResult.mistakes?.length || 0,
        inaccuracy_count: 0,
        white_accuracy: analysisResult.white_accuracy || 0,
        black_accuracy: analysisResult.black_accuracy || 0,
        blunders: analysisResult.blunders || [],
        mistakes: analysisResult.mistakes || [],
        critical_moments: analysisResult.critical_moments || [],
        opening_phase: analysisResult.opening_assessment || '',
        ai_insights: analysisResult.coaching_advice || '',
        ai_suggested_questions: analysisResult.suggested_questions || [],
        analyzed_at: Math.floor(Date.now() / 1000)
      };

      // Check if analysis exists
      if (existingAnalysis?.id) {
        await platformClient.entities.Analysis.update(existingAnalysis.id, analysisData);
      } else {
        await platformClient.entities.Analysis.create(analysisData);
      }

      setProgress({ visible: true, status: 'completed', progress: 100, message: 'Analysis complete!', type: 'analyze' });
      setTimeout(() => setProgress(p => ({ ...p, visible: false })), 2000);

      return analysisData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analysis', game?.game_id] });
    },
    onError: (error) => {
      setProgress({ visible: true, status: 'error', progress: 0, message: error.message || 'Analysis failed', type: 'analyze' });
      setTimeout(() => setProgress(p => ({ ...p, visible: false })), 4000);
    }
  });

  if (gameLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 p-8">
        <Card className="max-w-md mx-auto bg-stone-800/50 border-stone-700">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto text-amber-400 mb-3" />
            <h2 className="text-xl font-bold text-white mb-2">Game Not Found</h2>
            <p className="text-stone-400 mb-4">The requested game could not be found.</p>
            <Button onClick={() => navigate(createPageUrl('Dashboard'))} className="bg-amber-500 hover:bg-amber-600 text-stone-900">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const analysis = existingAnalysis || analyzeMutation.data;

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
                  <h1 className="text-lg font-bold text-white">Game Analysis</h1>
                  <p className="text-xs text-stone-500">{game.white_username} vs {game.black_username}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {analysis ? (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Analyzed
                </Badge>
              ) : (
                <Button
                  onClick={() => analyzeMutation.mutate()}
                  disabled={analyzeMutation.isPending}
                  className="bg-amber-500 hover:bg-amber-600 text-stone-900"
                >
                  {analyzeMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Brain className="w-4 h-4 mr-2" />
                  )}
                  Analyze Game
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Game Viewer - Takes 3 columns */}
          <div className="xl:col-span-3">
            <GameViewer 
              game={game}
              analysis={analysis}
            />
          </div>

          {/* Analysis Panel - Takes 1 column */}
          <div className="xl:col-span-1">
            <AnalysisPanel 
              analysis={analysis}
              aiInsights={analysis?.ai_insights}
            />

            {/* Re-analyze button if already analyzed */}
            {analysis && (
              <Button
                variant="outline"
                onClick={() => analyzeMutation.mutate()}
                disabled={analyzeMutation.isPending}
                className="w-full mt-4 border-stone-600 hover:bg-stone-700"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Re-analyze with AI
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}