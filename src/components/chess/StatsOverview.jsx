import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Zap, Timer, Calendar, Globe, Activity } from 'lucide-react';
import { format } from 'date-fns';

export default function StatsOverview({ stats }) {
  if (!stats) {
    return (
      <Card className="bg-stone-800/50 border-stone-700">
        <CardContent className="p-6 text-center text-stone-500">
          <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No stats available</p>
        </CardContent>
      </Card>
    );
  }

  const ratingCards = [
    { label: 'Rapid', rating: stats.rapid_rating, games: stats.rapid_games, icon: Timer, color: 'text-blue-400' },
    { label: 'Blitz', rating: stats.blitz_rating, games: stats.blitz_games, icon: Zap, color: 'text-amber-400' },
    { label: 'Bullet', rating: stats.bullet_rating, games: stats.bullet_games, icon: Activity, color: 'text-red-400' },
  ].filter(r => r.rating);

  return (
    <div className="space-y-4">
      {/* Profile Card */}
      <Card className="bg-stone-800/50 border-stone-700">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-4">
            {stats.avatar ? (
              <img 
                src={stats.avatar} 
                alt={stats.username}
                className="w-16 h-16 rounded-full border-2 border-amber-500"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-stone-700 flex items-center justify-center">
                <Trophy className="w-8 h-8 text-amber-400" />
              </div>
            )}
            <div>
              <CardTitle className="text-xl text-white">{stats.username}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                {stats.country && (
                  <Badge variant="outline" className="text-stone-400 border-stone-600">
                    <Globe className="w-3 h-3 mr-1" />
                    {stats.country}
                  </Badge>
                )}
                {stats.joined && (
                  <Badge variant="outline" className="text-stone-400 border-stone-600">
                    <Calendar className="w-3 h-3 mr-1" />
                    Joined {format(new Date(stats.joined * 1000), 'MMM yyyy')}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Rating Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ratingCards.map((item) => (
          <Card key={item.label} className="bg-stone-800/50 border-stone-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                  <span className="text-stone-400">{item.label}</span>
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {item.rating}
              </div>
              {item.games && (
                <div className="text-sm text-stone-500">
                  {item.games.toLocaleString()} games played
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tactics Rating */}
      {stats.tactics_rating && (
        <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <div className="text-stone-400 text-sm">Tactics Rating</div>
                  <div className="text-2xl font-bold text-white">{stats.tactics_rating}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}