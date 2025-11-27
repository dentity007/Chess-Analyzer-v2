import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { platformClient } from '@/api/platformClient';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Crown,
  TrendingUp,
  TrendingDown,
  Target,
  Brain,
  AlertTriangle,
  AlertCircle,
  Trophy,
  Calendar,
  Zap,
  Timer
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format } from 'date-fns';

const COLORS = ['#f59e0b', '#10b981', '#ef4444', '#6366f1', '#8b5cf6'];

export default function Statistics() {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('all');

  // Fetch games
  const { data: games = [] } = useQuery({
    queryKey: ['games'],
    queryFn: () => platformClient.entities.Game.list('-date', 500),
  });

  // Fetch analyses
  const { data: analyses = [] } = useQuery({
    queryKey: ['analyses'],
    queryFn: () => platformClient.entities.Analysis.list(),
  });

  // Calculate statistics
  const stats = useMemo(() => {
    if (games.length === 0) return null;

    const analysisMap = new Map(analyses.map(a => [a.game_id, a]));

    // Win/Loss/Draw stats
    let wins = 0, losses = 0, draws = 0;
    const accuracyData = [];
    const resultsByOpening = {};
    const resultsByTimeControl = {};

    games.forEach(game => {
      // Assuming we track the user as white or black based on some logic
      // For now, we'll count from white's perspective
      if (game.result === '1-0') wins++;
      else if (game.result === '0-1') losses++;
      else if (game.result === '1/2-1/2') draws++;

      // Accuracy over time
      const analysis = analysisMap.get(game.game_id);
      if (analysis && game.date) {
        accuracyData.push({
          date: game.date,
          accuracy: (analysis.white_accuracy + analysis.black_accuracy) / 2,
          blunders: analysis.blunder_count,
          mistakes: analysis.mistake_count
        });
      }

      // Opening stats
      const opening = game.opening || 'Unknown';
      if (!resultsByOpening[opening]) {
        resultsByOpening[opening] = { wins: 0, losses: 0, draws: 0, total: 0 };
      }
      resultsByOpening[opening].total++;
      if (game.result === '1-0') resultsByOpening[opening].wins++;
      else if (game.result === '0-1') resultsByOpening[opening].losses++;
      else resultsByOpening[opening].draws++;

      // Time control stats
      const tc = game.time_control || 'Unknown';
      const tcCategory = tc.includes('60') ? 'Bullet' : tc.includes('180') ? 'Blitz' : tc.includes('600') ? 'Rapid' : 'Other';
      if (!resultsByTimeControl[tcCategory]) {
        resultsByTimeControl[tcCategory] = { wins: 0, losses: 0, draws: 0, total: 0 };
      }
      resultsByTimeControl[tcCategory].total++;
      if (game.result === '1-0') resultsByTimeControl[tcCategory].wins++;
      else if (game.result === '0-1') resultsByTimeControl[tcCategory].losses++;
      else resultsByTimeControl[tcCategory].draws++;
    });

    // Top openings
    const topOpenings = Object.entries(resultsByOpening)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 5)
      .map(([name, data]) => ({
        name: name.length > 20 ? name.substring(0, 20) + '...' : name,
        ...data,
        winRate: ((data.wins / data.total) * 100).toFixed(1)
      }));

    // Time control breakdown
    const timeControlData = Object.entries(resultsByTimeControl)
      .map(([name, data]) => ({
        name,
        value: data.total,
        ...data
      }));

    // Sort accuracy data by date
    accuracyData.sort((a, b) => a.date - b.date);
    
    // Format for chart
    const accuracyChartData = accuracyData.slice(-20).map(d => ({
      ...d,
      dateLabel: format(new Date(d.date * 1000), 'MMM d')
    }));

    // Average stats from analyses
    const totalAnalyses = analyses.length;
    const avgAccuracy = totalAnalyses > 0 
      ? analyses.reduce((sum, a) => sum + ((a.white_accuracy || 0) + (a.black_accuracy || 0)) / 2, 0) / totalAnalyses 
      : 0;
    const totalBlunders = analyses.reduce((sum, a) => sum + (a.blunder_count || 0), 0);
    const totalMistakes = analyses.reduce((sum, a) => sum + (a.mistake_count || 0), 0);

    return {
      totalGames: games.length,
      wins,
      losses,
      draws,
      winRate: games.length > 0 ? ((wins / games.length) * 100).toFixed(1) : 0,
      avgAccuracy: avgAccuracy.toFixed(1),
      totalBlunders,
      totalMistakes,
      blundersPerGame: totalAnalyses > 0 ? (totalBlunders / totalAnalyses).toFixed(1) : 0,
      mistakesPerGame: totalAnalyses > 0 ? (totalMistakes / totalAnalyses).toFixed(1) : 0,
      topOpenings,
      timeControlData,
      accuracyChartData,
      resultsPieData: [
        { name: 'Wins', value: wins, color: '#10b981' },
        { name: 'Losses', value: losses, color: '#ef4444' },
        { name: 'Draws', value: draws, color: '#6366f1' }
      ]
    };
  }, [games, analyses]);

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950">
        <header className="border-b border-stone-800 bg-stone-900/50 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(createPageUrl('Dashboard'))}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-white">Statistics</h1>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-8">
          <Card className="bg-stone-800/50 border-stone-700">
            <CardContent className="p-8 text-center">
              <TrendingUp className="w-12 h-12 mx-auto text-stone-600 mb-3" />
              <h2 className="text-xl font-bold text-white mb-2">No Data Yet</h2>
              <p className="text-stone-500">Fetch and analyze some games to see your statistics.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950">
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
                  <h1 className="text-lg font-bold text-white">Statistics</h1>
                  <p className="text-xs text-stone-500">{stats.totalGames} games analyzed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-stone-800/50 border-stone-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{stats.winRate}%</div>
                  <div className="text-xs text-stone-500">Win Rate</div>
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
                  <div className="text-2xl font-bold text-white">{stats.avgAccuracy}%</div>
                  <div className="text-xs text-stone-500">Avg Accuracy</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-stone-800/50 border-stone-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{stats.blundersPerGame}</div>
                  <div className="text-xs text-stone-500">Blunders/Game</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-stone-800/50 border-stone-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{stats.mistakesPerGame}</div>
                  <div className="text-xs text-stone-500">Mistakes/Game</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="performance" className="space-y-6">
          <TabsList className="bg-stone-800 border border-stone-700">
            <TabsTrigger value="performance" className="data-[state=active]:bg-amber-500 data-[state=active]:text-stone-900">
              Performance
            </TabsTrigger>
            <TabsTrigger value="openings" className="data-[state=active]:bg-amber-500 data-[state=active]:text-stone-900">
              Openings
            </TabsTrigger>
            <TabsTrigger value="accuracy" className="data-[state=active]:bg-amber-500 data-[state=active]:text-stone-900">
              Accuracy
            </TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Results Pie Chart */}
              <Card className="bg-stone-800/50 border-stone-700">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Game Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={stats.resultsPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {stats.resultsPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#292524', 
                          border: '1px solid #44403c',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-6 mt-4">
                    {stats.resultsPieData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-stone-400 text-sm">{item.name}: {item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Time Control Distribution */}
              <Card className="bg-stone-800/50 border-stone-700">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Time Controls</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={stats.timeControlData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#44403c" />
                      <XAxis dataKey="name" stroke="#a8a29e" />
                      <YAxis stroke="#a8a29e" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#292524', 
                          border: '1px solid #44403c',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="openings">
            <Card className="bg-stone-800/50 border-stone-700">
              <CardHeader>
                <CardTitle className="text-lg text-white">Top Openings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.topOpenings.map((opening, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-stone-700 flex items-center justify-center text-white font-bold">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium truncate">{opening.name}</div>
                        <div className="flex gap-4 text-sm text-stone-500">
                          <span>{opening.total} games</span>
                          <span className="text-green-400">{opening.wins}W</span>
                          <span className="text-red-400">{opening.losses}L</span>
                          <span className="text-blue-400">{opening.draws}D</span>
                        </div>
                      </div>
                      <Badge className={`${
                        parseFloat(opening.winRate) >= 50 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {opening.winRate}%
                      </Badge>
                    </div>
                  ))}
                  {stats.topOpenings.length === 0 && (
                    <p className="text-stone-500 text-center py-4">No opening data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="accuracy">
            <Card className="bg-stone-800/50 border-stone-700">
              <CardHeader>
                <CardTitle className="text-lg text-white">Accuracy Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.accuracyChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={stats.accuracyChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#44403c" />
                      <XAxis dataKey="dateLabel" stroke="#a8a29e" />
                      <YAxis domain={[0, 100]} stroke="#a8a29e" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#292524', 
                          border: '1px solid #44403c',
                          borderRadius: '8px'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="accuracy" 
                        stroke="#f59e0b" 
                        strokeWidth={2}
                        dot={{ fill: '#f59e0b' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-stone-500">
                    <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Analyze some games to see accuracy trends</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}