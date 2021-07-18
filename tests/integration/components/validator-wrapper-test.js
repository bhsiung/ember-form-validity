import { module, skip, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { click, fillIn, find, render, settled } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import EmberDebugger from '@ember/debug';
import {
  MALFORMED_CUSTOM_VALIDATOR_RETURN,
  VALIDATOR_ERROR_MISMATCH_ELEMENT_NAME,
} from 'ember-form-validation/constants/warning-id';

const NOT_EMPTY_ERROR = 'NOT_EMPTY_ERROR';

function notLinkedinEmail(model) {
  return /.+@linkedin\.com$/.test(model.email)
    ? { email: 'LINKEDIN_EMAIL_ERROR' }
    : {};
}

function notMsEmail(model) {
  return /.+@microsoft\.com$/.test(model.email)
    ? { email: 'MS_EMAIL_ERROR' }
    : {};
}

function validateNotEmpty(model) {
  if (model['rich-text-editor'].length === 0) {
    return {
      'rich-text-editor': NOT_EMPTY_ERROR,
    };
  }

  return {};
}

module('Integration | Component | validator-wrapper', (hooks) => {
  setupRenderingTest(hooks);

  hooks.beforeEach(function beforeEach() {
    const that = this;
    this.onInput = function (e) {
      const element = e.target;
      that.set('model', { ...that.model, email: element.value });
    };
    this.onInput2 = function (e) {
      const element = e.target;
      that.set('model', { ...that.model, field2: element.value });
    };
    this.onWrapperValidate = sinon.stub();
  });

  skip('it validates contenteditable field', async function (assert) {
    // TODO bear
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
      <ValidatorWrapper
        @validators={{array this.validateNotEmpty}}
        @validating={{this.validating}}
        @model={{this.value}}
        as |validity|
      >
        {{fake-input
          onValidate=validity.validator
          value=this.value
          name="rich-text-editor"
          required=true
        }}
        {{#if (get v.errorMessage "rich-text-editor")}}
          <p data-test-error>{{(get v.errorMessage "simple-email")}}</p>
        {{/if}}
      </ValidatorWrapper>
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
    this.registerId = sinon.stub().returns(1);
    this.notLinkedinEmail = notLinkedinEmail;
    this.notMsEmail = notMsEmail;
    this.model = { email: '' };
    this.validating = false;

    await render(hbs`
      <ValidatorWrapper
        @validators={{array this.notLinkedinEmail this.notMsEmail}}
        @validating={{this.validating}}
        @model={{this.model}}
        @onWrapperValidate={{this.onWrapperValidate}}
        @registerId={{this.registerId}}
        as |v|>
        <input
          type="email"
          required
          name="email"
          data-test-input
          value={{this.model.email}}
          {{on "input" this.onInput}}
          pattern=".+\.com"
        />
        {{#if v.errorMessage.email}}
          <p data-test-error>{{v.errorMessage.email}}</p>
        {{/if}}
      </ValidatorWrapper>
    `);

    assert
      .dom('[data-test-error]')
      .doesNotExist('since validating is false, no error rendered');
    assert.notOk(
      find('[data-test-input]').validity.valid,
      'the input element is invalid due to no value on a required field'
    );
    assert.ok(
      this.onWrapperValidate.calledWithExactly(1, false),
      'the validation failure event has been delegate to the container level'
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
      'the input element is invalid due to violate [type=email]'
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
        'LINKEDIN_EMAIL_ERROR',
        'display error message when the email address is from linkedin (custom violation)'
      );

    // enter ms email
    await fillIn('[data-test-input]', '123@microsoft.com');
    assert
      .dom('[data-test-error]')
      .hasText(
        'MS_EMAIL_ERROR',
        'display error message when the email address is from microsoft (custom violation)'
      );
    assert.notOk(
      find('[data-test-input]').validity.valid,
      'the input element is invalid when the email address is from microsoft (custom violation)'
    );

    // enter some other email
    await fillIn('[data-test-input]', '123@gmail.com');
    assert
      .dom('[data-test-error]')
      .doesNotExist('display no error when the email is valid');
    assert.ok(
      find('[data-test-input]').validity.valid,
      'the input element is valid'
    );
    assert.ok(
      this.onWrapperValidate.calledWithExactly(1, true),
      'the validation success event has been delegate to the container level'
    );

    // invalidate the value from container level
    this.set('model', { email: '789@linkedin.com' });
    await settled();
    assert
      .dom('[data-test-error]')
      .hasText(
        'LINKEDIN_EMAIL_ERROR',
        'display error message for linkedin email not allowed (model update)(custom violation)'
      );
    assert.equal(
      this.onWrapperValidate.args.length,
      7,
      'validation has been called 7 times'
    );
  });

  test('can handle multiple input', async function (assert) {
    this.model = { email: '', field2: '' };
    this.customValidator = function customValidator({ email, field2 }) {
      return {
        email: /invalid/.test(email) ? 'CUSTOM_VALIDATION_ERROR_EMAIL' : '',
        field2: field2 === 'invalid' ? 'CUSTOM_VALIDATION_ERROR_FIELD2' : '',
      };
    };

    await render(hbs`
      <ValidatorWrapper
        @validator={{this.customValidator}}
        @validating={{true}}
        @model={{this.model}}
        as |v|
      >
        <input
          type="email"
          name="email"
          data-test-email
          value={{this.model.email}}
          onInput={{this.onInput}}
          pattern=".+\.com"
          required
        />
        {{#if v.errorMessage.email}}
          <p data-test-error-email>{{v.errorMessage.email}}</p>
        {{/if}}

        <fieldset name="gender-set" {{on "input" this.onInput2}}>
          <input id="field2-bar" type="radio" name="field2" value="bar" checked={{eq this.model.field2 "bar"}} required />
          <label for="field2-bar">bar</label>
          <input id="field2-foo" type="radio" name="field2" value="foo" checked={{eq this.model.field2 "foo"}} required />
          <label for="field2-foo">foo</label>
          <input id="field2-invalid" type="radio" name="field2" value="invalid" checked={{eq this.model.field2 "invalid"}} required />
          <label for="field2-invalid">The wrong one</label>
        </fieldset>
        {{#if v.errorMessage.field2}}
          <p data-test-error-field2>{{v.errorMessage.field2}}</p>
        {{/if}}
      </ValidatorWrapper>
    `);
    // 1. eager validation phase
    assert
      .dom('[data-test-error-email]')
      .containsText(
        'fill',
        'initial validation applied on email field (constraint validation)'
      );
    assert
      .dom('[data-test-error-field2]')
      .containsText(
        'select',
        'initial validation applied on field2 (constraint validation)'
      );

    // 2. user input
    await fillIn('[name="email"]', 'invalid@gmail.com');
    assert
      .dom('[data-test-error-email]')
      .hasText(
        'CUSTOM_VALIDATION_ERROR_EMAIL',
        'customValidator triggered on email field after user input'
      );
    await click('[name="field2"][value="invalid"]');
    assert
      .dom('[data-test-error-field2]')
      .hasText(
        'CUSTOM_VALIDATION_ERROR_FIELD2',
        'customValidator triggered on field2 after user input'
      );

    // 3. external change
    this.set('model', { ...this.model, email: 'valid@foo.com' });
    assert
      .dom('[data-test-error-email]')
      .doesNotExist(
        'validation error removed on email field after external change'
      );
    this.set('model', { ...this.model, field2: 'foo' });
    assert
      .dom('[data-test-error-field2]')
      .doesNotExist('validation error removed on field2 after external change');
  });

  test('it warns when custom validator returns mismatch format', async function (assert) {
    const warnSpy = sinon.stub(EmberDebugger, 'warn');
    this.model = { data: 1 };
    this.customValidator = function customValidator({ data }) {
      if (data === 1) {
        return 'error';
      } else if (data === 2) {
        return { data: { msg: 'error' } };
      } else if (data === 3) {
        return { data: ['error'] };
      } else if (data === 4) {
        return { email: 'error' };
      } else if (data === 5) {
        return { data: 'error' };
      }
      return {};
    };

    await render(hbs`
      <ValidatorWrapper
        @validator={{this.customValidator}}
        @validating={{true}}
        @model={{this.model}}
        as |v|
      >
        <input name="data" value={{this.model.data}} />
        {{#if v.errorMessage.data}}
          <p data-test-error>{{v.errorMessage.data}}</p>
        {{/if}}
      </ValidatorWrapper>
    `);

    assert.ok(
      warnSpy.calledWithMatch('error', false, {
        id: MALFORMED_CUSTOM_VALIDATOR_RETURN,
      }),
      'warn for invalid format'
    );
    assert.dom('[data-test-error]').doesNotExist();
    this.set('model', { ...this.model, data: 2 });
    assert.dom('[data-test-error]').doesNotExist();
    this.set('model', { ...this.model, data: 3 });
    assert.dom('[data-test-error]').doesNotExist();
    this.set('model', { ...this.model, data: 4 });
    assert.dom('[data-test-error]').doesNotExist();
    this.set('model', { ...this.model, data: 5 });
    assert.dom('[data-test-error]').hasText('error');
    this.set('model', { ...this.model, data: 6 });
    assert.dom('[data-test-error]').doesNotExist();
    assert.equal(
      warnSpy.args.filter((e) => e[2].id === MALFORMED_CUSTOM_VALIDATOR_RETURN)
        .length,
      3,
      'warn for invalid format for 3 times'
    );
    assert.equal(
      warnSpy.args.filter((e) => e[2].id === MALFORMED_CUSTOM_VALIDATOR_RETURN)
        .length,
      3,
      'warn for invalid format for 3 times'
    );
    assert.equal(
      warnSpy.args.filter(
        (e) => e[2].id === VALIDATOR_ERROR_MISMATCH_ELEMENT_NAME
      ).length,
      1,
      'warn for discrepant key to input name once'
    );
  });

  test('can validate when external prop change', async function (assert) {
    this.model = { email: '', field2: false };
    this.customValidator = function customValidator({ email, field2 }) {
      if (/invalid/.test(email)) {
        return { email: 'CUSTOM_VALIDATION_ERROR_EMAIL1' };
      } else if (!field2) {
        return { email: 'CUSTOM_VALIDATION_ERROR_EMAIL2' };
      }
    };

    await render(hbs`
      <ValidatorWrapper
        @validator={{this.customValidator}}
        @validating={{true}}
        @model={{this.model}}
        as |v|
      >
        <input
          name="email"
          data-test-email
          value={{this.model.email}}
          onInput={{this.onInput}}
          required
        />
        {{#if v.errorMessage.email}}
          <p data-test-error-email>{{v.errorMessage.email}}</p>
        {{/if}}
      </ValidatorWrapper>
    `);

    assert
      .dom('[data-test-error-email]')
      .exists('expect the initial error message from `required` attribute');
    await fillIn('[name="email"]', 'invalid');
    assert
      .dom('[data-test-error-email]')
      .hasText(
        'CUSTOM_VALIDATION_ERROR_EMAIL1',
        'customValidator triggered on email field after user input'
      );

    this.set('model', { ...this.model, email: 'valid' });
    assert
      .dom('[data-test-error-email]')
      .hasText(
        'CUSTOM_VALIDATION_ERROR_EMAIL2',
        'second customValidator triggered'
      );
    this.set('model', { ...this.model, field2: true });
    assert
      .dom('[data-test-error-email]')
      .doesNotExist('validation error removed');
  });

  test('can handle async validator', async function (assert) {
    // TODO bear
    assert.ok(1);
  });

  test('constraint validation works when tag name and attr defined case insensitively', async function (assert) {
    this.setProperties({
      type: 'EMAIL',
      model: { email: '' },
    });
    await render(hbs`
      <ValidatorWrapper
        @model={{this.model}}
        @validating={{true}}
        as |v|
      >
        <input
          type={{this.type}}
          value={{this.model.email}}
          onInput={{this.onInput}}
          required
          data-test-input
          name="email"
        />
        {{#if v.errorMessage}}
          <p data-test-error>{{v.errorMessage.email}}</p>
        {{/if}}
      </ValidatorWrapper>
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
