import { format } from 'date-fns';
import { useState } from 'react';
import { useSelectedItem } from '../../features/select-timeline-item/useSelectedItem';
import { useTimelineQuery } from '../../shared/api/useTimelineQuery';
import { useNowMarker } from '../../shared/lib/hooks/useNowMarker';
import { EmptyState } from '../../shared/ui/empty-state/EmptyState';
import { Loader } from '../../shared/ui/loader/Loader';
import { DetailsModal } from '../../widgets/details-modal/DetailsModal';
import { TimelineBoard } from '../../widgets/timeline-board/TimelineBoard';
import { TimelineLayout } from '../../widgets/timeline-layout/TimelineLayout';
import styles from './TimelinePage.module.css';

const buildBusinessDate = (): string => format(new Date(), 'yyyy-MM-dd');

export const TimelinePage = (): JSX.Element => {
  const [businessDate] = useState<string>(buildBusinessDate);
  const now = useNowMarker();
  const { selectedItem, openDetailsModal, closeDetailsModal } = useSelectedItem();
  const timelineQuery = useTimelineQuery(businessDate);

  if (timelineQuery.isLoading) {
    return (
      <main className={styles.page}>
        <section className={styles.stateCard}>
          <Loader />
        </section>
      </main>
    );
  }

  if (timelineQuery.isError) {
    return (
      <main className={styles.page}>
        <section className={styles.stateCard}>
          <EmptyState
            title="Не удалось загрузить таймлайн"
            description={timelineQuery.error?.message ?? 'Попробуйте обновить страницу позже.'}
          />
        </section>
      </main>
    );
  }

  if (!timelineQuery.data || timelineQuery.data.stages.length === 0) {
    return (
      <main className={styles.page}>
        <section className={styles.stateCard}>
          <EmptyState
            title="Для выбранной даты нет данных"
            description="Когда backend вернёт этапы и процессы, они появятся на странице автоматически."
          />
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <TimelineLayout
        header={
          <div className={styles.headerContent}>
            <div>
              <span className={styles.eyebrow}>Timeline Monitor</span>
              <h1 className={styles.title}>Монитор таймлайна производства</h1>
            </div>
            <div className={styles.meta}>
              <span>Дата: {timelineQuery.data.businessDate}</span>
              <span>Фоновое обновление: {timelineQuery.isBackgroundFetching ? 'идёт' : 'ожидание'}</span>
            </div>
          </div>
        }
        board={
          <TimelineBoard
            data={timelineQuery.data}
            selectedItem={selectedItem}
            onSelectItem={openDetailsModal}
            now={now}
            isBackgroundRefreshing={timelineQuery.isBackgroundFetching}
          />
        }
        modal={
          <DetailsModal
            selectedItem={selectedItem}
            stages={timelineQuery.data.stages}
            businessDate={timelineQuery.data.businessDate}
            onClose={closeDetailsModal}
          />
        }
      />
    </main>
  );
};
