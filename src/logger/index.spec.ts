import test from 'ava';
import { spy } from 'sinon';
import { Logger } from './';

test('Logger.log', t => {
  const mockLogger = {
    log: spy(),
    debug: spy(),
    warn: spy(),
    error: spy(),
  };

  Logger.setLoggerInstance(mockLogger);
  Logger.log('hello');

  t.true(mockLogger.log.calledWith('hello'));
});

test('Logger.debug', t => {
  const mockLogger = {
    log: spy(),
    debug: spy(),
    warn: spy(),
    error: spy(),
  };

  Logger.setLoggerInstance(mockLogger);
  Logger.debug('hello');

  t.true(mockLogger.debug.calledWith('hello'));
});

test('Logger.warn', t => {
  const mockLogger = {
    log: spy(),
    debug: spy(),
    warn: spy(),
    error: spy(),
  };

  Logger.setLoggerInstance(mockLogger);
  Logger.warn('hello');

  t.true(mockLogger.warn.calledWith('hello'));
});

test('Logger.error', t => {
  const mockLogger = {
    log: spy(),
    debug: spy(),
    warn: spy(),
    error: spy(),
  };

  Logger.setLoggerInstance(mockLogger);
  Logger.error('hello');

  t.true(mockLogger.error.calledWith('hello'));
});
