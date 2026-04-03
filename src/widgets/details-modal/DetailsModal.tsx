import { Button, TextArea, TextInput } from '@admiral-ds/react-ui';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { findSelectedProcess, getProcessDetailsViewModel } from '../../entities/process/model/selectors';
import { findSelectedStage, getStageDetailsViewModel } from '../../entities/stage/model/selectors';
import { useUpdateProcessCommentMutation } from '../../features/update-process-comment/api';
import { useUpdateProcessExecutionDateMutation } from '../../features/update-process-date/api';
import type { UiStage } from '../../entities/stage/model/types';
import { formatDateTimeInput, parseDateTimeInput } from '../../shared/lib/date/format';
import type { SelectedItemState } from '../../shared/types/timeline';
import styles from './DetailsModal.module.css';

interface DetailsModalProps {
  selectedItem: SelectedItemState | null;
  stages: UiStage[];
  businessDate: string;
  onClose: () => void;
}

interface DetailField {
  label: string;
  value: string;
}

const DetailFields = ({ fields }: { fields: DetailField[] }): JSX.Element => {
  return (
    <div className={styles.grid}>
      {fields.map((field) => (
        <div key={field.label} className={styles.field}>
          <span className={styles.fieldLabel}>{field.label}</span>
          <span className={styles.fieldValue}>{field.value}</span>
        </div>
      ))}
    </div>
  );
};

export const DetailsModal = ({
  selectedItem,
  stages,
  businessDate,
  onClose,
}: DetailsModalProps): JSX.Element | null => {
  const selectedProcess = findSelectedProcess(stages, selectedItem);
  const selectedStage = findSelectedStage(stages, selectedItem);
  const updateCommentMutation = useUpdateProcessCommentMutation(businessDate);
  const updateExecutionDateMutation = useUpdateProcessExecutionDateMutation(businessDate);
  const [commentDraft, setCommentDraft] = useState<string>('');
  const [executionDateDraft, setExecutionDateDraft] = useState<string>('');

  useEffect(() => {
    if (!selectedProcess) {
      setCommentDraft('');
      setExecutionDateDraft('');
      return;
    }

    setCommentDraft(selectedProcess.comment ?? '');
    setExecutionDateDraft(formatDateTimeInput(selectedProcess.newExecutionDate));
  }, [selectedProcess]);

  useEffect(() => {
    if (!selectedItem) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, selectedItem]);

  if (!selectedItem) {
    return null;
  }

  const handleCommentSave = async (): Promise<void> => {
    if (!selectedProcess) {
      return;
    }

    await updateCommentMutation.mutateAsync({
      processId: selectedProcess.id,
      comment: commentDraft,
    });
  };

  const handleExecutionDateSave = async (): Promise<void> => {
    if (!selectedProcess) {
      return;
    }

    await updateExecutionDateMutation.mutateAsync({
      processId: selectedProcess.id,
      executionDate: parseDateTimeInput(executionDateDraft),
    });
  };

  const renderContent = (): JSX.Element => {
    if (selectedItem.entityType === 'process' && selectedProcess) {
      const viewModel = getProcessDetailsViewModel(selectedProcess);

      return (
        <>
          <div className={styles.header}>
            <div>
              <h2 className={styles.title}>{viewModel.name}</h2>
              <p className={styles.meta}>Процесс #{viewModel.id}</p>
            </div>
          </div>
          <DetailFields
            fields={[
              { label: 'Статус', value: viewModel.statusLabel },
              { label: 'Отклонение', value: viewModel.delayLabel },
              { label: 'Плановый диапазон', value: viewModel.plannedRangeLabel },
              { label: 'Фактический диапазон', value: viewModel.actualRangeLabel },
              { label: 'Нормативная длительность', value: viewModel.regulationDurationLabel },
              { label: 'Фактическая длительность', value: viewModel.factDurationLabel },
              { label: 'Задержка запуска', value: viewModel.launchDelayLabel },
              { label: 'Задержка завершения', value: viewModel.completionDelayLabel },
              { label: 'Комментарий', value: viewModel.commentLabel },
              { label: 'Новая дата исполнения', value: viewModel.newExecutionDateLabel },
              { label: 'Organisation type', value: viewModel.organisationTypeLabel },
              { label: 'System type', value: viewModel.systemTypeLabel },
              { label: 'Отправлено в СУТП', value: viewModel.sentToSutpLabel },
              { label: 'Branch ID', value: viewModel.branchLabel },
              { label: 'Unit ID', value: viewModel.unitLabel },
            ]}
          />
          <section className={styles.formSection}>
            <h3>Обновление данных процесса</h3>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Комментарий</span>
                <TextArea
                  rows={4}
                  value={commentDraft}
                  onChange={(event) => setCommentDraft(event.target.value)}
                />
              </div>
              <div className={styles.actions}>
                <Button
                  appearance="secondary"
                  loading={updateCommentMutation.isLoading}
                  onClick={() => {
                    void handleCommentSave();
                  }}
                >
                  Сохранить комментарий
                </Button>
                <p className={styles.hint}>
                  {updateCommentMutation.isError
                    ? updateCommentMutation.error.message
                    : updateCommentMutation.isSuccess
                      ? 'Комментарий сохранён, данные обновятся после refetch.'
                      : 'Модалка остаётся открытой после сохранения.'}
                </p>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Новая дата исполнения</span>
                <TextInput
                  type="datetime-local"
                  value={executionDateDraft}
                  onChange={(event) => setExecutionDateDraft(event.target.value)}
                />
              </div>
              <div className={styles.actions}>
                <Button
                  appearance="secondary"
                  loading={updateExecutionDateMutation.isLoading}
                  onClick={() => {
                    void handleExecutionDateSave();
                  }}
                >
                  Сохранить новую дату
                </Button>
                <p className={styles.hint}>
                  {updateExecutionDateMutation.isError
                    ? updateExecutionDateMutation.error.message
                    : updateExecutionDateMutation.isSuccess
                      ? 'Новая дата сохранена, таймлайн инвалидирован.'
                      : 'Поле можно очистить и сохранить пустое значение.'}
                </p>
              </div>
            </div>
          </section>
        </>
      );
    }

    if (selectedItem.entityType === 'stage' && selectedStage) {
      const viewModel = getStageDetailsViewModel(selectedStage);

      return (
        <>
          <div className={styles.header}>
            <div>
              <h2 className={styles.title}>{viewModel.name}</h2>
              <p className={styles.meta}>Этап #{viewModel.id}</p>
            </div>
          </div>
          <DetailFields
            fields={[
              { label: 'Плановый диапазон', value: viewModel.plannedRangeLabel },
              { label: 'Фактический диапазон', value: viewModel.actualRangeLabel },
              { label: 'Прогресс', value: viewModel.progressLabel },
              { label: 'Отклонение', value: viewModel.delayLabel },
              { label: 'Количество процессов', value: viewModel.processCountLabel },
            ]}
          />
          <ol className={styles.processList}>
            {viewModel.processes.map((process) => (
              <li key={process.id}>
                {process.name} · {process.statusLabel} · {process.delayLabel}
              </li>
            ))}
          </ol>
        </>
      );
    }

    return (
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Сущность больше не найдена</h2>
          <p className={styles.meta}>
            Данные обновились, но выбранный этап или процесс отсутствует в новом ответе.
          </p>
        </div>
      </div>
    );
  };

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.content}>{renderContent()}</div>
        <div className={styles.footer}>
          <Button onClick={onClose}>Закрыть</Button>
        </div>
      </section>
    </div>,
    document.body,
  );
};
