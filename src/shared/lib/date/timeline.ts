import { addHours, isAfter, isBefore } from 'date-fns';
import { TIMELINE_WINDOW_PADDING_HOURS } from '../../config/timeline';

export interface SafeDateRange {
  start: Date;
  end: Date;
}

export const getMinDate = (values: Array<Date | null | undefined>): Date | null => {
  const validDates = values.filter((value): value is Date => value instanceof Date);

  if (validDates.length === 0) {
    return null;
  }

  return validDates.reduce((currentMin, value) => (isBefore(value, currentMin) ? value : currentMin));
};

export const getMaxDate = (values: Array<Date | null | undefined>): Date | null => {
  const validDates = values.filter((value): value is Date => value instanceof Date);

  if (validDates.length === 0) {
    return null;
  }

  return validDates.reduce((currentMax, value) => (isAfter(value, currentMax) ? value : currentMax));
};

export const isDateAfter = (left: Date | null, right: Date | null): boolean => {
  if (!left || !right) {
    return false;
  }

  return isAfter(left, right);
};

export const withTimelinePadding = (range: SafeDateRange): SafeDateRange => {
  return {
    start: addHours(range.start, -TIMELINE_WINDOW_PADDING_HOURS),
    end: addHours(range.end, TIMELINE_WINDOW_PADDING_HOURS),
  };
};

export const createSafeDateRange = (
  start: Date | null,
  end: Date | null,
): SafeDateRange | null => {
  if (!start || !end) {
    return null;
  }

  if (isAfter(start, end)) {
    return {
      start: end,
      end: start,
    };
  }

  return { start, end };
};

export const resolveFactFinish = (
  factStart: Date | null,
  factFinish: Date | null,
  now: Date,
): Date | null => {
  if (!factStart) {
    return null;
  }

  if (factFinish) {
    return factFinish;
  }

  return now;
};
