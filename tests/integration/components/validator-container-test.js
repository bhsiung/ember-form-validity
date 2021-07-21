import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { fillIn, click, render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import sinon from 'sinon';

module('Integration | Component | validator-container', (hooks) => {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    this.onSubmit = sinon.spy((e) => {
      e.preventDefault();
    });
  });

  test('it renders', async function (assert) {
    await render(hbs`
      <ValidatorContainer @validating={{false}} as |v|>
				{{#unless v.isValid}}
					<p data-test-global-error>something wrong</p>
				{{/unless}}
      </ValidatorContainer>
    `);

    assert.dom('[data-test-validator-container]').exists();
    assert.dom('[data-test-global-error]').doesNotExist();
  });

  test('it can validate form when validating = true by default', async function (assert) {
    this.model = { email: '' };
    this.onInput = (e) => {
      this.set('model', { email: e.target.value });
    };

    await render(hbs`
      <ValidatorContainer @validating={{true}} as |v|>
        {{#unless v.isValid}}
          <p data-test-global-error>something wrong</p>
        {{/unless}}
        <v.validity @model={{this.model}} as |validity|>
          <input {{on "input" this.onInput}}
            type="email"
            name="email"
            required
            value={{this.model.email}} />
          {{#if validity.errorMessage.email}}
            <p data-test-error>{{validity.errorMessage.email}}</p>
          {{/if}}
        </v.validity>
        <button {{on "click" (fn v.checkForm this.onSubmit)}}>save</button>
      </ValidatorContainer>
  `);

    assert
      .dom('[data-test-validator-container]')
      .exists('global error message displayed due to error in the form');
    assert
      .dom('[data-test-global-error]')
      .exists('required field validation error (constraint validation)');
    assert
      .dom('[data-test-error]')
      .exists('required field validation error (constraint validation)');
  });

  test('it can validate form when validating = false by default', async function (assert) {
    this.validator1 = ({ field1 }) => {
      return {
        field1: field1 % 2 === 0 ? '' : 'bad',
      };
    };
    this.validator2 = ({ field2 }) => {
      return {
        field2: field2 % 2 === 1 ? '' : 'bad',
      };
    };
    this.model = { field1: '', field2: '' };
    this.onInput1 = (e) => {
      this.set('model', { ...this.model, field1: e.target.value });
    };
    this.onInput2 = (e) => {
      this.set('model', { ...this.model, field2: e.target.value });
    };

    await render(hbs`
      <ValidatorContainer @validating={{false}} as |v|>
        {{#unless v.isValid}}
          <p data-test-global-error>something wrong</p>
        {{/unless}}

        <v.validity
          @model={{hash field1=this.model.field1}}
          @validator={{this.validator1}}
          as |validity|>
          <input
            required
            value={{this.model.field1}}
            name="field1"
            {{on "input" this.onInput1}}
          />
          {{#if validity.errorMessage.field1}}
            <p data-test-error="field1">{{validity.errorMessage.field1}}</p>
          {{/if}}
        </v.validity>

        <v.validity
          @model={{hash field2=this.model.field2}}
          @validator={{this.validator2}}
          as |validity|>
          <input
            value={{this.model.field2}}
            name="field2"
            {{on "input" this.onInput2}}
          />
          {{#if validity.errorMessage.field2}}
            <p data-test-error="field2">{{validity.errorMessage.field2}}</p>
          {{/if}}
        </v.validity>

        <button data-test-cta {{on "click" (fn v.checkForm this.onSubmit)}}>save</button>
      </ValidatorContainer>
  `);

    assert
      .dom('[data-test-error]')
      .doesNotExist('No error displayed since validating is false');
    assert
      .dom('[data-test-global-error]')
      .doesNotExist('No error displayed since validating is false');

    await click('[data-test-cta]');
    assert
      .dom('[data-test-global-error]')
      .exists('global error should be rendered');
    assert.dom('[data-test-error="field1"]').exists('field1 has error message');
    assert.dom('[data-test-error="field2"]').exists('field2 has error message');
    assert
      .dom('input[name="field1"]')
      .isFocused('the first invalid element should be focused');
    assert.notOk(
      this.onSubmit.called,
      'submit callback stopped because form validation failed'
    );

    // fix field1
    await fillIn('input[name="field1"]', '0');
    assert.dom('[data-test-error="field1"]').doesNotExist();
    assert.dom('[data-test-error="field2"]').exists();
    assert.dom('[data-test-global-error]').exists();

    // fix field2
    await fillIn('input[name="field2"]', '0');
    await click('[data-test-cta]');
    assert.dom('[data-test-error="field2"]').exists();
    assert.notOk(
      this.onSubmit.called,
      'submit callback stopped because form validation failed'
    );
    await fillIn('input[name="field2"]', '1');
    assert.dom('[data-test-error="field2"]').doesNotExist();
    assert.dom('[data-test-global-error]').doesNotExist();

    await click('[data-test-cta]');
    assert.ok(
      this.onSubmit.called,
      'submit callback went thru because form validation passed'
    );
  });
});
