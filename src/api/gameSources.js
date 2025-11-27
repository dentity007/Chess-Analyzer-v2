const CHESS_COM_BASE = 'https://api.chess.com/pub/player';

const RESULT_MAP = {
  win: 'win',
  resign: 'resign',
  resigned: 'resign',
  checkmated: 'checkmated',
  timeout: 'timeout',
  draw: 'draw',
  stalemate: 'draw',
  repetition: 'draw',
  agreed: 'draw'
};

function normalizeResult(whiteResult, blackResult) {
  const white = RESULT_MAP[whiteResult] || whiteResult;
  const black = RESULT_MAP[blackResult] || blackResult;

  if (white === 'win' || black === 'resign' || black === 'checkmated' || black === 'timeout') {
    return '1-0';
  }
  if (black === 'win' || white === 'resign' || white === 'checkmated' || white === 'timeout') {
    return '0-1';
  }
  return '1/2-1/2';
}

async function fetchArchives(username) {
  const response = await fetch(`${CHESS_COM_BASE}/${username}/games/archives`);
  if (!response.ok) {
    throw new Error('Chess.com username not found');
  }
  const data = await response.json();
  return data.archives || [];
}

function sanitizeGame(game) {
  const endTime = game.end_time || Math.floor(Date.now() / 1000);
  return {
    game_id: game.uuid || `${game.url || 'chesscom'}-${endTime}`,
    pgn: game.pgn,
    white_username: game.white?.username || 'White',
    black_username: game.black?.username || 'Black',
    white_rating: game.white?.rating,
    black_rating: game.black?.rating,
    result: normalizeResult(game.white?.result, game.black?.result),
    time_control: game.time_control,
    url: game.url,
    date: endTime,
    eco: game.eco,
    opening: game.opening || game.eco || 'Chess.com Game'
  };
}

function filterByMode(games, options) {
  const { mode, startDate, endDate, days } = options;
  if (mode === 'last') {
    return games.slice(0, 1);
  }
  if (mode === 'days' && days) {
    const cutoff = Math.floor(Date.now() / 1000) - Number(days) * 86400;
    return games.filter((game) => game.date >= cutoff);
  }
  if (mode === 'range' && startDate && endDate) {
    const start = Math.floor(new Date(startDate).getTime() / 1000);
    const endTs = Math.floor(new Date(endDate).getTime() / 1000);
    return games.filter((game) => game.date >= start && game.date <= endTs);
  }
  return games;
}

export async function fetchGamesFromChessCom(options) {
  const { username, limit = 30 } = options || {};
  if (!username) {
    throw new Error('A Chess.com username is required');
  }

  const normalizedUsername = username.trim().toLowerCase();
  try {
    const archives = await fetchArchives(normalizedUsername);
    const archiveUrls = archives.slice(-4).reverse();
    const games = [];

    for (const url of archiveUrls) {
      const response = await fetch(url);
      if (!response.ok) continue;
      const archive = await response.json();
      archive.games?.forEach((game) => {
        const participants = [
          game.white?.username?.toLowerCase(),
          game.black?.username?.toLowerCase()
        ];
        if (!participants.includes(normalizedUsername)) return;
        games.push(sanitizeGame(game));
      });
      if (games.length >= limit * 2) break;
    }

    const filtered = filterByMode(games, options);
    return filtered.slice(0, limit);
  } catch (error) {
    console.error('Failed to fetch Chess.com games', error);
    throw new Error('Unable to fetch games from Chess.com right now. Try again later or use Demo mode.');
  }
}
