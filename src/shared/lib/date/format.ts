import { format, isValid, parse, parseISO } from 'date-fns';

const EMPTY_VALUE = '—';

const toValidDate = (value?: string | Date | null): Date | null => {
  if (!value) {
    return null;
  }

  const parsedDate = value instanceof Date ? value : parseISO(value);

  return isValid(parsedDate) ? parsedDate : null;
};

export const parseIsoDate = (value?: string | null): Date | null => {
  return toValidDate(value);
};

export const formatTime = (value?: string | Date | null, fallback = EMPTY_VALUE): string => {
  const parsedDate = toValidDate(value);

  return parsedDate ? format(parsedDate, 'HH:mm') : fallback;
};

export const formatDateTime = (value?: string | Date | null, fallback = EMPTY_VALUE): string => {
  const parsedDate = toValidDate(value);

  return parsedDate ? format(parsedDate, 'dd.MM.yyyy HH:mm') : fallback;
};

export const formatOptionalValue = (
  value?: string | number | boolean | null,
  fallback = EMPTY_VALUE,
): string => {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === 'boolean') {
    return value ? 'Да' : 'Нет';
  }

  const stringValue = String(value).trim();
  return stringValue.length > 0 ? stringValue : fallback;
};

export const formatPercent = (value: number, fractionDigits = 0): string => {
  if (!Number.isFinite(value)) {
    return EMPTY_VALUE;
  }

  return `${value.toFixed(fractionDigits)}%`;
};

export const formatDateTimeInput = (value?: string | Date | null): string => {
  const parsedDate = toValidDate(value);

  return parsedDate ? format(parsedDate, "yyyy-MM-dd'T'HH:mm") : '';
};

export const parseDateTimeInput = (value: string): string | null => {
  if (!value.trim()) {
    return null;
  }

  const parsedDate = parse(value, "yyyy-MM-dd'T'HH:mm", new Date());
  return isValid(parsedDate) ? parsedDate.toISOString() : null;
};
