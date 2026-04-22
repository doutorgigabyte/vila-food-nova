const isDev = import.meta.env.DEV;

type LogFn = (...args: unknown[]) => void;

const noop: LogFn = () => {};

export const logger = {
  debug: isDev ? console.debug.bind(console) : noop,
  info: isDev ? console.info.bind(console) : noop,
  warn: console.warn.bind(console),
  error: console.error.bind(console),
};
