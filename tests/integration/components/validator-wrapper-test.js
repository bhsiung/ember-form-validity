import { module, skip, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, find, fillIn, settled } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

const LINKEDIN_EMAIL_ERROR = 'LINKEDIN_EMAIL_ERROR';
const LINKEDIN_URL_ERROR = 'LINKEDIN_URL_ERROR';
const MS_EMAIL_ERROR = 'MS_EMAIL_ERROR';
const NOT_EMPTY_ERROR = 'NOT_EMPTY_ERROR';

function notLinkedinEmail(value) {
  return /.+@linkedin\.com$/.test(value) ? LINKEDIN_EMAIL_ERROR : null;
}

function notMsEmail(value) {
  return /.+@microsoft\.com$/.test(value) ? MS_EMAIL_ERROR : null;
}

function validateApplyMethod({ methodType, value }) {
  if (methodType === 'email' && /^.+@linkedin.com$/.test(value)) {
    return {
      name: 'apply-method-value',
      message: LINKEDIN_EMAIL_ERROR,
    };
  } else if (methodType === 'url' && /^.+linkedin.com/.test(value)) {
    return {
      name: 'apply-method-value',
      message: LINKEDIN_URL_ERROR,
    };
  }

  return null;
}

function validateNotEmpty(value) {
  if (value.length === 0) {
    return {
      name: 'rich-text-editor',
      message: NOT_EMPTY_ERROR,
    };
  }

  return null;
}

module('Integration | Component | validator-wrapper', (hooks) => {
  setupRenderingTest(hooks);

  hooks.beforeEach(function beforeEach() {
    const that = this;
    this.onInput = function (e) {
      const element = e.target;
      that.set('value', element.value);
    };
  });
  skip('it validates contenteditable field', async function (assert) {
    this.validateNotEmpty = validateNotEmpty;
    this.value = '';
    this.validating = false;

    this.onchange = function () {
      this.set(
        'value',
        document.querySelector('[name="rich-text-editor"]').textContent.trim()
      );
    };

    await render(hbs`
      {{#validator-wrapper
        validators=(array this.validateNotEmpty)
        validating=this.validating
        value=this.value
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

    assert
      .dom('[data-test-error]')
      .doesNotExist('since validating is false, no error rendered');
    assert
      .dom('[name="rich-text-editor"]')
      .hasAttribute(
        'aria-invalid',
        'true',
        'the element is invalid due to no value on a required field'
      );

    // set validating to true
    this.set('validating', true);
    assert
      .dom('[data-test-error]')
      .exists(
        'display error message for empty value on required field (constraint violation)'
      );

    // enter a value
    await fillIn('[name="rich-text-editor"]', '123');
    assert
      .dom('[data-test-error]')
      .doesNotExist('display no error because it passed the validation');
    assert
      .dom('[name="rich-text-editor"]')
      .hasAttribute(
        'aria-invalid',
        'false',
        'the element is valid since the value is not empty'
      );
  });

  test('it validate simple input field', async function (assert) {
    this.notLinkedinEmail = notLinkedinEmail;
    this.notMsEmail = notMsEmail;
    this.value = '';
    this.validating = false;

    await render(hbs`
      {{#validator-wrapper
        validators=(array this.notLinkedinEmail this.notMsEmail)
        validating=this.validating
        value=this.value
        as |v|
      }}
        <input
          type="email"
          required
          name="simple-email"
          data-test-input
          value={{this.value}}
          onInput={{fn this.onInput}}
          pattern=".+\.com"
        />
        {{#if v.errorMessage}}
          <p data-test-error>{{v.errorMessage}}</p>
        {{/if}}
      {{/validator-wrapper}}
    `);

    assert
      .dom('[data-test-error]')
      .doesNotExist('since validating is false, no error rendered');
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
      .includesText(
        'email',
        'display error message for not email (constraint violation)'
      );
    assert.notOk(
      find('[data-test-input]').validity.valid,
      'the input element is invalid due to violate email syntax'
    );

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
      .hasText(
        LINKEDIN_EMAIL_ERROR,
        'display error message for linkedin email not allowed (custom violation)'
      );
    assert.notOk(
      find('[data-test-input]').validity.valid,
      'the input element is invalid due to violate email syntax'
    );

    // enter ms email
    await fillIn('[data-test-input]', '123@microsoft.com');
    assert
      .dom('[data-test-error]')
      .hasText(
        MS_EMAIL_ERROR,
        'display error message for microsoft email not allowed (custom violation)'
      );
    assert.notOk(
      find('[data-test-input]').validity.valid,
      'the input element is invalid due to violate email syntax'
    );

    // enter some other email
    await fillIn('[data-test-input]', '123@gmail.com');
    assert
      .dom('[data-test-error]')
      .doesNotExist('display no error because it passed the validation');
    assert.ok(
      find('[data-test-input]').validity.valid,
      'the input element is valid'
    );

    // invalidate the value from container level
    this.set('value', '789@linkedin.com');
    await settled();
    assert
      .dom('[data-test-error]')
      .hasText(
        LINKEDIN_EMAIL_ERROR,
        'display error message for linkedin email not allowed (custom violation)'
      );
    assert.notOk(
      find('[data-test-input]').validity.valid,
      'the input element is invalid due to violate email syntax'
    );
  });

  test('can handle multiple input', async function (assert) {
    assert.ok(1);
  });
  test('can handle async validator', async function (assert) {
    assert.ok(1);
  });
  test('constraint validation works when tag name and attr defined case insensitively', async function (assert) {
    this.setProperties({
      type: 'EMAIL',
      value: '',
    });
    await render(hbs`
      {{#validator-wrapper
        value=this.value
        validating=true
        value=this.value
        as |v|
      }}
        <input
          type={{this.type}}
          value={{this.value}}
          onInput={{fn this.onInput}}
          required
          data-test-input
        />
        {{#if v.errorMessage}}
          <p data-test-error>{{v.errorMessage}}</p>
        {{/if}}
      {{/validator-wrapper}}
    `);

    assert
      .dom('[data-test-error]')
      .hasText(
        'Please fill out this field.',
        'display correct message when a required input has tagName defined in uppercase (`INPUT`)'
      );

    await fillIn('[data-test-input]', 'aa');
    assert
      .dom('[data-test-error]')
      .includesText(
        'email',
        'display correct message when input element with attribute of `type="EMAIL"`'
      );

    this.set('type', 'URL');
    await fillIn('[data-test-input]', 'aab');
    assert
      .dom('[data-test-error]')
      .includesText(
        'URL',
        'display correct message when input element with attribute of `type="URL"`'
      );
  });
});
