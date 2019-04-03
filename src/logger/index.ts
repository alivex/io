/* eslint-disable require-jsdoc */

export interface IOLogger {
  log(message?: any, ...optionalParams: any[]);
  debug(message?: any, ...optionalParams: any[]);
  warn(message?: any, ...optionalParams: any[]);
  error(message?: any, ...optionalParams: any[]);
}

export class Logger {
  private static logger: IOLogger = console;

  static setLoggerInstance(instance: IOLogger): void {
    this.logger = instance;
  }

  static log(message?: any, ...optionalParams: any[]): void {
    this.logger.log(message, ...optionalParams);
  }

  static debug(message?: any, ...optionalParams: any[]): void {
    this.logger.debug(message, ...optionalParams);
  }

  static warn(message?: any, ...optionalParams: any[]): void {
    this.logger.warn(message, ...optionalParams);
  }

  static error(message?: any, ...optionalParams: any[]): void {
    this.logger.error(message, ...optionalParams);
  }
}
