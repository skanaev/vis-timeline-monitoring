import {
  addMinutes,
  formatISO,
  getHours,
  getMinutes,
  set,
  startOfDay,
} from 'date-fns';
import type {
  ApiReference,
  ProcessApiModel,
  ProcessStatusApiModel,
  StageApiModel,
  TimelineResponse,
  UpdateProcessCommentRequest,
  UpdateProcessExecutionDateRequest,
} from '../types/api';

const mockStore = new Map<string, TimelineResponse>();

const MINUTE_MS = 60_000;

interface ProcessSeed {
  processId: number;
  processName: string;
  sortPriority: number;
  plannedOffsetMinutes: number;
  plannedDurationMinutes: number;
  actualStartShiftMinutes: number | null;
  actualDurationMinutes: number | null;
  statusCode: string;
  statusName: string;
  commentFinish: string | null;
  isSentToSutp: boolean;
  manualCompletionAllowed: boolean;
  systemType: ApiReference;
  accomplishmentType: ApiReference;
  organizationTypes: ApiReference[];
  unit: {
    id: number;
    name: string;
    code: string;
    department: ApiReference;
  };
  branch: ApiReference;
  signal: ApiReference;
}

interface StageSeed {
  stageId: number;
  stageName: string;
  sortPriority: number;
  processes: ProcessSeed[];
}

const EXPECTED_STAGE_COUNT = 5;

const createReference = (id: number, name: string, code: string): ApiReference => ({
  id,
  name,
  code,
});

const randomInt = (min: number, max: number): number => {
  const range = max - min + 1;
  return Math.floor(Math.random() * range) + min;
};

const cloneTimelineResponse = (response: TimelineResponse): TimelineResponse => {
  return JSON.parse(JSON.stringify(response)) as TimelineResponse;
};

const toDurationMs = (minutes: number | null): number | null => {
  if (minutes === null) {
    return null;
  }

  return minutes * MINUTE_MS;
};

const buildAnchorDate = (businessDate: string): Date => {
  const businessDay = startOfDay(new Date(`${businessDate}T00:00:00`));
  const now = new Date();

  return set(businessDay, {
    hours: getHours(now),
    minutes: getMinutes(now),
    seconds: 0,
    milliseconds: 0,
  });
};

