import { describe, expect, it } from 'vitest';
import { mapTimelineResponse } from '../../entities/stage/model/mappers';
import { buildTimelineItems } from '../lib/timeline/visTimeline';
import { getMockTimeline } from './mockTimeline';

describe('mock timeline scenarios', () => {
  it('includes warning and success cases for stages and processes', async () => {
    const response = await getMockTimeline('2026-04-02');
    const timelineData = mapTimelineResponse(response);
    const items = buildTimelineItems(timelineData, new Date('2026-04-02T23:59:59.000Z'));

    expect(timelineData.stages).toHaveLength(5);
    expect(items.find((item) => item.id === 'stage-4-actual')?.meta.colorVariant).toBe('warning');
    expect(items.find((item) => item.id === 'stage-5-actual')?.meta.colorVariant).toBe('success');
    expect(items.find((item) => item.id === 'process-401-actual')?.meta.colorVariant).toBe(
      'danger',
    );
    expect(items.find((item) => item.id === 'process-402-actual')?.meta.colorVariant).toBe(
      'success',
    );
    expect(items.find((item) => item.id === 'process-501-actual')?.meta.colorVariant).toBe(
      'success',
    );
  });
});
