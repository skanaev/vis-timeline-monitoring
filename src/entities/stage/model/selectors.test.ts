import { describe, expect, it } from 'vitest';
import { mapTimelineResponse } from './mappers';
import {
  getStageFactFinish,
  getStageFactStart,
  getStageProgress,
  getStageScheduledFinish,
  getStageScheduledStart,
  isStageDelayed,
} from './selectors';
import { createTimelineResponseFixture } from '../../../test/fixtures/timeline';

describe('stage selectors', () => {
  it('calculates stage bounds and progress from process data', () => {
    const response = createTimelineResponseFixture();
    const timelineData = mapTimelineResponse(response);
    const firstStage = timelineData.stages[0];

    expect(getStageScheduledStart(firstStage.processes)?.toISOString()).toBe(
      '2026-04-02T06:00:00.000Z',
    );
    expect(getStageScheduledFinish(firstStage.processes)?.toISOString()).toBe(
      '2026-04-02T10:00:00.000Z',
    );
    expect(getStageFactStart(firstStage.processes)?.toISOString()).toBe(
      '2026-04-02T06:15:00.000Z',
    );
    expect(getStageFactFinish(firstStage.processes)?.toISOString()).toBe(
      '2026-04-02T07:45:00.000Z',
    );
    expect(getStageProgress(firstStage.processes)).toBe(38);
  });

  it('marks stage as delayed when a process exceeds schedule', () => {
    const response = createTimelineResponseFixture();
    const timelineData = mapTimelineResponse(response);
    const secondStage = timelineData.stages[1];

    expect(
      isStageDelayed(
        secondStage.processes,
        secondStage.calculatedFactFinish,
        secondStage.calculatedScheduledFinish,
      ),
    ).toBe(true);
  });
});
