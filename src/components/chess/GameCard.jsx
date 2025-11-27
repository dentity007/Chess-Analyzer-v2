import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Calendar, ChevronRight, Trophy, Swords } from 'lucide-react';
import { format } from 'date-fns';

export default function GameCard({ game, onClick, isAnalyzed = false }) {
  const getResultBadge = (result, username) => {
    if (!result) return null;
    
    const isWhite = game.white_username?.toLowerCase() === username?.toLowerCase();
    const isWin = (result === '1-0' && isWhite) || (result === '0-1' && !isWhite);
    const isDraw = result === '1/2-1/2';

    if (isWin) {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Win</Badge>;
    } else if (isDraw) {
      return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Draw</Badge>;
    } else {
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Loss</Badge>;
    }
  };

  const formatTimeControl = (tc) => {
    if (!tc) return 'Unknown';
    const [base, increment] = tc.split('+').map(Number);
    if (base >= 600) return 'Rapid';
    if (base >= 180) return 'Blitz';
    return 'Bullet';
  };

  const gameDate = game.date ? new Date(game.date * 1000) : null;

  return (
    <Card 
      className="bg-stone-800/50 border-stone-700 hover:border-amber-500/50 transition-all cursor-pointer group"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Players */}
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-3 h-3 rounded-full bg-white border border-stone-600" />
                <span className="text-white font-medium truncate">
                  {game.white_username || 'White'}
                </span>
                {game.white_rating && (
                  <span className="text-stone-400 text-sm">({game.white_rating})</span>
                )}
              </div>
              <Swords className="w-4 h-4 text-stone-500 flex-shrink-0" />
              <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                {game.black_rating && (
                  <span className="text-stone-400 text-sm">({game.black_rating})</span>
                )}
                <span className="text-white font-medium truncate">
                  {game.black_username || 'Black'}
                </span>
                <div className="w-3 h-3 rounded-full bg-stone-900 border border-stone-600" />
              </div>
            </div>

            {/* Result & Opening */}
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <Badge variant="outline" className="text-stone-300 border-stone-600">
                {game.result || '?'}
              </Badge>
              {game.opening && (
                <span className="text-stone-400 text-sm truncate">{game.opening}</span>
              )}
            </div>

            {/* Meta info */}
            <div className="flex items-center gap-4 text-sm text-stone-500">
              {gameDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(gameDate, 'MMM d, yyyy')}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTimeControl(game.time_control)}
              </span>
              {isAnalyzed && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  Analyzed
                </Badge>
              )}
            </div>
          </div>

          <Button 
            variant="ghost" 
            size="icon"
            className="text-stone-400 group-hover:text-amber-400 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}