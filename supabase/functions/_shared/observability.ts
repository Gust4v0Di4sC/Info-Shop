type LogLevel = 'INFO' | 'WARN' | 'ERROR';

export interface LogContext {
  functionName: string;
  requestId: string;
  startedAt: number;
}

interface LogFields {
  durationMs?: number;
  status?: number | string;
  userId?: string;
  orderId?: string;
  provider?: string;
  errorMessage?: string;
  [key: string]: unknown;
}

export function createLogContext(req: Request, functionName: string): LogContext {
  return {
    functionName,
    requestId: req.headers.get('x-request-id') || crypto.randomUUID(),
    startedAt: performance.now(),
  };
}

export function requestId(context: LogContext): string {
  return context.requestId;
}

export function durationMs(context: LogContext): number {
  return Math.round(performance.now() - context.startedAt);
}

export function logInfo(context: LogContext, event: string, fields: LogFields = {}): void {
  writeLog('INFO', context, event, fields);
}

export function logWarn(context: LogContext, event: string, fields: LogFields = {}): void {
  writeLog('WARN', context, event, fields);
}

export function logError(context: LogContext, event: string, error: unknown, fields: LogFields = {}): void {
  writeLog('ERROR', context, event, {
    ...fields,
    errorMessage: errorMessage(error),
  });
}

export function logCompleted(context: LogContext, event: string, status: number, fields: LogFields = {}): void {
  writeLog(status >= 500 ? 'ERROR' : status >= 400 ? 'WARN' : 'INFO', context, event, {
    ...fields,
    status,
    durationMs: durationMs(context),
  });
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function writeLog(level: LogLevel, context: LogContext, event: string, fields: LogFields): void {
  const entry = {
    level,
    event,
    requestId: context.requestId,
    functionName: context.functionName,
    timestamp: new Date().toISOString(),
    ...withoutUndefined(fields),
  };
  const line = JSON.stringify(entry);

  if (level === 'ERROR') {
    console.error(line);
    return;
  }

  if (level === 'WARN') {
    console.warn(line);
    return;
  }

  console.log(line);
}

function withoutUndefined(fields: LogFields): LogFields {
  return Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  ) as LogFields;
}
