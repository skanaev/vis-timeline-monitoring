import type { UiStage } from '../../entities/stage/model/types';

export interface UiTimelineData {
  businessDate: string;
  generatedAt: Date | null;
  stages: UiStage[];
}
