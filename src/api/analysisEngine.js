const MOVE_REGEX = /(\d+)\.\s*([^\s]+)(?:\s+([^\s]+))?/g;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function parseMoves(pgn = '') {
  const moves = [];
  let match;
  while ((match = MOVE_REGEX.exec(pgn)) && moves.length < 400) {
    const moveNumber = Number.parseInt(match[1], 10);
    const whiteMove = match[2];
    const blackMove = match[3];
    if (whiteMove) {
      moves.push({ move_number: moveNumber, move: whiteMove, player: 'white' });
    }
    if (blackMove) {
      moves.push({ move_number: moveNumber, move: blackMove, player: 'black' });
    }
  }
  return moves;
}

function classifyMoves(moves) {
  const blunders = [];
  const mistakes = [];

  moves.forEach((entry) => {
    const moveText = entry.move || '';
    const normalized = moveText.replace(/[+#]/g, '');
    if (moveText.includes('??')) {
      blunders.push({
        ...entry,
        move: normalized,
        evaluation_change: -250
      });
    } else if (moveText.includes('?')) {
      mistakes.push({
        ...entry,
        move: normalized,
        evaluation_change: -120
      });
    }
  });

  return { blunders, mistakes };
}

function inferAccuracy(result, player, blunderCount, mistakeCount, totalMoves) {
  const base = totalMoves > 80 ? 85 : 90;
  const outcomeBonus = result === '1-0'
    ? player === 'white' ? 6 : -6
    : result === '0-1'
      ? player === 'black' ? 6 : -6
      : 0;
  const penalty = blunderCount * 8 + mistakeCount * 3;
  return clamp(base + outcomeBonus - penalty, 35, 99);
}

function buildCriticalMoments(blunders, mistakes) {
  const combined = [...blunders, ...mistakes]
    .sort((a, b) => Math.abs(b.evaluation_change) - Math.abs(a.evaluation_change));
  return combined.slice(0, 3).map((entry) => ({
    move_number: entry.move_number,
    description: `${entry.player === 'white' ? 'White' : 'Black'} played ${entry.move} and the evaluation swung by ${Math.abs(entry.evaluation_change)} centipawns`
  }));
}

function buildCoachingAdvice(game, blunders, mistakes, accuracy) {
  const tips = [];
  if (blunders.length > 0) {
    tips.push(`Review the tactics around move ${blunders[0].move_number} where ${blunders[0].player} faltered.`);
  }
  if (mistakes.length > 2) {
    tips.push('Several light inaccuracies crept in during the middlegame—slow down and calculate forcing replies.');
  }
  if (!game?.opening) {
    tips.push('Consider annotating your opening choices so trends are easier to spot.');
  }
  tips.push(`Overall accuracy landed at ${accuracy.white}% as White and ${accuracy.black}% as Black. Focus on keeping concentration in critical moments.`);
  return tips.join(' ');
}

function summarizeOpening(game) {
  if (game?.opening) {
    return `${game.opening} produced a ${game.result || 'balanced'} game. Review the first 10 moves to deepen your prep.`;
  }
  return 'The opening phase was balanced. Recording the exact line will make it easier to compare games later.';
}

export async function analyzeGameLocally(game = {}) {
  const moves = parseMoves(game.pgn);
  const { blunders, mistakes } = classifyMoves(moves);

  const whiteAccuracy = inferAccuracy(game.result, 'white', blunders.filter((b) => b.player === 'white').length, mistakes.filter((m) => m.player === 'white').length, moves.length);
  const blackAccuracy = inferAccuracy(game.result, 'black', blunders.filter((b) => b.player === 'black').length, mistakes.filter((m) => m.player === 'black').length, moves.length);

  const analysis = {
    total_moves: moves.length,
    blunders,
    mistakes,
    white_accuracy: whiteAccuracy,
    black_accuracy: blackAccuracy,
    critical_moments: buildCriticalMoments(blunders, mistakes),
    opening_assessment: summarizeOpening(game),
    coaching_advice: buildCoachingAdvice(game, blunders, mistakes, {
      white: whiteAccuracy,
      black: blackAccuracy
    })
  };

  return new Promise((resolve) => setTimeout(() => resolve(analysis), 180));
}
