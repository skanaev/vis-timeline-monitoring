import { format as formatDate, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { DataSet } from 'vis-data/esnext';
import type { TimelineOptions } from 'vis-timeline/types';
import type { UiStage } from '../../../entities/stage/model/types';
import {
  getProcessActualFinish,
  getProcessActualStart,
  isInProgressWithoutFinish,
} from '../../../entities/process/model/selectors';
import {
  getStageFactStart,
  getStageProgressFinish,
  getStageProgressStart,
} from '../../../entities/stage/model/selectors';
import {
  TIMELINE_AXIS_STEP_HOURS,
  TIMELINE_GROUP_HEIGHT,
  TIMELINE_ITEM_HEIGHT,
  TIMELINE_WINDOW_PADDING_HOURS,
} from '../../config/timeline';
import {
  createSafeDateRange,
  getMaxDate,
  getMinDate,
  isDateAfter,
  withTimelinePadding,
} from '../date/timeline';
import { parseIsoDate } from '../date/format';
import type { UiTimelineData } from '../../types/ui';
import type {
  SelectedItemState,
  TimelineBoardModel,
  TimelineClickEvent,
  TimelineColorVariant,
  TimelineGroupModel,
  TimelineItemMeta,
  TimelineItemModel,
  TimelineItemVariant,
  TimelineSelectEvent,
  TimelineWindow,
} from '../../types/timeline';

const buildGroupId = (entityType: 'stage' | 'process', entityId: number): string => {
  return `${entityType}-${entityId}`;
};

const buildItemId = (
  entityType: 'stage' | 'process',
  entityId: number,
  variant: TimelineItemVariant,
): string => {
  return `${buildGroupId(entityType, entityId)}-${variant}`;
};

const capitalizeFirstLetter = (value: string): string => {
  if (value.length === 0) {
    return value;
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
};

const formatRussianAxisDate = (date: Date, pattern: string): string => {
  return formatDate(date, pattern, { locale: ru }).replace(/\./g, '');
};

const formatTimelineMinorLabel = (date: Date, scale: string): string => {
  switch (scale) {
    case 'millisecond':
    case 'second':
    case 'minute':
    case 'hour':
      return formatRussianAxisDate(date, 'HH:mm');
    case 'weekday':
      return formatRussianAxisDate(date, 'EEEEEE d');
    case 'day':
    case 'week':
      return formatRussianAxisDate(date, 'd MMM');
    case 'month':
      return formatRussianAxisDate(date, 'LLL');
    case 'year':
      return formatRussianAxisDate(date, 'yyyy');
    default:
      return formatRussianAxisDate(date, 'd MMM');
  }
};

const formatTimelineMajorLabel = (date: Date, scale: string): string => {
  switch (scale) {
    case 'millisecond':
    case 'second':
    case 'minute':
    case 'hour':
      return capitalizeFirstLetter(formatRussianAxisDate(date, 'EEEEEE, d MMMM'));
    case 'weekday':
    case 'day':
    case 'week':
      return capitalizeFirstLetter(formatRussianAxisDate(date, 'LLLL yyyy'));
    case 'month':
    case 'year':
      return formatRussianAxisDate(date, 'yyyy');
    default:
      return capitalizeFirstLetter(formatRussianAxisDate(date, 'd MMMM yyyy'));
  }
};

export const getTimelineItemClassName = (meta: TimelineItemMeta): string => {
  return [
    'timeline-item',
    `timeline-item--${meta.entityType}`,
    `timeline-item--${meta.variant}`,
    `timeline-item--${meta.colorVariant}`,
    meta.isDelayed ? 'timeline-item--delayed' : '',
  ]
    .filter((value) => value.length > 0)
    .join(' ');
};

const buildTimelineItemMeta = (
  entityType: 'stage' | 'process',
  entityId: number,
  variant: TimelineItemVariant,
  colorVariant: TimelineColorVariant,
  isDelayed: boolean,
): TimelineItemMeta => ({
  entityType,
  entityId,
  variant,
  colorVariant,
  isDelayed,
});

const buildTimelineRangeItem = (
  group: string,
  title: string,
  start: Date,
  end: Date,
  meta: TimelineItemMeta,
): TimelineItemModel => ({
  id: buildItemId(meta.entityType, meta.entityId, meta.variant),
  group,
  content: '',
  start,
  end,
  type: 'range',
  selectable: true,
  title,
  className: getTimelineItemClassName(meta),
  meta,
});

const isProcessTimelineDelayed = (
  process: UiStage['processes'][number],
  now: Date,
): boolean => {
  const actualFinish = getProcessActualFinish(process, now);
  return isDateAfter(actualFinish, process.plannedFinishDate);
};

const getProcessTimelineColorVariant = (
  process: UiStage['processes'][number],
  now: Date,
): TimelineColorVariant => {
  if (!getProcessActualFinish(process, now)) {
    return 'default';
  }

  if (isProcessTimelineDelayed(process, now)) {
    return 'danger';
  }

  if (isInProgressWithoutFinish(process)) {
    return 'active';
  }

  if (process.factFinishDate) {
    return 'success';
  }

  return 'default';
};

const isStageTimelineDelayed = (stage: UiStage, now: Date): boolean => {
  const hasOpenProcess = stage.processes.some((process) => isInProgressWithoutFinish(process));
  const stageProgressFinish = getStageProgressFinish(stage.processes);

  return (
    (hasOpenProcess && isDateAfter(now, stage.calculatedScheduledFinish)) ||
    isDateAfter(stageProgressFinish, stage.calculatedScheduledFinish)
  );
};

const hasDelayedStageProcess = (stage: UiStage, now: Date): boolean => {
  return stage.processes.some((process) => isProcessTimelineDelayed(process, now));
};

const getStageTimelineColorVariant = (stage: UiStage, now: Date): TimelineColorVariant => {
  const stageProgressFinish = getStageProgressFinish(stage.processes);
  const allProcessesFinished =
    stage.processes.length > 0 && stage.processes.every((process) => Boolean(process.factFinishDate));

  if (isStageTimelineDelayed(stage, now)) {
    return 'danger';
  }

  if (hasDelayedStageProcess(stage, now)) {
    return 'warning';
  }

  if (allProcessesFinished && stageProgressFinish) {
    return 'success';
  }

  return 'default';
};

export const buildProcessTimelineItems = (
  process: UiStage['processes'][number],
  now: Date,
): TimelineItemModel[] => {
  const items: TimelineItemModel[] = [];
  const group = buildGroupId('process', process.id);

  const plannedRange = createSafeDateRange(process.plannedStartDate, process.plannedFinishDate);
  if (plannedRange) {
    items.push(
      buildTimelineRangeItem(
        group,
        `${process.name}: план`,
        plannedRange.start,
        plannedRange.end,
        buildTimelineItemMeta('process', process.id, 'planned', 'default', false),
      ),
    );
  }

  const actualStart = getProcessActualStart(process);
  const actualFinish = getProcessActualFinish(process, now);
  const actualRange = createSafeDateRange(actualStart, actualFinish);

  if (actualRange) {
    items.push(
      buildTimelineRangeItem(
        group,
        `${process.name}: факт`,
        actualRange.start,
        actualRange.end,
        buildTimelineItemMeta(
          'process',
          process.id,
          'actual',
          getProcessTimelineColorVariant(process, now),
          isProcessTimelineDelayed(process, now),
        ),
      ),
    );
  }

  return items;
};

export const buildStageTimelineItems = (stage: UiStage, now: Date): TimelineItemModel[] => {
  const items: TimelineItemModel[] = [];
  const group = buildGroupId('stage', stage.id);

  const plannedRange = createSafeDateRange(
    stage.calculatedScheduledStart,
    stage.calculatedScheduledFinish,
  );

  if (plannedRange) {
    items.push(
      buildTimelineRangeItem(
        group,
        `${stage.name}: план`,
        plannedRange.start,
        plannedRange.end,
        buildTimelineItemMeta('stage', stage.id, 'planned', 'default', false),
      ),
    );
  }

  const completedProgressRange = createSafeDateRange(
    getStageProgressStart(stage.processes),
    getStageProgressFinish(stage.processes),
  );
  const hasOpenProcess = stage.processes.some((process) => isInProgressWithoutFinish(process));
  const activeProgressRange =
    !completedProgressRange && hasOpenProcess
      ? createSafeDateRange(getStageFactStart(stage.processes), now)
      : null;
  const actualRange = completedProgressRange ?? activeProgressRange;

  if (actualRange) {
    items.push(
      buildTimelineRangeItem(
        group,
        `${stage.name}: прогресс`,
        actualRange.start,
        actualRange.end,
        buildTimelineItemMeta(
          'stage',
          stage.id,
          'actual',
          getStageTimelineColorVariant(stage, now),
          isStageTimelineDelayed(stage, now),
        ),
      ),
    );
  }

  return items;
};

export const buildTimelineGroups = (data: UiTimelineData): TimelineGroupModel[] => {
  const groups: TimelineGroupModel[] = [];

  data.stages.forEach((stage, stageIndex) => {
    const processGroupIds = stage.processes.map((process) => buildGroupId('process', process.id));

    groups.push({
      id: buildGroupId('stage', stage.id),
      content: stage.name,
      title: stage.name,
      className: 'timeline-group timeline-group--stage',
      nestedGroups: processGroupIds,
      showNested: false,
      order: stageIndex * 100,
    });

    stage.processes.forEach((process, processIndex) => {
      groups.push({
        id: buildGroupId('process', process.id),
        content: `<div style={{color: 'red'}}>  ${process.name} </div>`,
        title: process.name,
        className: 'timeline-group timeline-group--process',
        order: stageIndex * 100 + processIndex + 1,
      });
    });
  });

  return groups;
};

export const buildTimelineItems = (data: UiTimelineData, now: Date): TimelineItemModel[] => {
  return data.stages.flatMap((stage) => [
    ...buildStageTimelineItems(stage, now),
    ...stage.processes.flatMap((process) => buildProcessTimelineItems(process, now)),
  ]);
};

export const getTimelineWindow = (data: UiTimelineData, now: Date): TimelineWindow => {
  const items = buildTimelineItems(data, now);
  const businessDate = parseIsoDate(data.businessDate);
  const shouldIncludeNowInWindow = businessDate ? isSameDay(businessDate, now) : false;
  const minDate = getMinDate([
    ...items.map((item) => item.start),
    shouldIncludeNowInWindow ? now : null,
  ]);
  const maxDate = getMaxDate([
    ...items.map((item) => item.end ?? item.start),
    shouldIncludeNowInWindow ? now : null,
  ]);
  const fallbackRange = {
    start: new Date(now.getTime() - TIMELINE_WINDOW_PADDING_HOURS * 60 * 60 * 1000),
    end: new Date(now.getTime() + TIMELINE_WINDOW_PADDING_HOURS * 60 * 60 * 1000),
  };

  const safeRange = minDate && maxDate ? withTimelinePadding({ start: minDate, end: maxDate }) : fallbackRange;

  return {
    start: safeRange.start,
    end: safeRange.end,
  };
};

export const buildNowMarker = (now: Date): Date => now;

interface TimelineDataSetEntry {
  id: string;
}

export const syncTimelineDataSet = <T extends TimelineDataSetEntry>(
  dataSet: DataSet<T>,
  nextEntries: T[],
): void => {
  const nextEntryIds = new Set(nextEntries.map((entry) => entry.id));
  const staleEntryIds = dataSet
    .getIds()
    .map((entryId: string | number) => String(entryId))
    .filter((entryId: string) => !nextEntryIds.has(entryId));

  if (staleEntryIds.length > 0) {
    dataSet.remove(staleEntryIds);
  }

  if (nextEntries.length > 0) {
    dataSet.update(nextEntries);
  }
};

export const getTimelineOptions = (window: TimelineWindow): TimelineOptions => ({
  stack: false,
  editable: false,
  selectable: true,
  showTooltips: false,
  showCurrentTime: true,
  groupHeightMode: 'fixed',
  horizontalScroll: true,
  verticalScroll: true,
  zoomKey: 'ctrlKey',
  start: window.start,
  end: window.end,
  margin: {
    axis: TIMELINE_AXIS_STEP_HOURS * 8,
    item: {
      horizontal: 8,
      vertical: 6,
    },
  },
  orientation: {
    axis: 'top',
    item: 'top',
  },
  zoomMin: 1000 * 60 * 60,
  minHeight: TIMELINE_GROUP_HEIGHT * 4,
  maxHeight: 720,
  tooltip: {
    followMouse: true,
    overflowMethod: 'cap',
  },
  format: {
    minorLabels: formatTimelineMinorLabel,
    majorLabels: formatTimelineMajorLabel,
  },
  dataAttributes: 'all',
});

export const buildTimelineBoardModel = (
  data: UiTimelineData,
  now: Date,
): TimelineBoardModel => {
  const window = getTimelineWindow(data, now);

  return {
    groups: buildTimelineGroups(data),
    items: buildTimelineItems(data, now),
    options: getTimelineOptions(window),
    window,
  };
};

export const buildTimelineSelection = (
  selectedItem: SelectedItemState | null,
  items: TimelineItemModel[],
): string[] => {
  if (!selectedItem) {
    return [];
  }

  return items
    .filter((item) => {
      return (
        item.meta.entityType === selectedItem.entityType &&
        item.meta.entityId === selectedItem.entityId
      );
    })
    .map((item) => item.id);
};

export const parseTimelineSelection = (
  event: TimelineClickEvent,
  items: TimelineItemModel[],
): SelectedItemState | null => {
  if (event.what !== 'item' || event.item === null || event.item === undefined) {
    return null;
  }

  const selectedItem = items.find((item) => item.id === String(event.item));

  if (!selectedItem) {
    return null;
  }

  return {
    entityType: selectedItem.meta.entityType,
    entityId: selectedItem.meta.entityId,
  };
};

export const parseTimelineSelectEvent = (
  event: TimelineSelectEvent,
  items: TimelineItemModel[],
): SelectedItemState | null => {
  const selectedItemId = event.items?.[0];

  if (selectedItemId === null || selectedItemId === undefined) {
    return null;
  }

  const selectedItem = items.find((item) => item.id === String(selectedItemId));

  if (!selectedItem) {
    return null;
  }

  return {
    entityType: selectedItem.meta.entityType,
    entityId: selectedItem.meta.entityId,
  };
};
