type LogLevel = "fatal" | "error" | "warn" | "info" | "debug" | "trace";

const isServer = typeof window === "undefined";
const isProd = process.env.NODE_ENV === "production";
const level: LogLevel = (process.env.LOG_LEVEL as LogLevel) || (isProd ? "info" : "debug");

const levelPriority: Record<LogLevel, number> = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  fatal: 5,
};

const redactionPaths = [
  "password",
  "token",
  "secret",
  "authorization",
  "cookie",
  "apiKey",
  "api_key",
  "bearer",
];

function redact(obj: Record<string, unknown>): Record<string, unknown> {
  const redacted: Record<string, unknown> = {};
  for (const key in obj) {
    if (redactionPaths.some((p) => key.toLowerCase().includes(p))) {
      redacted[key] = "[REDACTED]";
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      redacted[key] = redact(obj[key] as Record<string, unknown>);
    } else {
      redacted[key] = obj[key];
    }
  }
  return redacted;
}

function formatMessage(
  level: LogLevel,
  msg: string,
  meta?: Record<string, unknown>,
  moduleName?: string
): string {
  const timestamp = new Date().toISOString();
  const levelStr = level.toUpperCase().padStart(5);
  const moduleStr = moduleName ? `[${moduleName}] ` : "";

  if (isProd) {
    return JSON.stringify({
      timestamp,
      level,
      msg,
      module: moduleName,
      ...redact(meta || {}),
    });
  }

  const metaStr = meta && Object.keys(meta).length > 0
    ? " " + JSON.stringify(redact(meta), null, 0).replace(/\n/g, " ")
    : "";

  return `[${timestamp}] ${levelStr} ${moduleStr}${msg}${metaStr}`;
}

class Logger {
  private level: LogLevel;

  constructor(level: LogLevel = "info") {
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return levelPriority[level] >= levelPriority[this.level];
  }

  private log(level: LogLevel, msg: string, meta?: Record<string, unknown>) {
    if (!this.shouldLog(level)) return;

    const formatted = formatMessage(level, msg, meta);

    switch (level) {
      case "trace":
      case "debug":
        console.debug(formatted);
        break;
      case "info":
        console.info(formatted);
        break;
      case "warn":
        console.warn(formatted);
        break;
      case "error":
      case "fatal":
        console.error(formatted);
        break;
    }
  }

  createModuleLogger(module: string) {
    return {
      trace: (msg: string, meta?: Record<string, unknown>) =>
        this.log("trace", msg, { ...meta, module }),
      debug: (msg: string, meta?: Record<string, unknown>) =>
        this.log("debug", msg, { ...meta, module }),
      info: (msg: string, meta?: Record<string, unknown>) =>
        this.log("info", msg, { ...meta, module }),
      warn: (msg: string, meta?: Record<string, unknown>) =>
        this.log("warn", msg, { ...meta, module }),
      error: (msg: string, meta?: Record<string, unknown>) =>
        this.log("error", msg, { ...meta, module }),
      fatal: (msg: string, meta?: Record<string, unknown>) =>
        this.log("fatal", msg, { ...meta, module }),
    };
  }

  trace(msg: string, meta?: Record<string, unknown>) {
    this.log("trace", msg, meta);
  }
  debug(msg: string, meta?: Record<string, unknown>) {
    this.log("debug", msg, meta);
  }
  info(msg: string, meta?: Record<string, unknown>) {
    this.log("info", msg, meta);
  }
  warn(msg: string, meta?: Record<string, unknown>) {
    this.log("warn", msg, meta);
  }
  error(msg: string, meta?: Record<string, unknown>) {
    this.log("error", msg, meta);
  }
  fatal(msg: string, meta?: Record<string, unknown>) {
    this.log("fatal", msg, meta);
  }
}

export const logger = new Logger(level);
