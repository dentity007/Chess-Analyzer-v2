import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  RotateCcw,
  Copy,
  Check
} from 'lucide-react';
import ChessBoard from './ChessBoard';
import EvaluationBar from './EvaluationBar';
import MoveList from './MoveList';

// Simple PGN parser to extract moves
function parsePGN(pgn) {
  if (!pgn) return { moves: [], headers: {} };
  
  const headers = {};
  const headerRegex = /\[(\w+)\s+"([^"]+)"\]/g;
  let match;
  while ((match = headerRegex.exec(pgn)) !== null) {
    headers[match[1]] = match[2];
  }
  
  // Extract moves section (after headers)
  let movesSection = pgn.replace(/\[.*?\]\s*/g, '').trim();
  movesSection = movesSection.replace(/\{[^}]*\}/g, ''); // Remove comments
  movesSection = movesSection.replace(/\([^)]*\)/g, ''); // Remove variations
  movesSection = movesSection.replace(/\d+\.\.\./g, ''); // Remove move continuations
  movesSection = movesSection.replace(/1-0|0-1|1\/2-1\/2|\*/g, ''); // Remove result
  
  const moveTokens = movesSection.split(/\s+/).filter(token => {
    return token && !token.match(/^\d+\.?$/);
  });
  
  return { moves: moveTokens, headers };
}

// Simple FEN generator from starting position and moves
function generatePositions(moves) {
  // Start position
  const positions = [
    { fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', evaluation: 0 }
  ];
  
  // For a real implementation, you'd use a chess library
  // This is simplified - just returns start position for all moves
  moves.forEach((_, idx) => {
    positions.push({
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', // placeholder
      evaluation: Math.random() * 200 - 100 // Simulated evaluation
    });
  });
  
  return positions;
}

export default function GameViewer({ 
  game, 
  analysis,
  onClose 
}) {
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [flipped, setFlipped] = useState(false);
  const [copied, setCopied] = useState(false);

  const { moves, headers } = useMemo(() => parsePGN(game?.pgn), [game?.pgn]);
  const positions = useMemo(() => generatePositions(moves), [moves]);

  const currentPosition = positions[currentMoveIndex + 1] || positions[0];
  
  const goToStart = () => setCurrentMoveIndex(-1);
  const goToEnd = () => setCurrentMoveIndex(moves.length - 1);
  const goBack = () => setCurrentMoveIndex(Math.max(-1, currentMoveIndex - 1));
  const goForward = () => setCurrentMoveIndex(Math.min(moves.length - 1, currentMoveIndex + 1));

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') goBack();
    if (e.key === 'ArrowRight') goForward();
    if (e.key === 'Home') goToStart();
    if (e.key === 'End') goToEnd();
  };

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentMoveIndex]);

  const copyPGN = () => {
    navigator.clipboard.writeText(game?.pgn || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const blunders = analysis?.blunders || [];
  const mistakes = analysis?.mistakes || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Board Section */}
      <div className="lg:col-span-2">
        <Card className="bg-stone-800/50 border-stone-700">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-white">
                {game?.white_username || 'White'} vs {game?.black_username || 'Black'}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-stone-300 border-stone-600">
                  {game?.result || '?'}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setFlipped(!flipped)}
                  className="text-stone-400 hover:text-white"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 justify-center">
              <EvaluationBar 
                evaluation={currentPosition.evaluation} 
                height={320}
              />
              <ChessBoard 
                fen={currentPosition.fen}
                size="lg"
                flipped={flipped}
              />
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="icon"
                onClick={goToStart}
                disabled={currentMoveIndex === -1}
                className="border-stone-600 hover:bg-stone-700"
              >
                <ChevronsLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={goBack}
                disabled={currentMoveIndex === -1}
                className="border-stone-600 hover:bg-stone-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-stone-400 text-sm min-w-[80px] text-center">
                Move {currentMoveIndex + 1} / {moves.length}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={goForward}
                disabled={currentMoveIndex === moves.length - 1}
                className="border-stone-600 hover:bg-stone-700"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={goToEnd}
                disabled={currentMoveIndex === moves.length - 1}
                className="border-stone-600 hover:bg-stone-700"
              >
                <ChevronsRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Copy PGN */}
            <div className="mt-4 pt-4 border-t border-stone-700">
              <Button
                variant="outline"
                size="sm"
                onClick={copyPGN}
                className="border-stone-600 hover:bg-stone-700"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2 text-green-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy PGN
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Moves & Info Section */}
      <div className="space-y-4">
        <Card className="bg-stone-800/50 border-stone-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-white">Moves</CardTitle>
          </CardHeader>
          <CardContent>
            <MoveList
              moves={moves}
              currentMoveIndex={currentMoveIndex}
              onMoveClick={setCurrentMoveIndex}
              blunders={blunders}
              mistakes={mistakes}
            />
          </CardContent>
        </Card>

        {/* Opening Info */}
        {headers.Opening && (
          <Card className="bg-stone-800/50 border-stone-700">
            <CardContent className="p-4">
              <div className="text-stone-400 text-sm">Opening</div>
              <div className="text-white font-medium">{headers.Opening}</div>
              {headers.ECO && (
                <Badge variant="outline" className="mt-2 text-stone-400 border-stone-600">
                  {headers.ECO}
                </Badge>
              )}
            </CardContent>
          </Card>
        )}

        {/* Game Info */}
        <Card className="bg-stone-800/50 border-stone-700">
          <CardContent className="p-4 space-y-2">
            {headers.Date && (
              <div className="flex justify-between">
                <span className="text-stone-400">Date</span>
                <span className="text-white">{headers.Date}</span>
              </div>
            )}
            {headers.TimeControl && (
              <div className="flex justify-between">
                <span className="text-stone-400">Time Control</span>
                <span className="text-white">{headers.TimeControl}</span>
              </div>
            )}
            {headers.Termination && (
              <div className="flex justify-between">
                <span className="text-stone-400">Termination</span>
                <span className="text-white">{headers.Termination}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}