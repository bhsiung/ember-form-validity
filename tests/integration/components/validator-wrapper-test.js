import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, find, fillIn, settled } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

const LINKEDIN_EMAIL_ERROR = 'LINKEDIN_EMAIL_ERROR';
const LINKEDIN_URL_ERROR = 'LINKEDIN_URL_ERROR';
const MS_EMAIL_ERROR = 'MS_EMAIL_ERROR';
const NOT_EMPTY_ERROR = 'NOT_EMPTY_ERROR';

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

  return null;
}

function validateNotEmpty(value) {
  if (value.length === 0) {
    return {
      name: 'rich-text-editor',
      message: NOT_EMPTY_ERROR
    };
  }

  return null;
}

module('Integration | Component | shared/validator-wrapper', (hooks) => {
  setupRenderingTest(hooks);

  test('it validates contenteditable field', async function(assert) {
    this.validateNotEmpty = validateNotEmpty;
    this.value = '';
    this.validating = false;

    this.onchange = function() {
      this.set('value', document.querySelector('[name="rich-text-editor"]').textContent.trim());
    };

    await render(hbs`
      {{#validator-wrapper
        validators=(array this.validateNotEmpty)
        validating=this.validating
        as |validity|
      }}
       {{fake-input
          validating=this.validating
          onValidate=validity.validator
          value=this.value
          name="rich-text-editor"
          required=true
        }}
        {{#if validity.errorMessage}}
          <p data-test-error>{{validity.errorMessage}}</p>
        {{/if}}
      {{/validator-wrapper}}
    `);

    assert.dom('[data-test-error]').doesNotExist('since validating is false, no error rendered');
    assert
      .dom('[name="rich-text-editor"]')
      .hasAttribute('aria-invalid', 'true', 'the element is invalid due to no value on a required field');

    // set validating to true
    this.set('validating', true);
    assert
      .dom('[data-test-error]')
      .exists('display error message for empty value on required field (constraint violation)');

    // enter a value
    await fillIn('[name="rich-text-editor"]', '123');
    assert.dom('[data-test-error]').doesNotExist('display no error because it passed the validation');
    assert
      .dom('[name="rich-text-editor"]')
      .hasAttribute('aria-invalid', 'false', 'the element is valid since the value is not empty');
  });

  test('it validate simple input field', async function(assert) {
    this.notLinkedinEmail = notLinkedinEmail;
    this.notMsEmail = notMsEmail;
    this.value = '';
    this.validating = false;

    await render(hbs`
      {{#validator-wrapper
        validators=(array this.notLinkedinEmail this.notMsEmail)
        validating=this.validating
        as |validity|
      }}
        {{simple-email-field
          required=true
          value=this.value
          pattern=".+\.com"
          onValidate=validity.validator
          name="simple-email"
        }}
        {{#if validity.errorMessage}}
          <p data-test-error>{{validity.errorMessage}}</p>
        {{/if}}
      {{/validator-wrapper}}
    `);

    assert.dom('[data-test-error]').doesNotExist('since validating is false, no error rendered');
    assert.notOk(
      find('[data-test-input]').validity.valid,
      'the input element is invalid due to no value on a required field'
    );

    // set validating to true
    this.set('validating', true);
    assert
      .dom('[data-test-error]')
      .hasText(
        'Please fill out this field.',
        'display error message for empty value on required <input> field (constraint violation)'
      );

    // enter an something not email
    await fillIn('[data-test-input]', '456');
    assert
      .dom('[data-test-error]')
      .hasText('Please enter an email address.', 'display error message for not email (constraint violation)');
    assert.notOk(find('[data-test-input]').validity.valid, 'the input element is invalid due to violate email syntax');

    // enter an email violates pattern
    await fillIn('[data-test-input]', '123@linkedin.net');
    assert
      .dom('[data-test-error]')
      .hasText(
        'Please match the requested format.',
        'display error message for pattern mismatch (constraint violation)'
      );

    // enter an linkedin email
    await fillIn('[data-test-input]', '123@linkedin.com');
    assert
      .dom('[data-test-error]')
      .hasText(LINKEDIN_EMAIL_ERROR, 'display error message for linkedin email not allowed (custom violation)');
    assert.notOk(find('[data-test-input]').validity.valid, 'the input element is invalid due to violate email syntax');

    // enter ms email
    await fillIn('[data-test-input]', '123@microsoft.com');
    assert
      .dom('[data-test-error]')
      .hasText(MS_EMAIL_ERROR, 'display error message for microsoft email not allowed (custom violation)');
    assert.notOk(find('[data-test-input]').validity.valid, 'the input element is invalid due to violate email syntax');

    // enter some other email
    await fillIn('[data-test-input]', '123@gmail.com');
    assert.dom('[data-test-error]').doesNotExist('display no error because it passed the validation');
    assert.ok(find('[data-test-input]').validity.valid, 'the input element is valid');

    // invalidate the value from container level
    this.set('value', '789@linkedin.com');
    await settled();
    assert
      .dom('[data-test-error]')
      .hasText(LINKEDIN_EMAIL_ERROR, 'display error message for linkedin email not allowed (custom violation)');
    assert.notOk(find('[data-test-input]').validity.valid, 'the input element is invalid due to violate email syntax');
  });

  test('it validate against multiple input field', async function(assert) {
    // TODO @bhsiung describe -by cannot specify input
    this.applyMethod = { methodType: '', value: '' };
    this.validateApplyMethod = validateApplyMethod;
    this.validating = false;
    this.required = true;
    await render(hbs`
      {{#validator-wrapper
        validators=(array this.validateApplyMethod)
        validating=this.validating
        as |validity|
      }}
        {{complex-input-field
          applyMethod=this.applyMethod
          describedById="abc3"
          validating=validity.validating
          required=this.required
          onValidate=validity.validator
        }}
        {{#if validity.errorMessage}}
          <p id="abc3" data-test-error>{{validity.errorMessage}}</p>
        {{/if}}
      {{/validator-wrapper}}
    `);

    assert.dom('[data-test-error]').doesNotExist('since validating is false, no error rendered');

    // start validating
    this.set('validating', true);
    assert
      .dom('[data-test-error]')
      .hasText(
        'Please select an item in the list.',
        'require <select> field cannot be empty (value constrain validation)'
      );

    // update complex value from consumer side
    this.set('applyMethod.methodType', 'email');
    await settled();

    // user enter invalid email
    await fillIn('[name="apply-method-value"]', 'something invalid');
    assert
      .dom('[data-test-error]')
      .hasText('Please enter an email address.', 'require field cannot be empty (value constrain validation)');

    // user enter linedin email
    await fillIn('[name="apply-method-value"]', 'bb@linkedin.com');
    assert.dom('[data-test-error]').hasText(LINKEDIN_EMAIL_ERROR, 'linkedin email is not allowed (custom validation)');

    // user enter non-linkedin email
    await fillIn('[name="apply-method-value"]', 'bb@gmail.com');
    assert.dom('[data-test-error]').doesNotExist('email validation passed');

    // switch to url type (without update the value)
    await fillIn('[name="apply-method-type"]', 'url');
    assert
      .dom('[data-test-error]')
      .hasText('Please enter an URL.', 'display error message for not an URL (constraint violation)');

    // enter linkedin URL
    await fillIn('[name="apply-method-value"]', `/talent/post-a-job`);
    assert.dom('[data-test-error]').hasText(LINKEDIN_URL_ERROR, 'linkedin URL is not allowed (custom violation)');

    // enter non-linkedin URL
    await fillIn('[name="apply-method-value"]', 'https://www.google.com/');
    assert.dom('[data-test-error]').doesNotExist('email validation passed');
  });

  test('constraint validation works when tag name and attr defined case insensitively', async function(assert) {
    this.setProperties({
      tagName: 'INPUT',
      type: 'EMAIL',
      value: ''
    });
    await render(hbs`
      {{#validator-wrapper
        tagName=this.tagName
        type=this.type
        value=this.value
        validating=true
        as |validity|
      }}
        {{input-wrapper
          tagName=this.tagName
          type=this.type
          value=this.value
          required=true
          onValidate=validity.validator
        }}
        {{#if validity.errorMessage}}
          <p data-test-error>{{validity.errorMessage}}</p>
        {{/if}}
      {{/validator-wrapper}}
    `);

    assert
      .dom('[data-test-error]')
      .hasText(
        'Please fill out this field.',
        'display correct message when a required input has tagName defined in uppercase (`INPUT`)'
      );

    await fillIn('[data-test-input-wrapper]', 'aa');
    assert
      .dom('[data-test-error]')
      .hasText(
        'Please enter an email address.',
        'display correct message when input element with attribute of `type="EMAIL"`'
      );

    this.set('type', 'URL');
    await fillIn('[data-test-input-wrapper]', 'aab');
    assert
      .dom('[data-test-error]')
      .hasText('Please enter an URL.', 'display correct message when input element with attribute of `type="URL"`');
  });
});
