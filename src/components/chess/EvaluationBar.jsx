import React from 'react';

export default function EvaluationBar({ evaluation = 0, height = 200 }) {
  // Clamp evaluation between -1000 and 1000 centipawns for display
  const clampedEval = Math.max(-1000, Math.min(1000, evaluation));
  
  // Convert to percentage (50% = equal, 100% = white winning, 0% = black winning)
  const percentage = 50 + (clampedEval / 20);
  const clampedPercentage = Math.max(5, Math.min(95, percentage));
  
  const formatEval = (eval_) => {
    if (Math.abs(eval_) >= 1000) {
      return eval_ > 0 ? 'M' : '-M';
    }
    const pawns = eval_ / 100;
    return pawns > 0 ? `+${pawns.toFixed(1)}` : pawns.toFixed(1);
  };

  return (
    <div 
      className="relative bg-stone-900 rounded-lg overflow-hidden border border-stone-700"
      style={{ width: '24px', height: `${height}px` }}
    >
      {/* Black side (top) */}
      <div 
        className="absolute top-0 left-0 right-0 bg-stone-800 transition-all duration-300"
        style={{ height: `${100 - clampedPercentage}%` }}
      />
      {/* White side (bottom) */}
      <div 
        className="absolute bottom-0 left-0 right-0 bg-white transition-all duration-300"
        style={{ height: `${clampedPercentage}%` }}
      />
      {/* Evaluation text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span 
          className={`
            text-[10px] font-bold rotate-[-90deg] whitespace-nowrap
            ${clampedPercentage > 50 ? 'text-stone-800' : 'text-white'}
          `}
        >
          {formatEval(evaluation)}
        </span>
      </div>
    </div>
  );
}