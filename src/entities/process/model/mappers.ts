import { differenceInMinutes } from 'date-fns';
import { formatMinutesAsDuration, hhmmToMinutes } from '../../../shared/lib/date/duration';
import { parseIsoDate } from '../../../shared/lib/date/format';
import type {
  ApiReference,
  OrganisationTypeApiValue,
  ProcessApiModel,
  ProcessState,
} from '../../../shared/types/api';
import type { UiProcess } from './types';
import {
  getProcessColorVariant,
  getProcessDelayState,
  isProcessDelayed,
} from './selectors';

const PROCESS_STATE_ALIASES: Record<string, ProcessState> = {
  pending: 'not_started',
  not_started: 'not_started',
  waiting: 'not_started',
  planned: 'not_started',
  in_progress: 'in_progress',
  inprogress: 'in_progress',
  started: 'in_progress',
  completed: 'completed',
  done: 'completed',
  finished: 'completed',
  delayed: 'delayed',
  expired: 'delayed',
  overdue: 'delayed',
  paused: 'paused',
  cancelled: 'cancelled',
  canceled: 'cancelled',
  unknown: 'unknown',
};

const normalizeOptionalText = (value?: string | null): string | null => {
  const normalizedValue = value?.trim() ?? '';
  return normalizedValue.length > 0 ? normalizedValue : null;
};

const normalizeProcessState = (
  state: ProcessApiModel['state'] | string | null | undefined,
): ProcessState => {
  const normalizedState = String(state ?? '').trim();

  if (normalizedState.length === 0) {
    return 'unknown';
  }

  return PROCESS_STATE_ALIASES[normalizedState.toLowerCase()] ?? normalizedState;
};

const resolveApiReferenceLabel = (value?: string | ApiReference | null): string | null => {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return normalizeOptionalText(value);
  }

  const name = normalizeOptionalText(value.name);
  const code = normalizeOptionalText(value.code);

  if (name && code && code !== name) {
    return `${name} (${code})`;
  }

  return name ?? code ?? String(value.id);
};

const resolveOrganisationType = (value?: OrganisationTypeApiValue): string | null => {
  if (!Array.isArray(value)) {
    return normalizeOptionalText(value);
  }

  const normalizedItems = value
    .map((item) => {
      return typeof item === 'string' ? normalizeOptionalText(item) : resolveApiReferenceLabel(item);
    })
    .filter((item): item is string => item !== null);

  return normalizedItems.length > 0 ? normalizedItems.join(', ') : null;
};

const resolveDateTimeValue = (
  primary?: string | null,
  fallback?: string | null,
): string | null => {
  return primary ?? fallback ?? null;
};

const resolveDurationMinutes = (
  value: string | number | null | undefined,
  start: Date | null,
  finish: Date | null,
): number => {
  if (typeof value === 'string') {
    return hhmmToMinutes(value);
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const absoluteValue = Math.abs(value);

    if (absoluteValue >= 1000) {
      return Math.round(value / 60_000);
    }

    return Math.round(value);
  }

  if (start && finish) {
    return differenceInMinutes(finish, start);
  }

  return 0;
};

const resolveDurationLabel = (
  value: string | number | null | undefined,
  start: Date | null,
  finish: Date | null,
): string | null => {
  if (typeof value === 'string') {
    return normalizeOptionalText(value);
  }

  if ((typeof value === 'number' && Number.isFinite(value)) || (start && finish)) {
    return formatMinutesAsDuration(resolveDurationMinutes(value, start, finish));
  }

  return null;
};

const resolveDelayLabel = (planned: Date | null, actual: Date | null): string | null => {
  if (!planned || !actual) {
    return null;
  }

  return formatMinutesAsDuration(differenceInMinutes(actual, planned));
};

const resolveProcessId = (process: ProcessApiModel): number => {
  return process.id ?? process.processId ?? 0;
};

const resolveProcessName = (process: ProcessApiModel, processId: number): string => {
  return process.name ?? process.processName ?? `Процесс ${processId}`;
};

const inferProcessState = (process: ProcessApiModel): ProcessState => {
  const factFinish = resolveDateTimeValue(process.factFinish, process.factTimeFinish);
  const factStart = resolveDateTimeValue(process.factStart, process.factTimeStart);

  if (factFinish) {
    return Boolean(process.exceedsSchedule ?? process.isExpired) ? 'delayed' : 'completed';
  }

  if (factStart) {
    return 'in_progress';
  }

  return 'not_started';
};

