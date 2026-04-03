import { Tooltip } from '@admiral-ds/react-ui';
import {
  getProcessDetailsViewModel,
  getProcessStatusLabel,
} from '../../entities/process/model/selectors';
import type { UiProcess } from '../../entities/process/model/types';
import { getStageDetailsViewModel } from '../../entities/stage/model/selectors';
import type { UiStage } from '../../entities/stage/model/types';
import type { TimelineColorVariant, TimelineItemModel } from '../../shared/types/timeline';
import styles from './TimelineBoard.module.css';

interface TimelineItemTooltipProps {
  hoveredItem: TimelineItemModel | null;
  items: TimelineItemModel[];
  stages: UiStage[];
  targetElement: Element | null;
}

interface TooltipField {
  label: string;
  value: string;
}

interface TooltipCardModel {
  entityType: 'stage' | 'process';
  title: string;
  entityLabel: string;
  statusLabel: string;
  statusTone: TimelineColorVariant;
  fields: TooltipField[];
}

const findStageById = (stages: UiStage[], stageId: number): UiStage | null => {
  return stages.find((stage) => stage.id === stageId) ?? null;
};

const findProcessById = (stages: UiStage[], processId: number): UiProcess | null => {
  for (const stage of stages) {
    const process = stage.processes.find((stageProcess) => stageProcess.id === processId);

    if (process) {
      return process;
    }
  }

  return null;
};

const getStatusTone = (
  hoveredItem: TimelineItemModel,
  items: TimelineItemModel[],
): TimelineColorVariant => {
  const actualItem = items.find((item) => {
    return (
      item.meta.entityType === hoveredItem.meta.entityType &&
      item.meta.entityId === hoveredItem.meta.entityId &&
      item.meta.variant === 'actual'
    );
  });

  return actualItem?.meta.colorVariant ?? hoveredItem.meta.colorVariant;
};

const getStageStatusLabel = (
  stage: UiStage,
  statusTone: TimelineColorVariant,
): string => {
  switch (statusTone) {
    case 'danger':
      return 'Просрочен';
    case 'warning':
      return 'Есть задержка процесса';
    case 'success':
      return 'Завершён в срок';
    default:
      return stage.calculatedFactStart ? 'В работе' : 'Не начат';
  }
};

const getStageDelayLabel = (statusTone: TimelineColorVariant): string => {
  switch (statusTone) {
    case 'danger':
      return 'Превышено время этапа';
    case 'warning':
      return 'Просрочен хотя бы один процесс';
    default:
      return 'Без отклонения';
  }
};

const getProcessTooltipStatusLabel = (
  process: UiProcess,
  statusTone: TimelineColorVariant,
): string => {
  if (statusTone === 'danger') {
    return process.factFinishDate ? 'Завершён с задержкой' : 'Идёт с задержкой';
  }

  if (statusTone === 'success') {
    return 'Завершён в срок';
  }

  if (process.state === 'in_progress') {
    return 'В работе';
  }

  if (process.state === 'completed') {
    return 'Завершён';
  }

  if (process.state === 'not_started') {
    return 'Не начат';
  }

  return getProcessStatusLabel(process.state);
};

const getStatusDotClassName = (statusTone: TimelineColorVariant): string => {
  return [
    styles.tooltipStatusDot,
    styles[`tooltipStatusDot${statusTone.charAt(0).toUpperCase()}${statusTone.slice(1)}`],
  ].join(' ');
};

const getStatusBadgeClassName = (statusTone: TimelineColorVariant): string => {
  return [
    styles.tooltipStatusBadge,
    styles[`tooltipStatusBadge${statusTone.charAt(0).toUpperCase()}${statusTone.slice(1)}`],
  ].join(' ');
};

const getKindBadgeClassName = (entityType: 'stage' | 'process'): string => {
  return [
    styles.tooltipKindBadge,
    styles[`tooltipKindBadge${entityType.charAt(0).toUpperCase()}${entityType.slice(1)}`],
  ].join(' ');
};

const buildTooltipCardModel = (
  hoveredItem: TimelineItemModel,
  items: TimelineItemModel[],
  stages: UiStage[],
): TooltipCardModel | null => {
  const statusTone = getStatusTone(hoveredItem, items);

  if (hoveredItem.meta.entityType === 'process') {
    const process = findProcessById(stages, hoveredItem.meta.entityId);

    if (!process) {
      return null;
    }

    const viewModel = getProcessDetailsViewModel(process);

    return {
      entityType: 'process',
      title: process.name,
      entityLabel: 'Процесс',
      statusLabel: getProcessTooltipStatusLabel(process, statusTone),
      statusTone,
      fields: [
        { label: 'Регламент', value: viewModel.plannedRangeLabel },
        { label: 'Факт', value: viewModel.actualRangeLabel },
        { label: 'Отклонение', value: viewModel.delayLabel },
      ],
    };
  }

  const stage = findStageById(stages, hoveredItem.meta.entityId);

  if (!stage) {
    return null;
  }

  const viewModel = getStageDetailsViewModel(stage);

  return {
    entityType: 'stage',
    title: stage.name,
    entityLabel: 'Этап',
    statusLabel: getStageStatusLabel(stage, statusTone),
    statusTone,
    fields: [
      { label: 'Регламент', value: viewModel.plannedRangeLabel },
      { label: 'Факт', value: viewModel.actualRangeLabel },
      { label: 'Прогресс', value: viewModel.progressLabel },
      { label: 'Отклонение', value: getStageDelayLabel(statusTone) },
    ],
  };
};

export const TimelineItemTooltip = ({
  hoveredItem,
  items,
  stages,
  targetElement,
}: TimelineItemTooltipProps): JSX.Element | null => {
  if (!hoveredItem || !targetElement) {
    return null;
  }

  const cardModel = buildTooltipCardModel(hoveredItem, items, stages);

  if (!cardModel) {
    return null;
  }

  return (
    <Tooltip
      targetElement={targetElement}
      tooltipPosition="top"
      dimension="m"
      style={{
        pointerEvents: 'none',
        background: 'transparent',
        color: 'inherit',
        boxShadow: 'none',
        padding: 0,
        borderRadius: 0,
        maxWidth: 'min(420px, calc(100vw - 24px))',
      }}
      renderContent={() => (
        <div className={styles.tooltipCard}>
          <div className={styles.tooltipHeader}>
            <div className={styles.tooltipTitle}>{cardModel.title}</div>
            <div className={styles.tooltipMetaRow}>
              <span className={getKindBadgeClassName(cardModel.entityType)}>
                {cardModel.entityLabel}
              </span>
              <div className={getStatusBadgeClassName(cardModel.statusTone)}>
                <span className={getStatusDotClassName(cardModel.statusTone)} />
                <span className={styles.tooltipStatusText}>{cardModel.statusLabel}</span>
              </div>
            </div>
          </div>
          <div className={styles.tooltipFields}>
            {cardModel.fields.map((field) => (
              <div key={field.label} className={styles.tooltipFieldRow}>
                <span className={styles.tooltipFieldLabel}>{field.label}</span>
                <span className={styles.tooltipFieldValue}>{field.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    />
  );
};