const buildStageSeeds = (): StageSeed[] => {
  return [
    {
      stageId: 1,
      stageName: 'Подготовка данных',
      sortPriority: 0,
      processes: [
        {
          processId: 101,
          processName: 'Загрузка входящих файлов',
          sortPriority: 0,
          plannedOffsetMinutes: -360,
          plannedDurationMinutes: randomInt(50, 80),
          actualStartShiftMinutes: randomInt(-4, 8),
          actualDurationMinutes: randomInt(48, 84),
          statusCode: 'COMPLETED',
          statusName: 'Завершён',
          commentFinish: 'Источник данных отработал стабильно.',
          isSentToSutp: true,
          manualCompletionAllowed: false,
          systemType: createReference(1, 'ETL', 'ETL'),
          accomplishmentType: createReference(10, 'Автоматически', 'AUTO'),
          organizationTypes: [
            createReference(100, 'Банк', 'BANK'),
            createReference(101, 'Филиал', 'BRANCH'),
          ],
          unit: {
            id: 1001,
            name: 'Узел приёма',
            code: 'INGEST',
            department: createReference(5001, 'ИТ-платформа', 'ITP'),
          },
          branch: createReference(7001, 'Центральный офис', 'CO'),
          signal: createReference(9001, 'Норма', 'GREEN'),
        },
        {
          processId: 102,
          processName: 'Проверка качества входа',
          sortPriority: 1,
          plannedOffsetMinutes: -285,
          plannedDurationMinutes: randomInt(40, 70),
          actualStartShiftMinutes: randomInt(0, 18),
          actualDurationMinutes: randomInt(55, 85),
          statusCode: 'DELAYED',
          statusName: 'С задержкой',
          commentFinish: 'Понадобилась дополнительная валидация нескольких пакетов.',
          isSentToSutp: false,
          manualCompletionAllowed: true,
          systemType: createReference(2, 'DQM', 'DQM'),
          accomplishmentType: createReference(11, 'Под контролем', 'CHECK'),
          organizationTypes: [createReference(101, 'Филиал', 'BRANCH')],
          unit: {
            id: 1002,
            name: 'Контроль качества',
            code: 'QUALITY',
            department: createReference(5002, 'Операционный контроль', 'OPS'),
          },
          branch: createReference(7001, 'Центральный офис', 'CO'),
          signal: createReference(9002, 'Предупреждение', 'YELLOW'),
        },
      ],
    },
    {
      stageId: 2,
      stageName: 'Основной цикл',
      sortPriority: 1,
      processes: [
        {
          processId: 201,
          processName: 'Запуск линии',
          sortPriority: 0,
          plannedOffsetMinutes: -70,
          plannedDurationMinutes: randomInt(90, 125),
          actualStartShiftMinutes: randomInt(-6, 10),
          actualDurationMinutes: null,
          statusCode: 'IN_PROGRESS',
          statusName: 'В работе',
          commentFinish: 'Процесс выполняется в штатном режиме.',
          isSentToSutp: true,
          manualCompletionAllowed: true,
          systemType: createReference(3, 'SCADA', 'SCADA'),
          accomplishmentType: createReference(12, 'По событию', 'EVENT'),
          organizationTypes: [
            createReference(100, 'Банк', 'BANK'),
            createReference(101, 'Филиал', 'BRANCH'),
          ],
          unit: {
            id: 2001,
            name: 'Производственная линия',
            code: 'LINE',
            department: createReference(5003, 'Производство', 'MFG'),
          },
          branch: createReference(7002, 'Площадка Север', 'NORTH'),
          signal: createReference(9003, 'В работе', 'BLUE'),
        },
        {
          processId: 202,
          processName: 'Контроль качества',
          sortPriority: 1,
          plannedOffsetMinutes: 40,
          plannedDurationMinutes: randomInt(55, 80),
          actualStartShiftMinutes: null,
          actualDurationMinutes: null,
          statusCode: 'PENDING',
          statusName: 'Ожидает запуска',
          commentFinish: null,
          isSentToSutp: false,
          manualCompletionAllowed: true,
          systemType: createReference(4, 'QMS', 'QMS'),
          accomplishmentType: createReference(13, 'По расписанию', 'SCHEDULE'),
          organizationTypes: [createReference(100, 'Банк', 'BANK')],
          unit: {
            id: 2002,
            name: 'Лаборатория',
            code: 'LAB',
            department: createReference(5004, 'Качество', 'QA'),
          },
          branch: createReference(7002, 'Площадка Север', 'NORTH'),
          signal: createReference(9001, 'Норма', 'GREEN'),
        },
      ],
    },
    {
      stageId: 3,
      stageName: 'Отгрузка',
      sortPriority: 2,
      processes: [
        {
          processId: 301,
          processName: 'Финальная упаковка',
          sortPriority: 0,
          plannedOffsetMinutes: 170,
          plannedDurationMinutes: randomInt(70, 105),
          actualStartShiftMinutes: null,
          actualDurationMinutes: null,
          statusCode: 'PENDING',
          statusName: 'Ожидает запуска',
          commentFinish: null,
          isSentToSutp: false,
          manualCompletionAllowed: true,
          systemType: createReference(5, 'WMS', 'WMS'),
          accomplishmentType: createReference(13, 'По расписанию', 'SCHEDULE'),
          organizationTypes: [createReference(101, 'Филиал', 'BRANCH')],
          unit: {
            id: 3001,
            name: 'Упаковочный пост',
            code: 'PACK',
            department: createReference(5005, 'Логистика', 'LOG'),
          },
          branch: createReference(7003, 'Склад Юг', 'SOUTH'),
          signal: createReference(9001, 'Норма', 'GREEN'),
        },
        {
          processId: 302,
          processName: 'Передача на склад',
          sortPriority: 1,
          plannedOffsetMinutes: 290,
          plannedDurationMinutes: randomInt(40, 70),
          actualStartShiftMinutes: null,
          actualDurationMinutes: null,
          statusCode: 'PENDING',
          statusName: 'Ожидает запуска',
          commentFinish: null,
          isSentToSutp: false,
          manualCompletionAllowed: true,
          systemType: createReference(6, 'ERP', 'ERP'),
          accomplishmentType: createReference(13, 'По расписанию', 'SCHEDULE'),
          organizationTypes: [createReference(100, 'Банк', 'BANK')],
          unit: {
            id: 3002,
            name: 'Складской шлюз',
            code: 'GATE',
            department: createReference(5005, 'Логистика', 'LOG'),
          },
          branch: createReference(7003, 'Склад Юг', 'SOUTH'),
          signal: createReference(9001, 'Норма', 'GREEN'),
        },
      ],
    },
    {
      stageId: 4,
      stageName: 'Буферный контроль',
      sortPriority: 3,
      processes: [
        {
          processId: 401,
          processName: 'Первичная сверка',
          sortPriority: 0,
          plannedOffsetMinutes: -210,
          plannedDurationMinutes: 35,
          actualStartShiftMinutes: 6,
          actualDurationMinutes: 44,
          statusCode: 'DELAYED',
          statusName: 'С задержкой',
          commentFinish:
            'На входе нашли несколько несоответствий, но этап уложился в общее окно.',
          isSentToSutp: false,
          manualCompletionAllowed: true,
          systemType: createReference(7, 'CONTROL', 'CTRL'),
          accomplishmentType: createReference(14, 'По результату', 'RESULT'),
          organizationTypes: [createReference(100, 'Банк', 'BANK')],
          unit: {
            id: 4001,
            name: 'Группа контроля',
            code: 'CTRL-GRP',
            department: createReference(5006, 'Бизнес-контроль', 'BCTRL'),
          },
          branch: createReference(7004, 'Аналитический центр', 'ANL'),
          signal: createReference(9002, 'Предупреждение', 'YELLOW'),
        },
        {
          processId: 402,
          processName: 'Повторная подтверждающая проверка',
          sortPriority: 1,
          plannedOffsetMinutes: -135,
          plannedDurationMinutes: 50,
          actualStartShiftMinutes: 0,
          actualDurationMinutes: 38,
          statusCode: 'COMPLETED',
          statusName: 'Завершён',
          commentFinish: 'Контрольная проверка завершена в норме.',
          isSentToSutp: true,
          manualCompletionAllowed: false,
          systemType: createReference(8, 'VERIFY', 'VERIFY'),
          accomplishmentType: createReference(10, 'Автоматически', 'AUTO'),
          organizationTypes: [
            createReference(100, 'Банк', 'BANK'),
            createReference(101, 'Филиал', 'BRANCH'),
          ],
          unit: {
            id: 4002,
            name: 'Узел верификации',
            code: 'VERIFY-NODE',
            department: createReference(5006, 'Бизнес-контроль', 'BCTRL'),
          },
          branch: createReference(7004, 'Аналитический центр', 'ANL'),
          signal: createReference(9001, 'Норма', 'GREEN'),
        },
      ],
    },
    {
      stageId: 5,
      stageName: 'Финальная сверка',
      sortPriority: 4,
      processes: [
        {
          processId: 501,
          processName: 'Закрытие пакета данных',
          sortPriority: 0,
          plannedOffsetMinutes: -120,
          plannedDurationMinutes: 30,
          actualStartShiftMinutes: 1,
          actualDurationMinutes: 24,
          statusCode: 'COMPLETED',
          statusName: 'Завершён',
          commentFinish: 'Пакет закрыт без отклонений.',
          isSentToSutp: true,
          manualCompletionAllowed: false,
          systemType: createReference(9, 'CLOSE', 'CLOSE'),
          accomplishmentType: createReference(10, 'Автоматически', 'AUTO'),
          organizationTypes: [createReference(100, 'Банк', 'BANK')],
          unit: {
            id: 5001,
            name: 'Узел закрытия',
            code: 'CLOSE-NODE',
            department: createReference(5007, 'Финализация', 'FINAL'),
          },
          branch: createReference(7005, 'Центр закрытия', 'FINAL'),
          signal: createReference(9001, 'Норма', 'GREEN'),
        },
        {
          processId: 502,
          processName: 'Публикация итоговой версии',
          sortPriority: 1,
          plannedOffsetMinutes: -85,
          plannedDurationMinutes: 25,
          actualStartShiftMinutes: -1,
          actualDurationMinutes: 19,
          statusCode: 'COMPLETED',
          statusName: 'Завершён',
          commentFinish: 'Итоговая версия опубликована вовремя.',
          isSentToSutp: true,
          manualCompletionAllowed: false,
          systemType: createReference(10, 'PUBLISH', 'PUB'),
          accomplishmentType: createReference(10, 'Автоматически', 'AUTO'),
          organizationTypes: [
            createReference(100, 'Банк', 'BANK'),
            createReference(101, 'Филиал', 'BRANCH'),
          ],
          unit: {
            id: 5002,
            name: 'Сервис публикации',
            code: 'PUB-SVC',
            department: createReference(5007, 'Финализация', 'FINAL'),
          },
          branch: createReference(7005, 'Центр закрытия', 'FINAL'),
          signal: createReference(9001, 'Норма', 'GREEN'),
        },
      ],
    },
  ];
};