const calculateProcessDelayed = (
  exceedsSchedule: boolean,
  launchDelay: string | null,
  completionDelay: string | null,
  normalizedState: ProcessState,
): boolean => {
  const launchDelayMinutes = hhmmToMinutes(launchDelay);
  const completionDelayMinutes = hhmmToMinutes(completionDelay);

  return (
    exceedsSchedule ||
    normalizedState === 'delayed' ||
    launchDelayMinutes > 0 ||
    completionDelayMinutes > 0
  );
};

export const mapProcessToUiModel = (
  process: ProcessApiModel,
  fallbackStageId: number,
): UiProcess => {
  const processId = resolveProcessId(process);
  const rawState =
    process.state ??
    process.processStatus?.code ??
    process.processStatus?.name ??
    null;
  const normalizedExplicitState = normalizeProcessState(rawState);
  const normalizedState =
    normalizedExplicitState === 'unknown'
      ? inferProcessState(process)
      : normalizedExplicitState;
  const scheduledStart = resolveDateTimeValue(
    process.scheduledStart,
    process.regulationDateTimeStart,
  );
  const scheduledFinish = resolveDateTimeValue(
    process.scheduledFinish,
    process.regulationDateTimeFinish,
  );
  const factStart = resolveDateTimeValue(process.factStart, process.factTimeStart);
  const factFinish = resolveDateTimeValue(process.factFinish, process.factTimeFinish);
  const newExecutionDateValue = process.newExecutionDate ?? null;
  const plannedStartDate = parseIsoDate(scheduledStart);
  const plannedFinishDate = parseIsoDate(scheduledFinish);
  const factStartDate = parseIsoDate(factStart);
  const factFinishDate = parseIsoDate(factFinish);
  const newExecutionDate = parseIsoDate(newExecutionDateValue);
  const regulationDurationValue = process.regulationDuration ?? process.regDuration ?? null;
  const factDurationValue = process.factDuration ?? null;
  const regulationDuration = resolveDurationLabel(
    regulationDurationValue,
    plannedStartDate,
    plannedFinishDate,
  );
  const factDuration = resolveDurationLabel(factDurationValue, factStartDate, factFinishDate);
  const plannedDurationMinutes = resolveDurationMinutes(
    regulationDurationValue,
    plannedStartDate,
    plannedFinishDate,
  );
  const factDurationMinutes = resolveDurationMinutes(
    factDurationValue,
    factStartDate,
    factFinishDate,
  );
  const launchDelay = process.launchDelay ?? resolveDelayLabel(plannedStartDate, factStartDate);
  const completionDelay =
    process.completionDelay ?? resolveDelayLabel(plannedFinishDate, factFinishDate);
  const exceedsSchedule =
    Boolean(process.exceedsSchedule ?? process.isExpired) ||
    hhmmToMinutes(completionDelay) > 0;
  const isDelayed = calculateProcessDelayed(
    exceedsSchedule,
    launchDelay,
    completionDelay,
    normalizedState,
  );

  const uiProcess: UiProcess = {
    id: processId,
    stageId: process.stageId ?? fallbackStageId,
    entityType: 'process',
    name: resolveProcessName(process, processId),
    state: normalizedState,
    scheduledStart,
    scheduledFinish,
    factStart,
    factFinish,
    plannedStartDate,
    plannedFinishDate,
    factStartDate,
    factFinishDate,
    newExecutionDate,
    regulationDuration,
    factDuration,
    plannedDurationMinutes,
    factDurationMinutes,
    launchDelay,
    completionDelay,
    comment: normalizeOptionalText(process.comment ?? process.commentFinish),
    exceedsSchedule,
    isDelayed,
    delayState: getProcessDelayState(isDelayed, Boolean(plannedStartDate && plannedFinishDate)),
    colorVariant: 'default',
    organisationType: resolveOrganisationType(
      process.organisationType ?? process.organizationTypes ?? null,
    ),
    systemType: resolveApiReferenceLabel(process.systemType),
    sentToSutp: process.sentToSutp ?? process.isSentToSutp ?? null,
    branchId: process.branchId ?? process.branch?.id ?? null,
    unitId: process.unitId ?? process.unit?.id ?? null,
  };

  return {
    ...uiProcess,
    isDelayed: isProcessDelayed(uiProcess),
    colorVariant: getProcessColorVariant(uiProcess),
  };
};
