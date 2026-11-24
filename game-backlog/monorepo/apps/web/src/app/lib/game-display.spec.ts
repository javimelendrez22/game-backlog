import {
  coverColor,
  formatDate,
  formatHours,
  initials,
  isGameStatus,
  metaLine,
  platformLine,
  STATUS_META,
  STATUSES,
} from './game-display';

describe('initials', () => {
  it.each([
    ['Ashen Circuit', 'AC'],
    ['Ember & Oak', 'EO'],
    ['Saltglass', 'S'],
    ['hollow meridian knight', 'HM'],
    ['  Paper   Saints ', 'PS'],
    ["Baldur's Gate 3", 'BG'],
  ])('%s -> %s', (title, expected) => {
    expect(initials(title)).toBe(expected);
  });
});

describe('metaLine', () => {
  it.each([
    [{ status: 'wishlist', hoursPlayed: null }, 'Wanted'],
    [{ status: 'backlog', hoursPlayed: null }, 'Not started'],
    [{ status: 'backlog', hoursPlayed: 2 }, '2 h played'],
    [{ status: 'playing', hoursPlayed: 32 }, '32 h played'],
    [{ status: 'playing', hoursPlayed: 1.25 }, '1.3 h played'],
    [{ status: 'completed', hoursPlayed: 41 }, '41 h total'],
    [{ status: 'completed', hoursPlayed: null }, 'Completed'],
    [{ status: 'dropped', hoursPlayed: 5 }, 'Dropped at 5 h'],
    [{ status: 'dropped', hoursPlayed: 0 }, 'Dropped'],
  ] as const)('%o -> %s', (game, expected) => {
    expect(metaLine(game)).toBe(expected);
  });
});

describe('platformLine', () => {
  it('joins platform labels', () => {
    expect(platformLine({ platforms: ['pc', 'playstation-5'] })).toBe(
      'PC · PlayStation 5',
    );
  });
});

describe('coverColor', () => {
  it('is stable for the same id and a hex color', () => {
    const id = '7f1c2c1e-1b7a-4d55-9d2a-1f9f2b9a0c11';
    expect(coverColor(id)).toBe(coverColor(id));
    expect(coverColor(id)).toMatch(/^#[0-9A-F]{6}$/i);
  });
});

describe('statuses', () => {
  it('has display metadata for every status', () => {
    for (const s of STATUSES) expect(STATUS_META[s].label).toBeTruthy();
    expect(STATUSES).toHaveLength(Object.keys(STATUS_META).length);
  });

  it('isGameStatus narrows only known values', () => {
    expect(isGameStatus('playing')).toBe(true);
    expect(isGameStatus('owned')).toBe(false);
    expect(isGameStatus(null)).toBe(false);
  });
});

describe('formatDate', () => {
  it.each([
    ['2025-09-18', 'Sep 18, 2025'],
    ['2026-01-01', 'Jan 1, 2026'],
    ['2026-11-21T22:05:00.000Z', 'Nov 21, 2026'],
  ])('%s -> %s', (value, expected) => {
    expect(formatDate(value)).toBe(expected);
  });
});

describe('formatHours', () => {
  it.each([
    [32, '32 h'],
    [0, '0 h'],
    [12.5, '12.5 h'],
  ])('%s -> %s', (hours, expected) => {
    expect(formatHours(hours)).toBe(expected);
  });
});
