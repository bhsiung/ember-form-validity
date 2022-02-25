import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { click, fillIn, render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import sinon from 'sinon';
declare interface InputEvent<T> {
  target: { value: T };
}
/* eslint-disable ember/no-get */
module('Integration | Component | validator-container', (hooks) => {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    this.set('onSubmit', sinon.stub());
  });

  test('it renders', async function (assert) {
    await render(hbs`
      <ValidatorContainer class="test-class" @validating={{false}} as |v|>
				{{#unless v.isValid}}
					<p data-test-global-error>something wrong</p>
				{{/unless}}
      </ValidatorContainer>
    `);

    assert.dom('[data-test-validator-container]').exists();
    assert.dom('[data-test-global-error]').doesNotExist();
    assert
      .dom('[data-test-validator-container]')
      .hasClass('test-class', 'the attributes are forwarded');
  });

  test('it can validate form when validating = true by default', async function (assert) {
    this.set('model', { email: '' });
    this.set('onInput', (e: InputEvent<string>) => {
      this.set('model.email', e.target.value);
    });

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
      .dom('[data-test-global-error]')
      .exists('global error message displayed due to error in the form');
    assert
      .dom('[data-test-global-error]')
      .exists('required field validation error (constraint validation)');
    assert
      .dom('[data-test-error]')
      .exists('required field validation error (constraint validation)');
  });

  test('it can validate form when validating = false by default', async function (assert) {
    this.setProperties({
      validator1: ({ field1 }: { field1: number }) => {
        return {
          field1: field1 % 2 === 0 ? '' : 'bad',
        };
      },
      validator2: ({ field2 }: { field2: number }) => {
        return {
          field2: field2 % 2 === 1 ? '' : 'bad',
        };
      },
      model: { field1: '', field2: '' },
      onInput1: (e: InputEvent<number>) => {
        this.set('model.field1', e.target.value);
      },
      onInput2: (e: InputEvent<number>) => {
        this.set('model.field2', e.target.value);
      },
    });

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
      this.get('onSubmit.called'),
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
      this.get('onSubmit.called'),
      'submit callback stopped because form validation failed'
    );
    await fillIn('input[name="field2"]', '1');
    assert.dom('[data-test-error="field2"]').doesNotExist();
    assert.dom('[data-test-global-error]').doesNotExist();

    await click('[data-test-cta]');
    assert.ok(
      this.get('onSubmit.called'),
      'submit callback went thru because form validation passed'
    );
  });

  test('it can validate field dynamically', async function (assert) {
    this.setProperties({
      model: { email: '' },
      showEmailField: true,
      onInput: (e: InputEvent<string>) => {
        this.set('model.email', e.target.value);
      },
      onToggle: (e: { preventDefault: () => void }) => {
        e.preventDefault();
        this.set('showEmailField', !this.get('showEmailField'));
      },
    });
    await render(hbs`
      <ValidatorContainer @validating={{true}} as |v|>
        {{#unless v.isValid}}
          <p data-test-global-error>something wrong</p>
        {{/unless}}

        <button data-test-toggler {{on "click" this.onToggle}}>toggle email field</button>
        {{#if this.showEmailField}}
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
        {{/if}}
        <button data-test-save {{on "click" (fn v.checkForm this.onSubmit)}}>save</button>
      </ValidatorContainer>
  `);

    assert
      .dom('[data-test-global-error]')
      .exists('global error message displayed due to error in the form');

    // remove email field
    await click('[data-test-toggler]');
    assert
      .dom('[data-test-global-error]')
      .doesNotExist(
        'global error message is removed because the invalid field has been removed'
      );
    await click('[data-test-save]');
    assert.ok(
      this.get('onSubmit.called'),
      'onSubmit should be executed because the form is now valid'
    );

    // reveal email field
    (this.get('onSubmit') as sinon.SinonStub)?.resetHistory();
    await click('[data-test-toggler]');
    assert
      .dom('[data-test-global-error]')
      .exists('global error message resumed');
    await click('[data-test-save]');
    assert.notOk(
      (this.get('onSubmit') as sinon.SinonStub).called,
      'onSubmit should not be executed because the form is now invalid again'
    );
  });
});
