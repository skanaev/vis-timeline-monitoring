import {
  Button,
  Modal,
  ModalButtonPanel,
  ModalContent,
  ModalTitle,
  TextArea,
  TextInput,
} from '@admiral-ds/react-ui';
import { useEffect, useState } from 'react';
import { findSelectedProcess, getProcessDetailsViewModel } from '../../entities/process/model/selectors';
import { findSelectedStage, getStageDetailsViewModel } from '../../entities/stage/model/selectors';
import type { UiStage } from '../../entities/stage/model/types';
import { useUpdateProcessCommentMutation } from '../../features/update-process-comment/api';
import { useUpdateProcessExecutionDateMutation } from '../../features/update-process-date/api';
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

const MODAL_TITLE_ID = 'details-modal-title';

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
  const processViewModel = selectedProcess ? getProcessDetailsViewModel(selectedProcess) : null;
  const stageViewModel = selectedStage ? getStageDetailsViewModel(selectedStage) : null;
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

  const modalTitle =
    selectedItem.entityType === 'process' && processViewModel
      ? processViewModel.name
      : selectedItem.entityType === 'stage' && stageViewModel
        ? stageViewModel.name
        : 'Сущность больше не найдена';

  const modalMeta =
    selectedItem.entityType === 'process' && processViewModel
      ? `Процесс #${processViewModel.id}`
      : selectedItem.entityType === 'stage' && stageViewModel
        ? `Этап #${stageViewModel.id}`
        : null;

  const renderProcessContent = (): JSX.Element | null => {
    if (!processViewModel) {
      return null;
    }

    return (
      <>
        {modalMeta ? <p className={styles.meta}>{modalMeta}</p> : null}
        <DetailFields
          fields={[
            { label: 'Статус', value: processViewModel.statusLabel },
            { label: 'Отклонение', value: processViewModel.delayLabel },
            { label: 'Плановый диапазон', value: processViewModel.plannedRangeLabel },
            { label: 'Фактический диапазон', value: processViewModel.actualRangeLabel },
            { label: 'Нормативная длительность', value: processViewModel.regulationDurationLabel },
            { label: 'Фактическая длительность', value: processViewModel.factDurationLabel },
            { label: 'Задержка запуска', value: processViewModel.launchDelayLabel },
            { label: 'Задержка завершения', value: processViewModel.completionDelayLabel },
            { label: 'Комментарий', value: processViewModel.commentLabel },
            { label: 'Новая дата исполнения', value: processViewModel.newExecutionDateLabel },
            { label: 'Organisation type', value: processViewModel.organisationTypeLabel },
            { label: 'System type', value: processViewModel.systemTypeLabel },
            { label: 'Отправлено в СУТП', value: processViewModel.sentToSutpLabel },
            { label: 'Branch ID', value: processViewModel.branchLabel },
            { label: 'Unit ID', value: processViewModel.unitLabel },
          ]}
        />
        <section className={styles.formSection}>
          <h3 className={styles.sectionTitle}>Обновление данных процесса</h3>
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
  };

  const renderStageContent = (): JSX.Element | null => {
    if (!stageViewModel) {
      return null;
    }

    return (
      <>
        {modalMeta ? <p className={styles.meta}>{modalMeta}</p> : null}
        <DetailFields
          fields={[
            { label: 'Плановый диапазон', value: stageViewModel.plannedRangeLabel },
            { label: 'Фактический диапазон', value: stageViewModel.actualRangeLabel },
            { label: 'Прогресс', value: stageViewModel.progressLabel },
            { label: 'Отклонение', value: stageViewModel.delayLabel },
            { label: 'Количество процессов', value: stageViewModel.processCountLabel },
          ]}
        />
        <ol className={styles.processList}>
          {stageViewModel.processes.map((process) => (
            <li key={process.id}>
              {process.name} · {process.statusLabel} · {process.delayLabel}
            </li>
          ))}
        </ol>
      </>
    );
  };

  const renderContent = (): JSX.Element => {
    if (selectedItem.entityType === 'process') {
      return (
        renderProcessContent() ?? (
          <p className={styles.meta}>
            Данные обновились, но выбранный этап или процесс отсутствует в новом ответе.
          </p>
        )
      );
    }

    if (selectedItem.entityType === 'stage') {
      return (
        renderStageContent() ?? (
          <p className={styles.meta}>
            Данные обновились, но выбранный этап или процесс отсутствует в новом ответе.
          </p>
        )
      );
    }

    return (
      <p className={styles.meta}>
        Данные обновились, но выбранный этап или процесс отсутствует в новом ответе.
      </p>
    );
  };

  return (
    <Modal
      aria-labelledby={MODAL_TITLE_ID}
      closeOnEscapeKeyDown
      closeOnOutsideClick
      displayCloseIcon
      dimension="l"
      onClose={onClose}
      style={{ width: 'min(860px, calc(100vw - 48px))', maxHeight: 'calc(100vh - 48px)' }}
    >
      <ModalTitle id={MODAL_TITLE_ID}>{modalTitle}</ModalTitle>
      <ModalContent>
        <div className={styles.content}>{renderContent()}</div>
      </ModalContent>
      <ModalButtonPanel>
        <Button onClick={onClose}>Закрыть</Button>
      </ModalButtonPanel>
    </Modal>
  );
};
