import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module('Integration | Modifier | installNameAttr', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders on <input> (without selector)', async function (assert) {
    await render(
      hbs`
        <div data-test-element {{install-name-attr "the-name"}}>
          <p><input/></p>
        </div>
      `
    );
    assert.dom('input').hasAttribute('name', 'the-name');
  });

  test('it renders on <select> (without selector)', async function (assert) {
    await render(
      hbs`
        <div data-test-element {{install-name-attr "the-name"}}>
          <p>
            <select>
              <option>foo</option>
            </select>
          </p>
        </div>
      `
    );

    assert.dom('select').hasAttribute('name', 'the-name');
  });

  test('it renders on any field when the selector match', async function (assert) {
    await render(
      hbs`
        <div data-test-element {{install-name-attr "the-name" "p>input"}}>
          <p><select/></p>
          <p><input data-test-foo /></p>
        </div>
      `
    );
    assert.dom('[data-test-foo]').hasAttribute('name', 'the-name');
  });
});
