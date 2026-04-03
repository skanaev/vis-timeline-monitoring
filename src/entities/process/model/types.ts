import type { ProcessState } from '../../../shared/types/api';
import type {
  DelayState,
  TimelineColorVariant,
  TimelineEntityType,
} from '../../../shared/types/timeline';

export interface UiProcess {
  id: number;
  stageId: number;
  entityType: TimelineEntityType;
  name: string;
  state: ProcessState;
  scheduledStart: string | null;
  scheduledFinish: string | null;
  factStart: string | null;
  factFinish: string | null;
  plannedStartDate: Date | null;
  plannedFinishDate: Date | null;
  factStartDate: Date | null;
  factFinishDate: Date | null;
  newExecutionDate: Date | null;
  regulationDuration: string | null;
  factDuration: string | null;
  plannedDurationMinutes: number;
  factDurationMinutes: number;
  launchDelay: string | null;
  completionDelay: string | null;
  comment: string | null;
  exceedsSchedule: boolean;
  isDelayed: boolean;
  delayState: DelayState;
  colorVariant: TimelineColorVariant;
  organisationType: string | null;
  systemType: string | null;
  sentToSutp: boolean | null;
  branchId: number | null;
  unitId: number | null;
}

export interface ProcessSummaryViewModel {
  id: number;
  name: string;
  statusLabel: string;
  scheduledRangeLabel: string;
  factRangeLabel: string;
  delayLabel: string;
}

export interface ProcessDetailsViewModel {
  id: number;
  stageId: number;
  name: string;
  statusLabel: string;
  delayLabel: string;
  plannedRangeLabel: string;
  actualRangeLabel: string;
  regulationDurationLabel: string;
  factDurationLabel: string;
  launchDelayLabel: string;
  completionDelayLabel: string;
  commentLabel: string;
  organisationTypeLabel: string;
  systemTypeLabel: string;
  sentToSutpLabel: string;
  branchLabel: string;
  unitLabel: string;
  newExecutionDateLabel: string;
  isDelayed: boolean;
  exceedsSchedule: boolean;
}
