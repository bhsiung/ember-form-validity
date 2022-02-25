import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module('Integration | Modifier | registerElement', function (hooks) {
  setupRenderingTest(hooks);

  // Replace this with your real tests.
  test('it renders', async function (assert) {
    const onInsert = sinon.stub();
    this.setProperties({ onInsert });
    await render(
      hbs`<div data-test-element {{register-element this.onInsert}}></div>`
    );

    assert.ok(
      onInsert.calledWithExactly(document.querySelector('[data-test-element]'))
    );
  });
});
