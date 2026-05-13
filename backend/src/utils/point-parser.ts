import { ValidationError } from './errors.js';

const POINT_LABEL_REGEX = /^drips-wave:\s*(\d+)$/i;

export interface PointParseResult {
  points: number;
  label: string;
}

export function parsePointsFromLabels(
  labels: Array<{ name: string }>,
): PointParseResult {
  if (!labels || labels.length === 0) {
    throw new ValidationError('No labels found on pull request');
  }

  for (const label of labels) {
    const match = label.name.match(POINT_LABEL_REGEX);
    if (match) {
      const points = parseInt(match[1]!, 10);
      if (points <= 0) {
        throw new ValidationError(
          `Invalid point value in label "${label.name}": must be positive`,
        );
      }
      return { points, label: label.name };
    }
  }

  throw new ValidationError(
    'No "drips-wave: <points>" label found on pull request',
  );
}
