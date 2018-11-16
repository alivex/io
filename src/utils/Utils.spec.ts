import test from 'ava';
import { stub } from 'sinon';
import * as browserEnv from 'browser-env';
import { Utils } from './Utils';

browserEnv(['window', 'URLSearchParams']);

test('should return the value of the search param "test"', t => {
  stub(window, 'location').value({ search: '?test=foo' });
  t.is(Utils.getParam('test', 'bar'), 'foo');
});

test('should return the default value when the requested search param is missing', t => {
  stub(window, 'location').value({ search: '?test=foo' });
  t.is(Utils.getParam('hello', 'bar'), 'bar');
});
