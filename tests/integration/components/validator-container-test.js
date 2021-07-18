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
      <ValidatorContainer
        @validating={{true}}
        as |v|>
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
      <ValidatorContainer
        @validating={{true}}
        as |v|>
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

    await this.pauseTest()
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

  // skip('it can validate form when validating = false by default', async function (assert) {
  // this.applyMethod = { methodType: 'url', value: `/talent/post-a-job` };
  // this.validateApplyMethod = validateApplyMethod;
  // this.notLinkedinEmail = notLinkedinEmail;
  // this.notMsEmail = notMsEmail;
  // this.emailValue = 'bear@linkedin.com';

  // await render(hbs`
  // {{#ember-ts-job-posting$shared/validator-container
  // validating=false
  // as |v|
  // }}
  // {{#unless v.isValid}}
  // <p data-test-global-error>something wrong</p>
  // {{/unless}}

  // {{#v.validity
  // validators=(array this.notLinkedinEmail this.notMsEmail)
  // as |validity|
  // }}
  // {{simple-email-field
  // required=true
  // value=this.emailValue
  // name="simple-email"
  // onValidate=validity.validator
  // }}
  // {{#if validity.errorMessage}}
  // <p id="abc3" data-test-error="simple-email">{{validity.errorMessage}}</p>
  // {{/if}}
  // {{/v.validity}}

  // {{#v.validity
  // validators=(array this.validateApplyMethod)
  // as |validity|
  // }}
  // {{complex-input-field
  // applyMethod=this.applyMethod
  // describedById="abc3"
  // validating=v.validating
  // required=true
  // onValidate=validity.validator
  // }}
  // {{#if validity.errorMessage}}
  // <p id="abc3" data-test-error="apply-method">{{validity.errorMessage}}</p>
  // {{/if}}
  // {{/v.validity}}

  // <button onClick={{action v.checkForm this.onSubmit}} data-test-submit>continue</button>
  // {{/ember-ts-job-posting$shared/validator-container}}
  // `);

  // assert.dom('[data-test-validator-container]').exists();
  // assert
  // .dom('[data-test-error]')
  // .doesNotExist('No error displayed since validating is false');

  // await click('[data-test-submit]');
  // assert
  // .dom('[data-test-global-error]')
  // .hasText('something wrong', 'global error should be rendered');
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
  // });
});
