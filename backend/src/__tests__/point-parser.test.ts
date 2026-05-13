import { describe, it, expect } from 'vitest';
import { parsePointsFromLabels } from '../utils/point-parser.js';

describe('parsePointsFromLabels', () => {
  it('extracts points from drips-wave label', () => {
    const result = parsePointsFromLabels([
      { name: 'bug' },
      { name: 'drips-wave: 100' },
    ]);
    expect(result).toEqual({ points: 100, label: 'drips-wave: 100' });
  });

  it('extracts points from case-insensitive label', () => {
    const result = parsePointsFromLabels([
      { name: 'DRIPS-WAVE: 50' },
    ]);
    expect(result).toEqual({ points: 50, label: 'DRIPS-WAVE: 50' });
  });

  it('extracts points with extra whitespace', () => {
    const result = parsePointsFromLabels([
      { name: 'drips-wave:   250' },
    ]);
    expect(result).toEqual({ points: 250, label: 'drips-wave:   250' });
  });

  it('throws when no labels exist', () => {
    expect(() => parsePointsFromLabels([])).toThrow('No labels found');
  });

  it('throws when no drips-wave label exists', () => {
    expect(() =>
      parsePointsFromLabels([{ name: 'bug' }, { name: 'enhancement' }]),
    ).toThrow('No "drips-wave');
  });

  it('throws when points value is zero', () => {
    expect(() =>
      parsePointsFromLabels([{ name: 'drips-wave: 0' }]),
    ).toThrow('must be positive');
  });

  it('throws when points value is negative', () => {
    expect(() =>
      parsePointsFromLabels([{ name: 'drips-wave: -10' }]),
    ).toThrow('No "drips-wave');
  });

  it('returns first drips-wave label when multiple exist', () => {
    const result = parsePointsFromLabels([
      { name: 'drips-wave: 30' },
      { name: 'drips-wave: 50' },
    ]);
    expect(result).toEqual({ points: 30, label: 'drips-wave: 30' });
  });

  it('handles large point values', () => {
    const result = parsePointsFromLabels([
      { name: 'drips-wave: 10000' },
    ]);
    expect(result).toEqual({ points: 10000, label: 'drips-wave: 10000' });
  });
});
