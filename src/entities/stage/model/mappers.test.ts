import { describe, expect, it } from 'vitest';
import { mapTimelineResponse } from './mappers';
import { createTimelineResponseFixture } from '../../../test/fixtures/timeline';

describe('timeline mapper', () => {
  it('maps backend response to typed ui timeline data', () => {
    const response = createTimelineResponseFixture();
    const timelineData = mapTimelineResponse(response);

    expect(timelineData.businessDate).toBe('2026-04-02');
    expect(timelineData.generatedAt?.toISOString()).toBe('2026-04-02T09:00:00.000Z');
    expect(timelineData.stages).toHaveLength(2);
    expect(timelineData.stages[0].processes[0].plannedDurationMinutes).toBe(120);
    expect(timelineData.stages[1].calculatedExceedsSchedule).toBe(true);
    expect(timelineData.stages[0].name).toBe('Этап подготовки');
    expect(timelineData.stages[0].processes[0].organisationType).toBe('Внутренний (INNER)');
    expect(timelineData.stages[0].processes[0].state).toBe('completed');
    expect(timelineData.stages[0].processes[1].state).toBe('in_progress');
  });
});
