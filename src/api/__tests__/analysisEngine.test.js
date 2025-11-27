import { describe, expect, it } from 'vitest';
import { analyzeGameLocally } from '../analysisEngine';

const SAMPLE_PGN = `1. e4?? e5?? 2. Nf3? Nc6?? 3. Bc4? Nf6 4. Ng5 d5 5. exd5 Na5??`;

describe('analyzeGameLocally', () => {
  it('flags blunders and mistakes based on PGN annotations', async () => {
    const result = await analyzeGameLocally({
      pgn: SAMPLE_PGN,
      result: '1-0',
      opening: 'Italian Game'
    });

    expect(result.total_moves).toBeGreaterThan(0);
    expect(result.blunders.length).toBeGreaterThanOrEqual(1);
    expect(result.mistakes.length).toBeGreaterThanOrEqual(1);
    expect(result.white_accuracy).toBeGreaterThan(34);
    expect(result.black_accuracy).toBeLessThanOrEqual(99);
    expect(result.coaching_advice).toContain('accuracy');
  });
});
