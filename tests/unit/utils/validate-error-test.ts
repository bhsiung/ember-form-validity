import {
  isValidationKeyMatch,
  isEmptyValidationError,
} from 'ember-form-validity/utils/validate-error';
import { module, test } from 'qunit';
import { htmlSafe } from '@ember/template';

module('Unit | Utility | validate-error', function () {
  test('isEmptyValidationError', function (assert) {
    assert.ok(isEmptyValidationError({}));
    assert.ok(isEmptyValidationError({ name: '', bar: '' }));
    assert.notOk(isEmptyValidationError({ name: '123', bar: '' }));
    assert.notOk(isEmptyValidationError({ name: htmlSafe('655'), bar: '' }));
  });
  test('isValidationKeyMatch', function (assert) {
    assert.notOk(isValidationKeyMatch({ name: '123', bar: '54' }, ['name']));
    assert.ok(isValidationKeyMatch({ name: '123' }, ['name', 'bar']));
  });
});