const buildProcessModel = (
  stageId: number,
  seed: ProcessSeed,
  anchorDate: Date,
): ProcessApiModel => {
  const regulationDateTimeStart = addMinutes(anchorDate, seed.plannedOffsetMinutes);
  const regulationDateTimeFinish = addMinutes(
    regulationDateTimeStart,
    seed.plannedDurationMinutes,
  );
  const factTimeStart =
    seed.actualStartShiftMinutes === null
      ? null
      : addMinutes(regulationDateTimeStart, seed.actualStartShiftMinutes);
  const factTimeFinish =
    factTimeStart === null || seed.actualDurationMinutes === null
      ? null
      : addMinutes(factTimeStart, seed.actualDurationMinutes);
  const regDuration = toDurationMs(seed.plannedDurationMinutes);
  const factDuration = toDurationMs(seed.actualDurationMinutes);
  const deltaDuration =
    regDuration === null || factDuration === null ? null : factDuration - regDuration;
  const isExpired = Boolean(deltaDuration && deltaDuration > 0);
  const processStatus: ProcessStatusApiModel = {
    code: seed.statusCode,
    name: seed.statusName,
  };

  return {
    processId: seed.processId,
    processName: seed.processName,
    stageId,
    sortPriority: seed.sortPriority,
    processStatus,
    regulationDateTimeStart: formatISO(regulationDateTimeStart),
    regulationDateTimeFinish: formatISO(regulationDateTimeFinish),
    factTimeStart: factTimeStart ? formatISO(factTimeStart) : null,
    factTimeFinish: factTimeFinish ? formatISO(factTimeFinish) : null,
    regDuration,
    factDuration,
    deltaDuration,
    commentFinish: seed.commentFinish,
    isExpired,
    isSentToSutp: seed.isSentToSutp,
    manualCompletionAllowed: seed.manualCompletionAllowed,
    systemType: seed.systemType,
    accomplishmentType: seed.accomplishmentType,
    organizationTypes: seed.organizationTypes,
    unit: {
      ...seed.unit,
      department: seed.unit.department,
    },
    branch: seed.branch,
    startConditions: [
      {
        startTypeCode: seed.sortPriority === 0 ? 'BY_SCHEDULE' : 'AFTER_PROCESS',
        systemCode: seed.systemType.code,
        startEventId: seed.processId * 10,
        stageId,
        processId: seed.processId,
      },
    ],
    finishEvent: {
      id: seed.processId * 100,
      description: `Фиксация завершения процесса "${seed.processName}"`,
      eventCode: `EVT_${seed.systemType.code}_${seed.processId}`,
      processCode: `PROC_${seed.processId}`,
      system: seed.systemType,
    },
    signal: seed.signal,
    newExecutionDate: null,
  };
};

