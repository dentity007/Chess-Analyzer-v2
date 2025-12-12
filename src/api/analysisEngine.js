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
  const totalIssues = blunders.length + mistakes.length;
  const resultText = game?.result === '1-0'
    ? 'White converted the game.'
    : game?.result === '0-1'
      ? 'Black converted the game.'
      : 'The game ended in a draw.';

  // Phase-aware guidance so feedback feels specific and actionable
  const phaseBuckets = { opening: [], middlegame: [], endgame: [] };
  [...blunders, ...mistakes].forEach((entry) => {
    if (entry.move_number <= 12) {
      phaseBuckets.opening.push(entry);
    } else if (entry.move_number <= 30) {
      phaseBuckets.middlegame.push(entry);
    } else {
      phaseBuckets.endgame.push(entry);
    }
  });

  const topSwing = [...blunders, ...mistakes]
    .sort((a, b) => Math.abs(b.evaluation_change) - Math.abs(a.evaluation_change))[0];

  if (topSwing) {
    tips.push(
      `Largest swing: ${topSwing.player === 'white' ? 'White' : 'Black'} played ${topSwing.move} on move ${topSwing.move_number}, costing roughly ${Math.abs(topSwing.evaluation_change)} centipawns. Revisit that branch with an engine and compare tactical motifs.`
    );
  }

  const addPhaseNote = (label, entries) => {
    if (entries.length === 0) return;
    const sample = entries.slice(0, 2).map((e) => `${e.move_number} (${e.move})`).join(', ');
    tips.push(`${label}: ${entries.length} critical slip${entries.length > 1 ? 's' : ''} around moves ${sample}. Slow down here; calculate checks, captures, and forcing moves before committing.`);
  };

  addPhaseNote('Opening discipline', phaseBuckets.opening);
  addPhaseNote('Middlegame decision-making', phaseBuckets.middlegame);
  addPhaseNote('Endgame technique', phaseBuckets.endgame);

  if (totalIssues === 0) {
    tips.push('Clean tactical sheet—no blunders or flagged mistakes. Consider deepening your plan annotations to squeeze extra accuracy from equal positions.');
  } else if (blunders.length > 0 && mistakes.length === 0) {
    tips.push('Only major errors were flagged; one or two heavy tactical misses swung the evaluation. Train on similar motifs to avoid single-move collapses.');
  } else if (mistakes.length > 3) {
    tips.push('Several light inaccuracies accumulated. Tighten move selection by pruning impulsive candidate moves and comparing two concrete lines each turn.');
  }

  if (!game?.opening) {
    tips.push('Opening unspecified—log your repertoire line so you can compare branches and prep improvements for the next outing.');
  } else {
    tips.push(`Opening: ${game.opening}. Review the first 10 moves to confirm piece placement matched your prep and that you achieved the desired pawn structure.`);
  }

  tips.push(
    `${resultText} Accuracy: ${accuracy.white}% as White, ${accuracy.black}% as Black. Track whether the lower side is consistently underperforming and run targeted drills for that color.`
  );

  return tips.join(' ');
}

function summarizeOpening(game) {
  if (game?.opening) {
    return `${game.opening} produced a ${game.result || 'balanced'} game. Review the first 10 moves to deepen your prep.`;
  }
  return 'The opening phase was balanced. Recording the exact line will make it easier to compare games later.';
}

function buildSuggestedQuestions(game, blunders, mistakes) {
  const sampleMoves = (moves) => moves.slice(0, 3).map((m) => `${m.move_number}...${m.move}`).join(', ');
  const notable = [...blunders, ...mistakes].sort((a, b) => Math.abs(b.evaluation_change) - Math.abs(a.evaluation_change));
  const topMoves = sampleMoves(notable);
  const opening = game?.opening || 'the opening phase';

  const core = [
    `What was the best continuation after move ${notable[0]?.move_number || 10}, and how should the disadvantaged side have equalized?`,
    `How could ${opening} have been improved to secure a small plus out of the opening?`,
    `Identify the critical tactical motif missed around moves ${topMoves || '10-20'} and provide the exact refutation line.`,
    `Given the resulting pawn structure, what long-term plan should each side adopt (minor-piece placement, pawn breaks, target squares)?`,
    `Where did the evaluation start to drift, and what practical defensive resources were available to hold the position?`
  ];

  const followUps = [
    'Show a move-by-move alternative line that keeps equality through the middlegame.',
    'List common traps or tactical shots in this opening that I should rehearse.',
    'Provide a three-point endgame plan based on the remaining material and pawn majorities.',
    'Suggest a drill to avoid repeating the same blunder pattern seen in this game.',
    'Summarize the key positional imbalances (space, king safety, pawn structure) and how to leverage them next time.'
  ];

  return [...core, ...followUps];
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
    }),
    suggested_questions: buildSuggestedQuestions(game, blunders, mistakes)
  };

  return new Promise((resolve) => setTimeout(() => resolve(analysis), 180));
}
