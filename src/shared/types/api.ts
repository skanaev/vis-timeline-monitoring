export type BackendDateTimeString = string;

export type KnownProcessState =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'delayed'
  | 'paused'
  | 'cancelled'
  | 'unknown'
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'DELAYED'
  | 'PAUSED'
  | 'CANCELLED'
  | 'UNKNOWN';

export type ProcessState = KnownProcessState | (string & {});

export interface ApiReference {
  id: number;
  name: string;
  code: string;
}

export interface DepartmentApiModel extends ApiReference {}

export interface UnitApiModel extends ApiReference {
  department?: DepartmentApiModel | null;
}

export interface StartConditionApiModel {
  startTypeCode?: string | null;
  systemCode?: string | null;
  startEventId?: number | null;
  stageId?: number | null;
  processId?: number | null;
}

export interface FinishEventApiModel {
  id: number;
  description?: string | null;
  eventCode?: string | null;
  processCode?: string | null;
  system?: ApiReference | null;
}

export interface ProcessStatusApiModel {
  name?: string | null;
  code?: string | null;
}

export type OrganisationTypeApiValue = string | string[] | ApiReference[] | null;

export interface ProcessApiModel {
  id?: number;
  processId?: number;
  stageId?: number | null;
  name?: string;
  processName?: string;
  state?: ProcessState | null;
  processStatus?: ProcessStatusApiModel | null;
  scheduledStart?: BackendDateTimeString | null;
  scheduledFinish?: BackendDateTimeString | null;
  regulationDateTimeStart?: BackendDateTimeString | null;
  regulationDateTimeFinish?: BackendDateTimeString | null;
  factStart?: BackendDateTimeString | null;
  factFinish?: BackendDateTimeString | null;
  factTimeStart?: BackendDateTimeString | null;
  factTimeFinish?: BackendDateTimeString | null;
  regulationDuration?: string | number | null;
  regDuration?: string | number | null;
  factDuration?: string | number | null;
  deltaDuration?: string | number | null;
  launchDelay?: string | null;
  completionDelay?: string | null;
  comment?: string | null;
  commentFinish?: string | null;
  exceedsSchedule?: boolean | null;
  isExpired?: boolean | null;
  organisationType?: OrganisationTypeApiValue;
  organizationTypes?: ApiReference[] | null;
  systemType?: string | ApiReference | null;
  accomplishmentType?: ApiReference | null;
  sentToSutp?: boolean | null;
  isSentToSutp?: boolean | null;
  signal?: ApiReference | null;
  manualCompletionAllowed?: boolean | null;
  branchId?: number | null;
  branch?: ApiReference | null;
  unitId?: number | null;
  unit?: UnitApiModel | null;
  startConditions?: StartConditionApiModel[] | null;
  finishEvent?: FinishEventApiModel | null;
  sortPriority?: number | null;
  newExecutionDate?: BackendDateTimeString | null;
}

export interface StageApiModel {
  id?: number;
  stageId?: number;
  name?: string;
  stageName?: string;
  scheduledStart?: BackendDateTimeString | null;
  scheduledFinish?: BackendDateTimeString | null;
  regulationStageTimeStart?: BackendDateTimeString | null;
  regulationStageTimeFinish?: BackendDateTimeString | null;
  factStageTimeStart?: BackendDateTimeString | null;
  factStageTimeFinish?: BackendDateTimeString | null;
  progressPercent?: number | null;
  regDuration?: string | number | null;
  factDuration?: string | number | null;
  deltaDuration?: string | number | null;
  sortPriority?: number | null;
  processes: ProcessApiModel[];
}

export interface TimelineResponse {
  businessDate?: string;
  date?: string;
  generatedAt?: BackendDateTimeString | null;
  stages: StageApiModel[];
}

export interface UpdateProcessCommentRequest {
  processId: number;
  comment: string;
}

export interface UpdateProcessExecutionDateRequest {
  processId: number;
  executionDate: string | null;
}
