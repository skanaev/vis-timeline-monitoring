import { formatDateTime, formatOptionalValue } from '../../../shared/lib/date/format';
import { resolveFactFinish } from '../../../shared/lib/date/timeline';
import type { ProcessState } from '../../../shared/types/api';
import type { DelayState, SelectedItemState, TimelineColorVariant } from '../../../shared/types/timeline';
import type { UiStage } from '../../stage/model/types';
import type { ProcessDetailsViewModel, ProcessSummaryViewModel, UiProcess } from './types';

const PROCESS_STATUS_LABELS: Record<string, string> = {
  not_started: 'Не начат',
  in_progress: 'В работе',
  completed: 'Завершён',
  delayed: 'С задержкой',
  paused: 'Пауза',
  cancelled: 'Отменён',
  unknown: 'Неизвестно',
};

export const getProcessStatusLabel = (state: ProcessState): string => {
  const normalizedState = String(state).trim();
  return PROCESS_STATUS_LABELS[normalizedState] ?? normalizedState;
};

export const isInProgressWithoutFinish = (
  process: Pick<UiProcess, 'factStartDate' | 'factFinishDate'>,
): boolean => {
  return Boolean(process.factStartDate && !process.factFinishDate);
};

export const hasFactRange = (
  process: Pick<UiProcess, 'factStartDate' | 'factFinishDate'>,
  now: Date,
): boolean => {
  return Boolean(resolveFactFinish(process.factStartDate, process.factFinishDate, now));
};

export const getProcessDelayState = (
  isDelayed: boolean,
  hasPlannedRange: boolean,
): DelayState => {
  if (isDelayed) {
    return 'delayed';
  }

  if (hasPlannedRange) {
    return 'on-time';
  }

  return 'unknown';
};

export const resolveProcessColorVariant = (
  state: ProcessState,
  isDelayed: boolean,
  exceedsSchedule: boolean,
): TimelineColorVariant => {
  if (isDelayed || exceedsSchedule) {
    return 'danger';
  }

  if (state === 'completed') {
    return 'success';
  }

  if (state === 'in_progress') {
    return 'warning';
  }

  return 'default';
};

export const isProcessDelayed = (process: UiProcess): boolean => {
  return process.isDelayed;
};

export const getProcessColorVariant = (process: UiProcess): TimelineColorVariant => {
  return resolveProcessColorVariant(process.state, process.isDelayed, process.exceedsSchedule);
};

export const getProcessActualStart = (process: UiProcess): Date | null => {
  return process.factStartDate;
};

export const getProcessActualFinish = (process: UiProcess, now: Date): Date | null => {
  return resolveFactFinish(process.factStartDate, process.factFinishDate, now);
};

export const findSelectedProcess = (
  stages: UiStage[],
  selected: SelectedItemState | null,
): UiProcess | null => {
  if (!selected || selected.entityType !== 'process') {
    return null;
  }

  for (const stage of stages) {
    const process = stage.processes.find((stageProcess) => stageProcess.id === selected.entityId);

    if (process) {
      return process;
    }
  }

  return null;
};

const getDelayLabel = (process: UiProcess): string => {
  if (!process.isDelayed) {
    return 'Без отклонения';
  }

  const launchDelayLabel = formatOptionalValue(process.launchDelay, '');
  const completionDelayLabel = formatOptionalValue(process.completionDelay, '');
  const labels = [launchDelayLabel, completionDelayLabel].filter((value) => value.length > 0);

  return labels.length > 0 ? labels.join(' / ') : 'Есть отклонение';
};

export const getProcessSummaryViewModel = (process: UiProcess): ProcessSummaryViewModel => {
  return {
    id: process.id,
    name: process.name,
    statusLabel: getProcessStatusLabel(process.state),
    scheduledRangeLabel: `${formatDateTime(process.plannedStartDate)} - ${formatDateTime(
      process.plannedFinishDate,
    )}`,
    factRangeLabel: `${formatDateTime(process.factStartDate)} - ${formatDateTime(
      process.factFinishDate,
    )}`,
    delayLabel: getDelayLabel(process),
  };
};

export const getProcessDetailsViewModel = (process: UiProcess): ProcessDetailsViewModel => {
  return {
    id: process.id,
    stageId: process.stageId,
    name: process.name,
    statusLabel: getProcessStatusLabel(process.state),
    delayLabel: getDelayLabel(process),
    plannedRangeLabel: `${formatDateTime(process.plannedStartDate)} - ${formatDateTime(
      process.plannedFinishDate,
    )}`,
    actualRangeLabel: `${formatDateTime(process.factStartDate)} - ${formatDateTime(
      process.factFinishDate,
    )}`,
    regulationDurationLabel: formatOptionalValue(process.regulationDuration),
    factDurationLabel: formatOptionalValue(process.factDuration),
    launchDelayLabel: formatOptionalValue(process.launchDelay),
    completionDelayLabel: formatOptionalValue(process.completionDelay),
    commentLabel: formatOptionalValue(process.comment),
    organisationTypeLabel: formatOptionalValue(process.organisationType),
    systemTypeLabel: formatOptionalValue(process.systemType),
    sentToSutpLabel: formatOptionalValue(process.sentToSutp),
    branchLabel: formatOptionalValue(process.branchId),
    unitLabel: formatOptionalValue(process.unitId),
    newExecutionDateLabel: formatDateTime(process.newExecutionDate),
    isDelayed: process.isDelayed,
    exceedsSchedule: process.exceedsSchedule,
  };
};
