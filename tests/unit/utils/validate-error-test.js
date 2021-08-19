import {
  isValidationKeyMatch,
  isEmptyValidationError,
  isValidValidationError,
} from 'ember-form-validity/utils/validate-error';
import { module, test } from 'qunit';
import { htmlSafe } from '@ember/template';

module('Unit | Utility | validate-error', function () {
  test('isValidValidationError', function (assert) {
    assert.notOk(isValidValidationError(''));
    assert.notOk(isValidValidationError([]));
    assert.notOk(isValidValidationError(null));
    assert.notOk(isValidValidationError(123));
    assert.notOk(isValidValidationError({ foo: [] }));
    assert.notOk(isValidValidationError({ foo: () => {} }));
    assert.notOk(isValidValidationError({ foo: {} }));
    assert.ok(isValidValidationError({ foo: '123' }));
    assert.ok(isValidValidationError({ foo: htmlSafe('123') }));
  });
  test('isEmptyValidationError', function (assert) {
    assert.ok(isEmptyValidationError({}));
    assert.ok(isEmptyValidationError({ name: '', bar: '' }));
    assert.notOk(isEmptyValidationError({ name: '123', bar: '' }));
    assert.notOk(isEmptyValidationError({ name: htmlSafe('655'), bar: '' }));
  });
  test('isValidationKeyMatch', function (assert) {
    assert.notOk(isValidationKeyMatch());
    assert.notOk(isValidationKeyMatch({ name: '123', bar: '54' }, ['name']));
    assert.ok(isValidationKeyMatch({ name: '123' }, ['name', 'bar']));
  });
});
