export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogRecord {
  timestamp: string;
  level: LogLevel;
  scope: string;
  message: string;
  data?: unknown;
}

export type LogSink = (record: LogRecord) => void;

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function formatRecord(record: LogRecord): string {
  const prefix = `${record.timestamp} ${record.level.toUpperCase()} [${record.scope}]`;
  if (record.data === undefined) {
    return `${prefix} ${record.message}`;
  }

  let serialized: string;
  try {
    serialized = JSON.stringify(record.data);
  } catch (error) {
    serialized = `[unserializable data: ${error instanceof Error ? error.message : String(error)}]`;
  }

  return `${prefix} ${record.message} ${serialized}`;
}

function consoleSink(record: LogRecord): void {
  const line = formatRecord(record);
  if (record.level === 'error') {
    console.error(line);
  } else if (record.level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export class Logger {
  constructor(
    private readonly scope: string,
    private readonly minimumLevel: LogLevel = 'info',
    private readonly sink: LogSink = consoleSink,
  ) {
    if (scope.trim() === '') {
      throw new Error('Logger scope must not be empty.');
    }
  }

  child(scope: string): Logger {
    if (scope.trim() === '') {
      throw new Error('Child logger scope must not be empty.');
    }

    return new Logger(`${this.scope}.${scope}`, this.minimumLevel, this.sink);
  }

  debug(message: string, data?: unknown): void {
    this.write('debug', message, data);
  }

  info(message: string, data?: unknown): void {
    this.write('info', message, data);
  }

  warn(message: string, data?: unknown): void {
    this.write('warn', message, data);
  }

  error(message: string, data?: unknown): void {
    this.write('error', message, data);
  }

  private write(level: LogLevel, message: string, data?: unknown): void {
    if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[this.minimumLevel]) {
      return;
    }
    if (message.trim() === '') {
      throw new Error('Log message must not be empty.');
    }

    const record: LogRecord = {
      timestamp: new Date().toISOString(),
      level,
      scope: this.scope,
      message,
      ...(data === undefined ? {} : { data }),
    };
    this.sink(record);
  }
}

export function createLogger(
  scope: string,
  minimumLevel: LogLevel = 'info',
  sink?: LogSink,
): Logger {
  return new Logger(scope, minimumLevel, sink);
}