const buildStageModel = (seed: StageSeed, anchorDate: Date): StageApiModel => {
  const processes = seed.processes
    .slice()
    .sort((left, right) => left.sortPriority - right.sortPriority)
    .map((processSeed) => buildProcessModel(seed.stageId, processSeed, anchorDate));
  const regulationStarts = processes
    .map((process) => process.regulationDateTimeStart)
    .filter((value): value is string => Boolean(value));
  const regulationFinishes = processes
    .map((process) => process.regulationDateTimeFinish)
    .filter((value): value is string => Boolean(value));
  const factStarts = processes
    .map((process) => process.factTimeStart)
    .filter((value): value is string => Boolean(value));
  const factFinishes = processes
    .map((process) => process.factTimeFinish)
    .filter((value): value is string => Boolean(value));
  const regDuration = processes.reduce<number>((sum, process) => {
    return sum + (typeof process.regDuration === 'number' ? process.regDuration : 0);
  }, 0);
  const factDuration = processes.reduce<number>((sum, process) => {
    return sum + (typeof process.factDuration === 'number' ? process.factDuration : 0);
  }, 0);
  const completedProcessCount = processes.filter((process) => Boolean(process.factTimeFinish)).length;
  const progressPercent =
    processes.length === 0 ? 0 : Math.round((completedProcessCount / processes.length) * 100);

  return {
    stageId: seed.stageId,
    stageName: seed.stageName,
    sortPriority: seed.sortPriority,
    regulationStageTimeStart: regulationStarts[0] ?? null,
    regulationStageTimeFinish: regulationFinishes[regulationFinishes.length - 1] ?? null,
    factStageTimeStart: factStarts[0] ?? null,
    factStageTimeFinish: factFinishes[factFinishes.length - 1] ?? null,
    regDuration,
    factDuration,
    deltaDuration: factDuration - regDuration,
    progressPercent,
    processes,
  };
};

