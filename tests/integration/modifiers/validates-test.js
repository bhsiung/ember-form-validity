import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { fillIn, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module('Integration | Modifier | validates', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function beforeEach() {
    this.validator = sinon.stub();
    const that = this;
    this.onInput = function (e) {
      const element = e.target;
      that.set('value', element.value);
    };
  });
  // Replace this with your real tests.
  test('it renders', async function (assert) {
    this.value = '';
    await render(hbs`
      <div {{validates this.validator value=this.value}}>
        <input data-test-input value={{this.value}} onInput={{fn this.onInput}} />
      </div>
    `);
    const dom = document.querySelector('[data-test-input]');
    assert.ok(
      this.validator.calledWithExactly(dom, ''),
      'value passed into the validator initially'
    );
    await fillIn('[data-test-input]', 'foo');
    assert.ok(
      this.validator.calledWithExactly(dom, 'foo'),
      'value passed into the validator on change'
    );
    this.set('value', 'bar');
    assert.ok(
      this.validator.calledWithExactly(dom, 'bar'),
      'value passed into the validator on change'
    );
    // assert.ok(this.validator.calledTwice, 'validator has been called twice');
  });
  test('can handle when artificial input element (RTE)', async function (assert) {
    assert.ok(1);
  });
});
