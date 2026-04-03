const HHMM_PATTERN = /^(-)?(\d{1,2}):(\d{2})$/;

export const hhmmToMinutes = (value?: string | null): number => {
  if (!value) {
    return 0;
  }

  const match = value.trim().match(HHMM_PATTERN);

  if (!match) {
    return 0;
  }

  const [, minusSign, hoursPart, minutesPart] = match;
  const hours = Number(hoursPart);
  const minutes = Number(minutesPart);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return 0;
  }

  const totalMinutes = hours * 60 + minutes;
  return minusSign ? totalMinutes * -1 : totalMinutes;
};

export const minutesToPercent = (value: number, total: number): number => {
  if (!Number.isFinite(value) || !Number.isFinite(total) || total <= 0) {
    return 0;
  }

  return Math.max(0, (value / total) * 100);
};

export const sumMinutes = (values: Array<number | null | undefined>): number => {
  return values.reduce<number>((accumulator, currentValue) => {
    return accumulator + (currentValue ?? 0);
  }, 0);
};

export const formatMinutesAsDuration = (minutes?: number | null): string => {
  if (minutes === null || minutes === undefined || !Number.isFinite(minutes)) {
    return '—';
  }

  const absoluteMinutes = Math.abs(Math.round(minutes));
  const sign = minutes < 0 ? '-' : '';
  const hours = Math.floor(absoluteMinutes / 60);
  const restMinutes = absoluteMinutes % 60;

  return `${sign}${String(hours).padStart(2, '0')}:${String(restMinutes).padStart(2, '0')}`;
};
