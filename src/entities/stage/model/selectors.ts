import { minutesToPercent, sumMinutes } from '../../../shared/lib/date/duration';
import { formatDateTime, formatPercent } from '../../../shared/lib/date/format';
import { getMaxDate, getMinDate, isDateAfter } from '../../../shared/lib/date/timeline';
import type { DelayState, SelectedItemState, TimelineColorVariant } from '../../../shared/types/timeline';
import {
  getProcessSummaryViewModel,
  isInProgressWithoutFinish,
} from '../../process/model/selectors';
import type { UiProcess } from '../../process/model/types';
import type { StageDetailsViewModel, UiStage } from './types';

export const getStageScheduledStart = (processes: UiProcess[]): Date | null => {
  return getMinDate(processes.map((process) => process.plannedStartDate));
};

export const getStageScheduledFinish = (processes: UiProcess[]): Date | null => {
  return getMaxDate(processes.map((process) => process.plannedFinishDate));
};

export const getStageFactStart = (processes: UiProcess[]): Date | null => {
  return getMinDate(processes.map((process) => process.factStartDate));
};

export const getStageFactFinish = (processes: UiProcess[]): Date | null => {
  return getMaxDate(processes.map((process) => process.factFinishDate));
};

export const getStageProgressStart = (processes: UiProcess[]): Date | null => {
  return getMinDate(
    processes
      .filter((process) => process.factFinishDate)
      .map((process) => process.factStartDate),
  );
};

export const getStageProgressFinish = (processes: UiProcess[]): Date | null => {
  return getMaxDate(
    processes
      .filter((process) => process.factFinishDate)
      .map((process) => process.factFinishDate),
  );
};

export const getStageProgress = (processes: UiProcess[]): number => {
  const totalPlannedMinutes = sumMinutes(processes.map((process) => process.plannedDurationMinutes));
  const totalFactMinutes = sumMinutes(processes.map((process) => process.factDurationMinutes));

  return Math.round(minutesToPercent(totalFactMinutes, totalPlannedMinutes));
};

export const isStageDelayed = (
  processes: UiProcess[],
  calculatedFactFinish: Date | null,
  calculatedScheduledFinish: Date | null,
): boolean => {
  return (
    processes.some((process) => process.isDelayed || process.exceedsSchedule) ||
    isDateAfter(calculatedFactFinish, calculatedScheduledFinish)
  );
};

export const getStageDelayState = (
  processes: UiProcess[],
  calculatedFactFinish: Date | null,
  calculatedScheduledFinish: Date | null,
): DelayState => {
  if (isStageDelayed(processes, calculatedFactFinish, calculatedScheduledFinish)) {
    return 'delayed';
  }

  if (calculatedScheduledFinish) {
    return 'on-time';
  }

  return 'unknown';
};

export const resolveStageColorVariant = (
  delayState: DelayState,
  progressPercent: number,
  hasStarted: boolean,
): TimelineColorVariant => {
  if (delayState === 'delayed') {
    return 'danger';
  }

  if (progressPercent >= 100) {
    return 'success';
  }

  if (hasStarted) {
    return 'warning';
  }

  return 'default';
};

export const getStageColorVariant = (stage: UiStage): TimelineColorVariant => {
  return resolveStageColorVariant(
    stage.delayState,
    stage.calculatedProgressPercent,
    Boolean(stage.calculatedFactStart),
  );
};

export const getStageTimelineFactFinish = (stage: UiStage, now: Date): Date | null => {
  const hasOpenProcess = stage.processes.some((process) => isInProgressWithoutFinish(process));

  if (hasOpenProcess && stage.calculatedFactStart) {
    return now;
  }

  return stage.calculatedFactFinish;
};

export const findSelectedStage = (
  stages: UiStage[],
  selected: SelectedItemState | null,
): UiStage | null => {
  if (!selected || selected.entityType !== 'stage') {
    return null;
  }

  return stages.find((stage) => stage.id === selected.entityId) ?? null;
};

export const getStageDetailsViewModel = (stage: UiStage): StageDetailsViewModel => {
  return {
    id: stage.id,
    name: stage.name,
    plannedRangeLabel: `${formatDateTime(stage.calculatedScheduledStart)} - ${formatDateTime(
      stage.calculatedScheduledFinish,
    )}`,
    actualRangeLabel: `${formatDateTime(stage.calculatedFactStart)} - ${formatDateTime(
      stage.calculatedFactFinish,
    )}`,
    progressLabel: formatPercent(stage.calculatedProgressPercent),
    delayLabel: stage.delayState === 'delayed' ? 'Есть отклонение' : 'Без отклонения',
    processCountLabel: `${stage.processes.length}`,
    processes: stage.processes.map(getProcessSummaryViewModel),
    calculatedExceedsSchedule: stage.calculatedExceedsSchedule,
  };
};
