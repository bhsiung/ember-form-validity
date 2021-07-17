import { intersection } from 'ember-form-validation/utils/array-helpers';
import { module, test } from 'qunit';

module('Unit | Utility | array-helpers', function () {
  test('it works', function (assert) {
    assert.deepEqual(intersection([1, 2, 3], [2, 1]), [1, 2]);
    assert.deepEqual(intersection([], [2, 1]), []);
  });
});