const createMockTimelineResponse = (businessDate: string): TimelineResponse => {
  const anchorDate = buildAnchorDate(businessDate);
  const stages = buildStageSeeds().map((stageSeed) => buildStageModel(stageSeed, anchorDate));

  return {
    businessDate,
    generatedAt: new Date().toISOString(),
    stages,
  };
};

const getOrCreateTimeline = (businessDate: string): TimelineResponse => {
  const existingResponse = mockStore.get(businessDate);

  if (existingResponse && existingResponse.stages.length >= EXPECTED_STAGE_COUNT) {
    existingResponse.generatedAt = new Date().toISOString();
    return existingResponse;
  }

  const response = createMockTimelineResponse(businessDate);
  mockStore.set(businessDate, response);
  return response;
};

const updateProcess = (
  businessDate: string,
  processId: number,
  updater: (process: ProcessApiModel) => ProcessApiModel,
): void => {
  const response = getOrCreateTimeline(businessDate);

  response.stages = response.stages.map((stage) => ({
    ...stage,
    processes: stage.processes.map((process) => {
      const currentProcessId = process.processId ?? process.id ?? 0;

      if (currentProcessId !== processId) {
        return process;
      }

      return updater(process);
    }),
  }));

  response.generatedAt = new Date().toISOString();
  mockStore.set(businessDate, response);
};

export const getMockTimeline = async (businessDate: string): Promise<TimelineResponse> => {
  return cloneTimelineResponse(getOrCreateTimeline(businessDate));
};

export const updateMockProcessComment = async (
  businessDate: string,
  request: UpdateProcessCommentRequest,
): Promise<void> => {
  updateProcess(businessDate, request.processId, (process) => ({
    ...process,
    commentFinish: request.comment,
    comment: request.comment,
  }));
};

export const updateMockProcessExecutionDate = async (
  businessDate: string,
  request: UpdateProcessExecutionDateRequest,
): Promise<void> => {
  updateProcess(businessDate, request.processId, (process) => ({
    ...process,
    newExecutionDate: request.executionDate,
  }));
};
