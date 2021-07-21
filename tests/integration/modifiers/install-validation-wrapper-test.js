import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module('Integration | Modifier | install-validation-wrapper', function (hooks) {
  setupRenderingTest(hooks);

  // Replace this with your real tests.
  test('it renders', async function (assert) {
    this.onInsert = sinon.stub();
    this.onUpdate = sinon.stub();
    this.model = {};
    await render(
      hbs`<div data-test-element {{install-validation-wrapper this.model onInsert=this.onInsert onUpdate=this.onUpdate}}></div>`
    );
    const element = document.querySelector('[data-test-element]');

    assert.ok(this.onInsert.calledOnce, 'onInsert called after installation');
    assert.ok(
      this.onInsert.calledWithExactly(element),
      'onInsert called with proper params after installation'
    );
    assert.notOk(
      this.onUpdate.calledOnce,
      'onUpdate is not called after installation'
    );
    this.set('model', { foo: 'bar' });
    assert.ok(this.onInsert.calledOnce, 'onInsert is not invoked on update');
    assert.ok(this.onUpdate.calledOnce, 'onUpdate is called once after change');
    assert.ok(
      this.onUpdate.calledWithExactly(element, this.model),
      'update gets called with the proper parameters'
    );
  });
});
