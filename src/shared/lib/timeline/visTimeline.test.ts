import { DataSet } from 'vis-data/esnext';
import { describe, expect, it } from 'vitest';
import { mapTimelineResponse } from '../../../entities/stage/model/mappers';
import type { TimelineResponse } from '../../types/api';
import { createTimelineResponseFixture } from '../../../test/fixtures/timeline';
import {
  buildTimelineGroups,
  buildTimelineItems,
  buildTimelineSelection,
  getTimelineOptions,
  getTimelineWindow,
  parseTimelineSelection,
  parseTimelineSelectEvent,
  syncTimelineDataSet,
} from './visTimeline';

describe('vis timeline adapter', () => {
  it('builds stable groups and separate planned/actual items', () => {
    const timelineData = mapTimelineResponse(createTimelineResponseFixture());
    const now = new Date('2026-04-02T09:30:00.000Z');
    const groups = buildTimelineGroups(timelineData);
    const items = buildTimelineItems(timelineData, now);

    expect(groups.map((group) => group.id)).toEqual([
      'stage-1',
      'process-101',
      'process-102',
      'stage-2',
      'process-201',
    ]);
    expect(groups[0]?.showNested).toBe(false);
    expect(items.some((item) => item.id === 'process-101-planned')).toBe(true);
    expect(items.some((item) => item.id === 'process-101-actual')).toBe(true);
    expect(items.some((item) => item.id === 'stage-1-planned')).toBe(true);
    expect(items.some((item) => item.id === 'stage-1-actual')).toBe(true);
  });

  it('parses timeline click payload back to selected item state', () => {
    const timelineData = mapTimelineResponse(createTimelineResponseFixture());
    const items = buildTimelineItems(timelineData, new Date('2026-04-02T09:30:00.000Z'));
    const selection = parseTimelineSelection(
      {
        what: 'item',
        item: 'process-101-planned',
      },
      items,
    );

    expect(selection).toEqual({
      entityType: 'process',
      entityId: 101,
    });
    expect(
      buildTimelineSelection(
        {
          entityType: 'stage',
          entityId: 1,
        },
        items,
      ),
    ).toEqual(['stage-1-planned', 'stage-1-actual']);
  });

  it('parses timeline select payload back to selected item state', () => {
    const timelineData = mapTimelineResponse(createTimelineResponseFixture());
    const items = buildTimelineItems(timelineData, new Date('2026-04-02T09:30:00.000Z'));

    expect(
      parseTimelineSelectEvent(
        {
          items: ['stage-1-actual'],
        },
        items,
      ),
    ).toEqual({
      entityType: 'stage',
      entityId: 1,
    });
  });

  it('builds padded timeline window around items', () => {
    const timelineData = mapTimelineResponse(createTimelineResponseFixture());
    const window = getTimelineWindow(timelineData, new Date('2026-04-02T09:30:00.000Z'));

    expect(window.start.toISOString()).toBe('2026-04-02T04:00:00.000Z');
    expect(window.end.toISOString()).toBe('2026-04-02T14:30:00.000Z');
  });

  it('includes current time in the window for the current business day', () => {
    const timelineData = mapTimelineResponse(createTimelineResponseFixture());
    const window = getTimelineWindow(timelineData, new Date('2026-04-02T01:30:00.000Z'));

    expect(window.start.toISOString()).toBe('2026-04-01T23:30:00.000Z');
    expect(window.end.toISOString()).toBe('2026-04-02T14:30:00.000Z');
  });

  it('configures the timeline axis with russian locale', () => {
    const options = getTimelineOptions({
      start: new Date('2026-04-02T04:00:00.000Z'),
      end: new Date('2026-04-02T14:30:00.000Z'),
    });
    const majorLabelFormatter = options.format?.majorLabels;
    const minorLabelFormatter = options.format?.minorLabels;

    expect(typeof majorLabelFormatter).toBe('function');
    expect(typeof minorLabelFormatter).toBe('function');
    expect(options.moment).toBeUndefined();
    expect(options.showCurrentTime).toBe(true);

    if (
      typeof majorLabelFormatter !== 'function' ||
      typeof minorLabelFormatter !== 'function'
    ) {
      throw new Error('Timeline format functions are not configured.');
    }

    expect(majorLabelFormatter(new Date('2026-04-02T12:00:00.000Z'), 'hour', 1)).toBe(
      'Чт, 2 апреля',
    );
    expect(minorLabelFormatter(new Date('2026-04-02T12:00:00.000Z'), 'day', 1)).toBe('2 апр');
  });

  it('builds stage progress only up to the last finished process', () => {
    const timelineData = mapTimelineResponse(createTimelineResponseFixture());
    const items = buildTimelineItems(timelineData, new Date('2026-04-02T09:30:00.000Z'));
    const stageActualItem = items.find((item) => item.id === 'stage-1-actual');

    expect(stageActualItem?.start.toISOString()).toBe('2026-04-02T06:15:00.000Z');
    expect(stageActualItem?.end?.toISOString()).toBe('2026-04-02T07:45:00.000Z');
    expect(stageActualItem?.meta.colorVariant).toBe('default');
    expect(items.find((item) => item.id === 'process-102-actual')?.meta.colorVariant).toBe(
      'active',
    );
    expect(items.find((item) => item.id === 'stage-2-actual')?.meta.colorVariant).toBe('danger');
  });

  it('shows active stage progress when a stage has started but no process is finished yet', () => {
    const response: TimelineResponse = {
      businessDate: '2026-04-02',
      generatedAt: '2026-04-02T09:00:00.000Z',
      stages: [
        {
          id: 10,
          name: 'Активный этап',
          processes: [
            {
              id: 1001,
              stageId: 10,
              name: 'Активный процесс',
              state: 'in_progress',
              scheduledStart: '2026-04-02T09:00:00.000Z',
              scheduledFinish: '2026-04-02T11:00:00.000Z',
              factStart: '2026-04-02T09:15:00.000Z',
              factFinish: null,
              regulationDuration: '02:00',
              factDuration: null,
              launchDelay: '00:15',
              completionDelay: null,
              comment: null,
              exceedsSchedule: false,
              organisationType: null,
              systemType: null,
              sentToSutp: null,
              branchId: null,
              unitId: null,
              newExecutionDate: null,
            },
          ],
        },
      ],
    };
    const timelineData = mapTimelineResponse(response);
    const items = buildTimelineItems(timelineData, new Date('2026-04-02T10:00:00.000Z'));
    const stageActualItem = items.find((item) => item.id === 'stage-10-actual');

    expect(stageActualItem?.start.toISOString()).toBe('2026-04-02T09:15:00.000Z');
    expect(stageActualItem?.end?.toISOString()).toBe('2026-04-02T10:00:00.000Z');
    expect(stageActualItem?.meta.colorVariant).toBe('default');
  });

  it('shows a warning stage color when a delayed process exists inside an on-time stage', () => {
    const response: TimelineResponse = {
      businessDate: '2026-04-02',
      generatedAt: '2026-04-02T09:00:00.000Z',
      stages: [
        {
          id: 11,
          name: 'Этап с отклонением процесса',
          processes: [
            {
              id: 1101,
              stageId: 11,
              name: 'Просроченный процесс',
              state: 'completed',
              scheduledStart: '2026-04-02T09:00:00.000Z',
              scheduledFinish: '2026-04-02T10:00:00.000Z',
              factStart: '2026-04-02T09:00:00.000Z',
              factFinish: '2026-04-02T10:15:00.000Z',
              regulationDuration: '01:00',
              factDuration: '01:15',
              launchDelay: null,
              completionDelay: '00:15',
              comment: null,
              exceedsSchedule: true,
              organisationType: null,
              systemType: null,
              sentToSutp: null,
              branchId: null,
              unitId: null,
              newExecutionDate: null,
            },
            {
              id: 1102,
              stageId: 11,
              name: 'Следующий процесс',
              state: 'not_started',
              scheduledStart: '2026-04-02T11:00:00.000Z',
              scheduledFinish: '2026-04-02T12:00:00.000Z',
              factStart: null,
              factFinish: null,
              regulationDuration: '01:00',
              factDuration: null,
              launchDelay: null,
              completionDelay: null,
              comment: null,
              exceedsSchedule: false,
              organisationType: null,
              systemType: null,
              sentToSutp: null,
              branchId: null,
              unitId: null,
              newExecutionDate: null,
            },
          ],
        },
      ],
    };
    const timelineData = mapTimelineResponse(response);
    const items = buildTimelineItems(timelineData, new Date('2026-04-02T10:30:00.000Z'));

    expect(items.find((item) => item.id === 'stage-11-actual')?.meta.colorVariant).toBe(
      'warning',
    );
  });

  it('updates dataset without clearing existing entries first', () => {
    const dataSet = new DataSet<{ id: string; value: string }>([
      { id: 'stage-1', value: 'before' },
      { id: 'stage-2', value: 'stale' },
    ]);

    syncTimelineDataSet(dataSet, [
      { id: 'stage-1', value: 'after' },
      { id: 'stage-3', value: 'new' },
    ]);

    expect(dataSet.get('stage-1')?.value).toBe('after');
    expect(dataSet.get('stage-2')).toBeNull();
    expect(dataSet.get('stage-3')?.value).toBe('new');
  });
});
