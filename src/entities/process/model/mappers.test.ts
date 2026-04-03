import { describe, expect, it } from 'vitest';
import { mapProcessToUiModel } from './mappers';
import { createTimelineResponseFixture } from '../../../test/fixtures/timeline';
import type { ProcessApiModel } from '../../../shared/types/api';

describe('process mapper', () => {
  it('maps backend process to ui model with safe optional values', () => {
    const response = createTimelineResponseFixture();
    const stage = response.stages[0];
    const process = stage.processes[1];
    const mappedProcess = mapProcessToUiModel(process, stage.stageId ?? 0);

    expect(mappedProcess.id).toBe(102);
    expect(mappedProcess.systemType).toBeNull();
    expect(mappedProcess.comment).toBeNull();
    expect(mappedProcess.newExecutionDate?.toISOString()).toBe('2026-04-02T11:00:00.000Z');
    expect(mappedProcess.isDelayed).toBe(true);
    expect(mappedProcess.colorVariant).toBe('danger');
  });

  it('infers not started state when backend omits state for a planned process', () => {
    const process: ProcessApiModel = {
      processId: 999,
      processName: 'Planned only process',
      regulationDateTimeStart: '2026-04-03T06:00:00.000Z',
      regulationDateTimeFinish: '2026-04-03T07:00:00.000Z',
      isExpired: false,
    };

    const mappedProcess = mapProcessToUiModel(process, 1);

    expect(mappedProcess.state).toBe('not_started');
    expect(mappedProcess.colorVariant).toBe('default');
  });
});
