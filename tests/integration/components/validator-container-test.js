import { module, skip, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { fillIn, click, render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import sinon from 'sinon';

module('Integration | Component | shared/validator-container', (hooks) => {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    this.onSubmit = sinon.stub();
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
    this.validator = ({ field1, field2 }) => {
      return {
        field1: field1 % 2 === 0,
        field2: field2 % 2 === 1,
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
          @validators={{this.validator}}
          as |validity|>
          <input
            required
            value={{this.model.field1}}
            name="field1"
            {{on "input" this.onInput1}}
          }}
          {{#if validity.errorMessage.field1}}
            <p data-test-error="field1">{{validity.errorMessage.field1}}</p>
          {{/if}}
        {{/v.validity}}

        <v.validity
          @model={{hash field2=this.model.field2}}
          @validators={{this.validator}}
          as |validity|>
          <input
            required
            value={{this.model.field2}}
            name="field2"
            {{on "input" this.onInput2}}
          }}
          {{#if validity.errorMessage.field2}}
            <p data-test-error="field2">{{validity.errorMessage.field2}}</p>
          {{/if}}
        {{/v.validity}}

        <button data-test-cta {{on "click" (fn v.checkForm this.onSubmit)}}>save</button>
      {{/ember-ts-job-posting$shared/validator-container}}
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
      .exits('global error should be rendered');
    // assert.dom('[data-test-error="apply-method"]').hasText(LINKEDIN_URL_ERROR);
    // assert
      // .dom('[data-test-error="simple-email"]')
      // .hasText(LINKEDIN_EMAIL_ERROR);
    // assert
      // .dom('input[name="simple-email"]')
      // .isFocused('the first invalid element should be focused');
    // assert.notOk(
      // this.onSubmit.called,
      // 'submit callback stopped because form validation failed'
    // );

    // // fix everything
    // await fillIn('input[name="apply-method-value"]', 'https://www.google.com');
    // assert.dom('[data-test-error="apply-method"]').doesNotExist();
    // await fillIn('input[name="simple-email"]', 'bear@gmail.com');
    // assert.dom('[data-test-error="simple-email"]').doesNotExist();

    // await click('[data-test-submit]');
    // assert.ok(
      // this.onSubmit.called,
      // 'submit callback went thru because form validation passed'
    // );
  });
});
