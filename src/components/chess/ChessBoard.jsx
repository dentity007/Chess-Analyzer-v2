import React, { useMemo } from 'react';

const PIECE_SYMBOLS = {
  'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
  'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
};

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

function parseFEN(fen) {
  if (!fen) return null;
  const board = [];
  const [position] = fen.split(' ');
  const rows = position.split('/');
  
  for (const row of rows) {
    const boardRow = [];
    for (const char of row) {
      if (/\d/.test(char)) {
        for (let i = 0; i < parseInt(char); i++) {
          boardRow.push(null);
        }
      } else {
        boardRow.push(char);
      }
    }
    board.push(boardRow);
  }
  return board;
}

export default function ChessBoard({ 
  fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  highlightSquares = [],
  size = 'md',
  flipped = false
}) {
  const board = useMemo(() => parseFEN(fen), [fen]);
  
  const sizeClasses = {
    sm: 'w-6 h-6 text-sm',
    md: 'w-8 h-8 text-lg',
    lg: 'w-10 h-10 text-xl',
    xl: 'w-12 h-12 text-2xl'
  };

  const displayRanks = flipped ? [...RANKS].reverse() : RANKS;
  const displayFiles = flipped ? [...FILES].reverse() : FILES;

  if (!board) {
    return (
      <div className="aspect-square bg-stone-800 rounded-lg flex items-center justify-center">
        <span className="text-stone-500">Invalid position</span>
      </div>
    );
  }

  return (
    <div className="inline-block rounded-lg overflow-hidden shadow-xl border border-stone-700">
      <div className="flex flex-col">
        {displayRanks.map((rank, rowIndex) => (
          <div key={rank} className="flex">
            {displayFiles.map((file, colIndex) => {
              const actualRow = flipped ? 7 - rowIndex : rowIndex;
              const actualCol = flipped ? 7 - colIndex : colIndex;
              const piece = board[actualRow]?.[actualCol];
              const isLight = (rowIndex + colIndex) % 2 === 0;
              const square = `${file}${rank}`;
              const isHighlighted = highlightSquares.includes(square);
              
              return (
                <div
                  key={square}
                  className={`
                    ${sizeClasses[size]}
                    flex items-center justify-center relative
                    ${isLight ? 'bg-amber-100' : 'bg-amber-800'}
                    ${isHighlighted ? 'ring-2 ring-inset ring-red-500' : ''}
                    transition-all duration-200
                  `}
                >
                  {piece && (
                    <span 
                      className={`
                        ${piece === piece.toUpperCase() ? 'text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]' : 'text-stone-900'}
                        select-none
                      `}
                      style={{ textShadow: piece === piece.toUpperCase() ? '0 1px 2px rgba(0,0,0,0.5)' : 'none' }}
                    >
                      {PIECE_SYMBOLS[piece]}
                    </span>
                  )}
                  {isHighlighted && (
                    <div className="absolute inset-0 bg-red-500/30 animate-pulse" />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}