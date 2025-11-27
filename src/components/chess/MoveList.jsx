import React from 'react';
import { cn } from '@/lib/utils';

export default function MoveList({ 
  moves = [], 
  currentMoveIndex = -1, 
  onMoveClick,
  blunders = [],
  mistakes = []
}) {
  // Group moves into pairs (white + black)
  const movePairs = [];
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      number: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1],
      whiteIndex: i,
      blackIndex: i + 1
    });
  }

  const getMoveClass = (moveIndex) => {
    const isBlunder = blunders.some(b => b.move_number === moveIndex + 1);
    const isMistake = mistakes.some(m => m.move_number === moveIndex + 1);
    const isSelected = moveIndex === currentMoveIndex;

    return cn(
      'px-2 py-0.5 rounded cursor-pointer transition-all',
      'hover:bg-amber-500/30',
      isSelected && 'bg-amber-500 text-stone-900 font-semibold',
      isBlunder && !isSelected && 'bg-red-500/30 text-red-300',
      isMistake && !isBlunder && !isSelected && 'bg-orange-500/30 text-orange-300'
    );
  };

  return (
    <div className="bg-stone-800/50 rounded-lg border border-stone-700 p-3 max-h-64 overflow-y-auto">
      <div className="space-y-1 font-mono text-sm">
        {movePairs.map((pair) => (
          <div key={pair.number} className="flex items-center gap-2">
            <span className="text-stone-500 w-8 text-right">{pair.number}.</span>
            {pair.white && (
              <span 
                className={getMoveClass(pair.whiteIndex)}
                onClick={() => onMoveClick?.(pair.whiteIndex)}
              >
                {pair.white.san || pair.white.move || pair.white}
              </span>
            )}
            {pair.black && (
              <span 
                className={getMoveClass(pair.blackIndex)}
                onClick={() => onMoveClick?.(pair.blackIndex)}
              >
                {pair.black.san || pair.black.move || pair.black}
              </span>
            )}
          </div>
        ))}
        {moves.length === 0 && (
          <p className="text-stone-500 text-center py-4">No moves yet</p>
        )}
      </div>
    </div>
  );
}