import type { DelayState, TimelineColorVariant, TimelineEntityType } from '../../../shared/types/timeline';
import type { UiProcess, ProcessSummaryViewModel } from '../../process/model/types';

export interface UiStage {
  id: number;
  entityType: TimelineEntityType;
  name: string;
  processes: UiProcess[];
  calculatedScheduledStart: Date | null;
  calculatedScheduledFinish: Date | null;
  calculatedFactStart: Date | null;
  calculatedFactFinish: Date | null;
  calculatedExceedsSchedule: boolean;
  calculatedProgressPercent: number;
  delayState: DelayState;
  colorVariant: TimelineColorVariant;
}

export interface StageDetailsViewModel {
  id: number;
  name: string;
  plannedRangeLabel: string;
  actualRangeLabel: string;
  progressLabel: string;
  delayLabel: string;
  processCountLabel: string;
  processes: ProcessSummaryViewModel[];
  calculatedExceedsSchedule: boolean;
}
