import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { fillIn, click, render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import sinon from 'sinon';
import isMobileUtil from 'ember-ts-common/utils/is-mobile';
import { getEnvironmentHost } from 'ember-ts-common/utils/environment-host';

const LINKEDIN_EMAIL_ERROR = 'LINKEDIN_EMAIL_ERROR';
const LINKEDIN_URL_ERROR = 'LINKEDIN_URL_ERROR';
const MS_EMAIL_ERROR = 'MS_EMAIL_ERROR';

function notLinkedinEmail(value) {
  return /.+@linkedin\.com$/.test(value) ? { name: 'simple-email', message: LINKEDIN_EMAIL_ERROR } : null;
}

function notMsEmail(value) {
  return /.+@microsoft\.com$/.test(value) ? { name: 'simple-email', message: MS_EMAIL_ERROR } : null;
}

function validateApplyMethod({ methodType, value }) {
  if (methodType === 'email' && /^.+@linkedin.com$/.test(value)) {
    return {
      name: 'apply-method-value',
      message: LINKEDIN_EMAIL_ERROR
    };
  } else if (methodType === 'url' && /^.+linkedin.com/.test(value)) {
    return {
      name: 'apply-method-value',
      message: LINKEDIN_URL_ERROR
    };
  }

  return '';
}

module('Integration | Component | shared/validator-container', (hooks) => {
  setupRenderingTest(hooks);

  hooks.beforeEach(function() {
    this.onSubmit = sinon.stub();
  });

  test('it renders', async function(assert) {
    this.validating = true;

    await render(hbs`
      {{#ember-ts-job-posting$shared/validator-container
        validating=this.validating
        as |v|
      }}
				{{#unless v.isValid}}
					<p data-test-global-error>something wrong</p>
				{{/unless}}
      {{/ember-ts-job-posting$shared/validator-container}}
    `);

    assert.dom('[data-test-validator-container]').exists();
    assert.dom('[data-test-global-error]').doesNotExist();
  });

  test('it can validate form when validating = true by default', async function(assert) {
    this.applyMethod = { methodType: '', value: '' };
    this.validateApplyMethod = validateApplyMethod;

    await render(hbs`
      {{#ember-ts-job-posting$shared/validator-container
        validating=true
        as |v|
      }}
				{{#unless v.isValid}}
					<p data-test-global-error>something wrong</p>
				{{/unless}}
				{{#v.validity
					validators=(array this.validateApplyMethod)
					as |validity|
				}}
					{{complex-input-field
						applyMethod=this.applyMethod
						describedById="abc3"
						validating=v.validating
						required=true
						onValidate=validity.validator
					}}
          {{#if validity.errorMessage}}
            <p id="abc3" data-test-error="apply-method">{{validity.errorMessage}}</p>
          {{/if}}
				{{/v.validity}}
      {{/ember-ts-job-posting$shared/validator-container}}
    `);

    assert.dom('[data-test-validator-container]').exists();
    assert.dom('[data-test-error="apply-method"]').exists('required field validation error (constraint validation)');
  });

  test('it can validate form when validating = false by default', async function(assert) {
    this.applyMethod = { methodType: 'url', value: `${getEnvironmentHost()}/talent/post-a-job` };
    this.validateApplyMethod = validateApplyMethod;
    this.notLinkedinEmail = notLinkedinEmail;
    this.notMsEmail = notMsEmail;
    this.emailValue = 'bear@linkedin.com';

    await render(hbs`
      {{#ember-ts-job-posting$shared/validator-container
        validating=false
        as |v|
      }}
				{{#unless v.isValid}}
					<p data-test-global-error>something wrong</p>
				{{/unless}}

				{{#v.validity
					validators=(array this.notLinkedinEmail this.notMsEmail)
					as |validity|
				}}
					{{simple-email-field
						required=true
						value=this.emailValue
						name="simple-email"
						onValidate=validity.validator
					}}
          {{#if validity.errorMessage}}
            <p id="abc3" data-test-error="simple-email">{{validity.errorMessage}}</p>
          {{/if}}
				{{/v.validity}}

				{{#v.validity
					validators=(array this.validateApplyMethod)
					as |validity|
				}}
					{{complex-input-field
						applyMethod=this.applyMethod
						describedById="abc3"
						validating=v.validating
						required=true
						onValidate=validity.validator
					}}
          {{#if validity.errorMessage}}
            <p id="abc3" data-test-error="apply-method">{{validity.errorMessage}}</p>
          {{/if}}
				{{/v.validity}}

				<button onClick={{action v.checkForm this.onSubmit}} data-test-submit>continue</button>
      {{/ember-ts-job-posting$shared/validator-container}}
    `);

    assert.dom('[data-test-validator-container]').exists();
    assert.dom('[data-test-error]').doesNotExist('No error displayed since validating is false');

    await click('[data-test-submit]');
    assert.dom('[data-test-global-error]').hasText('something wrong', 'global error should be rendered');
    assert.dom('[data-test-error="apply-method"]').hasText(LINKEDIN_URL_ERROR);
    assert.dom('[data-test-error="simple-email"]').hasText(LINKEDIN_EMAIL_ERROR);
    assert.dom('input[name="simple-email"]').isFocused('the first invalid element should be focused');
    assert.notOk(this.onSubmit.called, 'submit callback stopped because form validation failed');

    // fix everything
    await fillIn('input[name="apply-method-value"]', 'https://www.google.com');
    assert.dom('[data-test-error="apply-method"]').doesNotExist();
    await fillIn('input[name="simple-email"]', 'bear@gmail.com');
    assert.dom('[data-test-error="simple-email"]').doesNotExist();

    await click('[data-test-submit]');
    assert.ok(this.onSubmit.called, 'submit callback went thru because form validation passed');
  });

  test('it validates the form but not focus on any field on mobile view', async function(assert) {
    this.applyMethod = { methodType: 'url', value: `${getEnvironmentHost()}/talent/post-a-job` };
    this.validateApplyMethod = validateApplyMethod;
    this.notLinkedinEmail = notLinkedinEmail;
    this.notMsEmail = notMsEmail;
    this.emailValue = 'bear@linkedin.com';
    sinon.stub(isMobileUtil, 'isMobile').returns(true);

    await render(hbs`
      {{#ember-ts-job-posting$shared/validator-container
        validating=false
        as |v|
      }}
        {{#unless v.isValid}}
          <p data-test-global-error>something wrong</p>
        {{/unless}}

        {{#v.validity
          validators=(array this.notLinkedinEmail this.notMsEmail)
          as |validity|
        }}
          {{simple-email-field
            required=true
            value=this.emailValue
            name="simple-email"
            onValidate=validity.validator
          }}
          {{#if validity.errorMessage}}
            <p id="abc3" data-test-error="simple-email">{{validity.errorMessage}}</p>
          {{/if}}
        {{/v.validity}}

        {{#v.validity
          validators=(array this.validateApplyMethod)
          as |validity|
        }}
          {{complex-input-field
            applyMethod=this.applyMethod
            describedById="abc3"
            validating=v.validating
            required=true
            onValidate=validity.validator
          }}
          {{#if validity.errorMessage}}
            <p id="abc3" data-test-error="apply-method">{{validity.errorMessage}}</p>
          {{/if}}
        {{/v.validity}}

        <button onClick={{action v.checkForm this.onSubmit}} data-test-submit>continue</button>
      {{/ember-ts-job-posting$shared/validator-container}}
    `);

    assert.dom('[data-test-validator-container]').exists();
    assert.dom('[data-test-error]').doesNotExist('No error displayed since validating is false');

    await click('[data-test-submit]');
    assert.dom('[data-test-global-error]').hasText('something wrong', 'global error should be rendered');
    assert.dom('[data-test-error="apply-method"]').hasText(LINKEDIN_URL_ERROR);
    assert.dom('[data-test-error="simple-email"]').hasText(LINKEDIN_EMAIL_ERROR);
    assert.dom('input[name="simple-email"]').isNotFocused('the first invalid element should not be focused');
    assert.dom('input[name="apply-method-value"]').isNotFocused('the second invalid element should not be focused');
    assert.notOk(this.onSubmit.called, 'submit callback stopped because form validation failed');
  });
});
