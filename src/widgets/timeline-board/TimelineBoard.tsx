import { useEffect, useMemo, useRef, useState } from 'react';
import { DataSet } from 'vis-data/esnext';
import { Timeline as VisTimeline } from 'vis-timeline';
import 'vis-timeline/styles/vis-timeline-graph2d.min.css';
import type { UiTimelineData } from '../../shared/types/ui';
import type {
  SelectedItemState,
  TimelineClickEvent,
  TimelineGroupModel,
  TimelineItemModel,
  TimelineSelectEvent,
} from '../../shared/types/timeline';
import {
  buildNowMarker,
  buildTimelineBoardModel,
  buildTimelineSelection,
  parseTimelineSelection,
  parseTimelineSelectEvent,
  syncTimelineDataSet,
} from '../../shared/lib/timeline/visTimeline';
import { TimelineItemTooltip } from './TimelineItemTooltip';
import styles from './TimelineBoard.module.css';

interface TimelineBoardProps {
  data: UiTimelineData;
  selectedItem: SelectedItemState | null;
  onSelectItem: (item: SelectedItemState) => void;
  isBackgroundRefreshing: boolean;
  now: Date;
}

interface HoveredTimelineItemState {
  itemId: string;
  targetElement: Element;
}

interface TimelineHoverEvent {
  item?: string | number | null;
  event?: Event;
}

const resolveTimelineItemElement = (event?: Event): Element | null => {
  const eventTarget = event?.target;

  if (!(eventTarget instanceof Element)) {
    return null;
  }

  return eventTarget.closest('.vis-item');
};

export const TimelineBoard = ({
  data,
  selectedItem,
  onSelectItem,
  isBackgroundRefreshing,
  now,
}: TimelineBoardProps): JSX.Element => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<VisTimeline | null>(null);
  const groupsRef = useRef<DataSet<TimelineGroupModel>>(new DataSet<TimelineGroupModel>());
  const itemsRef = useRef<DataSet<TimelineItemModel>>(new DataSet<TimelineItemModel>());
  const boardModel = useMemo(() => buildTimelineBoardModel(data, now), [data, now]);
  const initialOptionsRef = useRef(boardModel.options);
  const latestItemsRef = useRef<TimelineItemModel[]>([]);
  const [hoveredItem, setHoveredItem] = useState<HoveredTimelineItemState | null>(null);
  const selection = useMemo(
    () => buildTimelineSelection(selectedItem, boardModel.items),
    [boardModel.items, selectedItem],
  );
  const hoveredTimelineItem = useMemo(() => {
    if (!hoveredItem) {
      return null;
    }

    return boardModel.items.find((item) => item.id === hoveredItem.itemId) ?? null;
  }, [boardModel.items, hoveredItem]);

  const processCount = data.stages.reduce((total, stage) => total + stage.processes.length, 0);

  useEffect(() => {
    if (!containerRef.current || timelineRef.current) {
      return undefined;
    }

    const timelineInstance = new VisTimeline(
      containerRef.current,
      itemsRef.current,
      groupsRef.current,
      initialOptionsRef.current,
    );

    const handleTimelineClick = (event: TimelineClickEvent): void => {
      const nextSelectedItem = parseTimelineSelection(event, latestItemsRef.current);

      if (nextSelectedItem) {
        setHoveredItem(null);
        onSelectItem(nextSelectedItem);
      }
    };

    const handleTimelineSelect = (event: TimelineSelectEvent): void => {
      const nextSelectedItem = parseTimelineSelectEvent(event, latestItemsRef.current);

      if (nextSelectedItem) {
        setHoveredItem(null);
        onSelectItem(nextSelectedItem);
      }
    };

    const handleTimelineItemOver = (event: TimelineHoverEvent): void => {
      if (event.item === null || event.item === undefined) {
        return;
      }

      const targetElement = resolveTimelineItemElement(event.event);

      if (!targetElement) {
        return;
      }

      setHoveredItem({
        itemId: String(event.item),
        targetElement,
      });
    };

    const handleTimelineItemOut = (): void => {
      setHoveredItem(null);
    };

    timelineInstance.on('click', handleTimelineClick);
    timelineInstance.on('select', handleTimelineSelect);
    timelineInstance.on('itemover', handleTimelineItemOver);
    timelineInstance.on('itemout', handleTimelineItemOut);
    timelineRef.current = timelineInstance;

    return () => {
      timelineInstance.off('click', handleTimelineClick);
      timelineInstance.off('select', handleTimelineSelect);
      timelineInstance.off('itemover', handleTimelineItemOver);
      timelineInstance.off('itemout', handleTimelineItemOut);
      timelineInstance.destroy();
      timelineRef.current = null;
    };
  }, [onSelectItem]);

  useEffect(() => {
    latestItemsRef.current = boardModel.items;

    const groupsWithPersistedNesting = boardModel.groups.map((group) => {
      const currentGroup = groupsRef.current.get(group.id);

      if (!currentGroup || !Array.isArray(group.nestedGroups)) {
        return group;
      }

      return {
        ...group,
        showNested: currentGroup.showNested ?? group.showNested,
      };
    });

    syncTimelineDataSet(groupsRef.current, groupsWithPersistedNesting);
    syncTimelineDataSet(itemsRef.current, boardModel.items);
  }, [boardModel.groups, boardModel.items]);

  useEffect(() => {
    setHoveredItem((currentHoveredItem) => {
      if (!currentHoveredItem) {
        return null;
      }

      const isHoveredItemStillPresent = boardModel.items.some(
        (item) => item.id === currentHoveredItem.itemId,
      );

      return isHoveredItemStillPresent ? currentHoveredItem : null;
    });
  }, [boardModel.items]);

  useEffect(() => {
    if (!timelineRef.current) {
      return;
    }

    timelineRef.current.setSelection(selection);
  }, [selection]);

  useEffect(() => {
    if (!timelineRef.current) {
      return;
    }

    timelineRef.current.setCurrentTime(buildNowMarker(now));
  }, [now]);

  if (boardModel.items.length === 0) {
    return <section className={styles.empty}>Нет данных для отображения на таймлайне.</section>;
  }

  return (
    <section className={styles.board}>
      <div className={styles.header}>
        <div>
          <h2>Таймлайн</h2>
          <p className={styles.meta}>
            {data.stages.length} этапов · {processCount} процессов
          </p>
        </div>
        <p className={styles.meta}>
          {isBackgroundRefreshing ? 'Обновляем данные...' : 'Данные актуальны'}
        </p>
      </div>
      <div className={styles.columnHeader}>
        <span className={styles.columnHeaderLabel}>Этапы</span>
        <span className={styles.columnHeaderSpacer} />
      </div>
      <div className={styles.timelineShell}>
        <div ref={containerRef} className={styles.canvas} />
        <TimelineItemTooltip
          hoveredItem={hoveredTimelineItem}
          items={boardModel.items}
          stages={data.stages}
          targetElement={hoveredItem?.targetElement ?? null}
        />
      </div>
    </section>
  );
};
