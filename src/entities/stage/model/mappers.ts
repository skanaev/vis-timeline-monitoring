import { minutesToPercent } from '../../../shared/lib/date/duration';
import { parseIsoDate } from '../../../shared/lib/date/format';
import type { StageApiModel, TimelineResponse } from '../../../shared/types/api';
import type { UiTimelineData } from '../../../shared/types/ui';
import { mapProcessToUiModel } from '../../process/model/mappers';
import type { UiStage } from './types';
import {
  getStageColorVariant,
  getStageDelayState,
  getStageFactFinish,
  getStageFactStart,
  getStageProgress,
  getStageScheduledFinish,
  getStageScheduledStart,
  isStageDelayed,
} from './selectors';

const resolveStageId = (stage: StageApiModel): number => {
  return stage.id ?? stage.stageId ?? 0;
};

const resolveStageName = (stage: StageApiModel, stageId: number): string => {
  return stage.name ?? stage.stageName ?? `Этап ${stageId}`;
};

const resolveStageSortPriority = (stage: StageApiModel, stageId: number): number => {
  return stage.sortPriority ?? stageId;
};

const resolveStageScheduledStartValue = (stage: StageApiModel): string | null => {
  return stage.scheduledStart ?? stage.regulationStageTimeStart ?? null;
};

const resolveStageScheduledFinishValue = (stage: StageApiModel): string | null => {
  return stage.scheduledFinish ?? stage.regulationStageTimeFinish ?? null;
};

const resolveStageFactStartValue = (stage: StageApiModel): string | null => {
  return stage.factStageTimeStart ?? null;
};

const resolveStageFactFinishValue = (stage: StageApiModel): string | null => {
  return stage.factStageTimeFinish ?? null;
};

const resolveDurationMinutes = (value: string | number | null | undefined): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const absoluteValue = Math.abs(value);

    if (absoluteValue >= 1000) {
      return Math.round(value / 60_000);
    }

    return Math.round(value);
  }

  return 0;
};

export const mapStageToUiModel = (stage: StageApiModel): UiStage => {
  const stageId = resolveStageId(stage);
  const stageProcesses = [...stage.processes].sort((left, right) => {
    const leftPriority = left.sortPriority ?? left.processId ?? left.id ?? 0;
    const rightPriority = right.sortPriority ?? right.processId ?? right.id ?? 0;

    return leftPriority - rightPriority;
  });
  const processes = stageProcesses.map((process) => mapProcessToUiModel(process, stageId));
  const backendScheduledStart = parseIsoDate(resolveStageScheduledStartValue(stage));
  const backendScheduledFinish = parseIsoDate(resolveStageScheduledFinishValue(stage));
  const backendFactStart = parseIsoDate(resolveStageFactStartValue(stage));
  const backendFactFinish = parseIsoDate(resolveStageFactFinishValue(stage));
  const calculatedScheduledStart = backendScheduledStart ?? getStageScheduledStart(processes);
  const calculatedScheduledFinish = backendScheduledFinish ?? getStageScheduledFinish(processes);
  const calculatedFactStart = backendFactStart ?? getStageFactStart(processes);
  const calculatedFactFinish = backendFactFinish ?? getStageFactFinish(processes);
  const delayState = getStageDelayState(processes, calculatedFactFinish, calculatedScheduledFinish);
  const backendRegDurationMinutes = resolveDurationMinutes(stage.regDuration);
  const backendFactDurationMinutes = resolveDurationMinutes(stage.factDuration);
  const calculatedProgressPercent =
    typeof stage.progressPercent === 'number' && Number.isFinite(stage.progressPercent)
      ? stage.progressPercent
      : backendRegDurationMinutes > 0
        ? Math.round(minutesToPercent(backendFactDurationMinutes, backendRegDurationMinutes))
        : getStageProgress(processes);

  const uiStage: UiStage = {
    id: stageId,
    entityType: 'stage',
    name: resolveStageName(stage, stageId),
    processes,
    calculatedScheduledStart,
    calculatedScheduledFinish,
    calculatedFactStart,
    calculatedFactFinish,
    calculatedExceedsSchedule: isStageDelayed(
      processes,
      calculatedFactFinish,
      calculatedScheduledFinish,
    ),
    calculatedProgressPercent,
    delayState,
    colorVariant: 'default',
  };

  return {
    ...uiStage,
    colorVariant: getStageColorVariant(uiStage),
  };
};

export const mapTimelineResponse = (response: TimelineResponse): UiTimelineData => {
  const stages = [...response.stages].sort((left, right) => {
    return (
      resolveStageSortPriority(left, resolveStageId(left)) -
      resolveStageSortPriority(right, resolveStageId(right))
    );
  });

  return {
    businessDate: response.businessDate ?? response.date ?? '',
    generatedAt: parseIsoDate(response.generatedAt ?? null),
    stages: stages.map(mapStageToUiModel),
  };
};
