import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { click, fillIn, find, render, settled } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import sinon from 'sinon';
import { defer, resolve } from 'rsvp';
import { getErrorFromElement } from 'dummy/utils/custom-error-message';
import { ValidationModel } from 'ember-form-validity/components/validator-wrapper';

declare interface InputEvent<T> {
  target: { value: T };
}
function notLinkedinEmail(model: ValidationModel) {
  return /.+@linkedin\.com$/.test(model.email as string)
    ? { email: 'LINKEDIN_EMAIL_ERROR' }
    : {};
}

function notMsEmail(model: ValidationModel) {
  return /.+@microsoft\.com$/.test(model.email as string)
    ? { email: 'MS_EMAIL_ERROR' }
    : {};
}

module('Integration | Component | validator-wrapper', (hooks) => {
  setupRenderingTest(hooks);
  const onWrapperValidate = sinon.stub();

  hooks.beforeEach(function beforeEach() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this;
    this.set('getCustomError', getErrorFromElement);
    this.set('onInput', function (e: InputEvent<string>) {
      const element = e.target;
      that.set('model.email', element.value);
    });
    this.set('onInput2', function (e: InputEvent<string>) {
      const element = e.target;
      that.set('model.field2', element.value);
    });
    this.set('onInput3', function (e: InputEvent<string>) {
      const element = e.target;
      that.set('model.feedback', element.value);
    });
    this.set('onWrapperValidate', onWrapperValidate);
  });

  test('it validates contenteditable field', async function (assert) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this;
    this.setProperties({
      values: ['', 'abc', 'foo', 'bar'],
      selectedValue: '',
      isRequire: function ({ value }: { value: unknown }) {
        return {
          value: value ? null : 'value is required',
        };
      },
      onChange: function (newValue: unknown) {
        that.set('selectedValue', newValue);
      },
    });

    await render(hbs`
      <ValidatorWrapper
        data-test-attr="foo"
        class="test-class"
        @validator={{this.isRequire}}
        @validating={{true}}
        @model={{hash value=this.selectedValue}}
        @onWrapperValidate={{this.onWrapperValidate}}
        @registerId={{this.registerId}}
        as |v|>
        <FakeRadioButton @selectedValue={{this.selectedValue}} @values={{this.values}} @onChange={{this.onChange}} />
        {{#if v.errorMessage.value}}
          <p data-test-error>{{v.errorMessage.value}}</p>
        {{else}}
        ok
        {{/if}}
      </ValidatorWrapper>
    `);

    assert.dom('[data-test-error]').exists('the error message displays');
    assert
      .dom('[contenteditable]')
      .hasAttribute(
        'aria-invalid',
        'true',
        'the element is invalid due to no value on a required field'
      );

    this.set('selectedValue', 'foo');
    await settled();
    assert
      .dom('[data-test-error]')
      .doesNotExist('the error message does not display');
    assert
      .dom('[contenteditable]')
      .hasAttribute(
        'aria-invalid',
        'false',
        'the element is no longer invalid when doc has content'
      );
    await settled();
  });

  test('it validate simple input field', async function (assert) {
    this.setProperties({
      registerId: sinon.stub().returns(1),
      notLinkedinEmail: notLinkedinEmail,
      notMsEmail: notMsEmail,
      model: { email: '' },
      validating: false,
    });

    await render(hbs`
      <ValidatorWrapper
        data-test-attr="foo"
        class="test-class"
        @validator={{array this.notLinkedinEmail this.notMsEmail}}
        @validating={{this.validating}}
        @model={{hash email=this.model.email}}
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
      .dom('[data-test-validator-wrapper]')
      .hasClass('test-class', 'the class name is forwarded');
    assert
      .dom('[data-test-validator-wrapper]')
      .hasAttribute(
        'data-test-attr',
        'foo',
        'the data-test attribute is forwarded'
      );
    assert
      .dom('[data-test-error]')
      .doesNotExist('since validating is false, no error rendered');
    assert.notOk(
      (find('[data-test-input]') as HTMLInputElement).validity.valid,
      'the input element is invalid due to no value on a required field'
    );
    assert.ok(
      onWrapperValidate.calledWithExactly(1, false),
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
      (find('[data-test-input]') as HTMLInputElement).validity.valid,
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
      (find('[data-test-input]') as HTMLInputElement).validity.valid,
      'the input element is invalid when the email address is from microsoft (custom violation)'
    );

    // enter some other email
    await fillIn('[data-test-input]', '123@gmail.com');
    assert
      .dom('[data-test-error]')
      .doesNotExist('display no error when the email is valid');
    assert.ok(
      (find('[data-test-input]') as HTMLInputElement).validity.valid,
      'the input element is valid'
    );
    assert.ok(
      onWrapperValidate.calledWithExactly(1, true),
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
    assert.strictEqual(
      onWrapperValidate.args.length,
      7,
      'validation has been called 7 times'
    );
  });

  test('it validates a textarea element', async function (assert) {
    this.setProperties({
      registerId: sinon.stub().returns(1),
      model: { feedback: '' },
      validating: false,
    });

    await render(hbs`
      <ValidatorWrapper
        data-test-attr="foo"
        @validating={{this.validating}}
        @model={{hash feedback=this.model.feedback}}
        @onWrapperValidate={{this.onWrapperValidate}}
        @registerId={{this.registerId}}
        as |v|>
        <textarea
          name="feedback"
          rows="5"
          cols="30"
          minlength="10"
          maxlength="20"
          value={{this.model.feedback}}
          required
          {{on "input" this.onInput3}}
          data-test-textarea
        >
          Write something here…
        </textarea>
        {{#if v.errorMessage.feedback}}
          <p data-test-error>{{v.errorMessage.feedback}}</p>
        {{/if}}
      </ValidatorWrapper>
    `);

    assert
      .dom('[data-test-error]')
      .doesNotExist('since validating is false, no error rendered');
    assert.notOk(
      (find('[data-test-textarea]') as HTMLTextAreaElement).validity.valid,
      'the textarea element is invalid due to no value on a required field'
    );
    assert.ok(
      onWrapperValidate.calledWithExactly(1, false),
      'the validation failure event has been delegate to the container level'
    );

    // set validating to true
    this.set('validating', true);
    assert
      .dom('[data-test-error]')
      .hasText(
        'Please fill out this field.',
        'display error message for empty value on required <textarea> field (constraint violation)'
      );

    // enter text that's too short
    await fillIn('[data-test-textarea]', 'hello');

    await this.pauseTest()

    assert
      .dom('[data-test-error]')
      .includesText(
        'Please lengthen this text to 10 characters or more',
        'displays an error message for text being too short (constraint violation)'
      );
    assert.notOk(
      (find('[data-test-textarea]') as HTMLTextAreaElement).validity.valid,
      'the textarea element is invalid due to violation of the text length [minlength="10"]'
    );

    // enter a valid text
    await fillIn('[data-test-textarea]', 'This is perfect length');
    assert
      .dom('[data-test-error]')
      .doesNotExist('display no error when the text is valid');
    assert.ok(
      (find('[data-test-textarea]') as HTMLTextAreaElement).validity.valid,
      'the textarea element is valid'
    );
    assert.ok(
      onWrapperValidate.calledWithExactly(1, true),
      'the validation success event has been delegate to the container level'
    );

    assert.strictEqual(
      onWrapperValidate.args.length,
      7,
      'validation has been called 7 times'
    );
  });

  test('can handle multiple input', async function (assert) {
    const model = { email: '', field2: '' };
    this.setProperties({
      model,
      customValidator: function customValidator({
        email,
        field2,
      }: {
        email: string;
        field2: string;
      }) {
        return {
          email: /invalid/.test(email) ? 'CUSTOM_VALIDATION_ERROR_EMAIL' : '',
          field2: field2 === 'invalid' ? 'CUSTOM_VALIDATION_ERROR_FIELD2' : '',
        };
      },
    });

    await render(hbs`
      <ValidatorWrapper
        @validator={{this.customValidator}}
        @validating={{true}}
        @model={{hash email=this.model.email field2=this.model.field2}}
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
    this.set('model', { ...model, email: 'valid@foo.com' });
    await settled();
    assert
      .dom('[data-test-error-email]')
      .doesNotExist(
        'validation error removed on email field after external change'
      );
    this.set('model', { ...model, field2: 'foo' });
    await settled();
    assert
      .dom('[data-test-error-field2]')
      .doesNotExist('validation error removed on field2 after external change');
  });

  test('it warns when custom validator returns mismatch format', async function (assert) {
    const model = { data: 1 };
    const customValidator = function customValidator({
      data,
    }: {
      data: number;
    }) {
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
    this.setProperties({ model, customValidator });

    await render(hbs`
      <ValidatorWrapper
        @validator={{this.customValidator}}
        @validating={{true}}
        @model={{hash data=this.model.data}}
        as |v|
      >
        <input name="data" value={{this.model.data}} />
        {{#if v.errorMessage.data}}
          <p data-test-error>{{v.errorMessage.data}}</p>
        {{/if}}
      </ValidatorWrapper>
    `);

    assert.dom('[data-test-error]').doesNotExist();
    this.set('model', { ...model, data: 2 });
    await settled();
    assert.dom('[data-test-error]').doesNotExist();
    this.set('model', { ...model, data: 3 });
    await settled();
    assert.dom('[data-test-error]').doesNotExist();
    this.set('model', { ...model, data: 4 });
    await settled();
    assert.dom('[data-test-error]').doesNotExist();
    this.set('model', { ...model, data: 5 });
    await settled();
    assert.dom('[data-test-error]').hasText('error');
    this.set('model', { ...model, data: 6 });
    await settled();
    assert.dom('[data-test-error]').doesNotExist();
  });

  test('can validate when external prop change', async function (assert) {
    let model = { email: '', field2: false };
    const customValidator = function ({
      email,
      field2,
    }: {
      email: string;
      field2: string;
    }) {
      if (/invalid/.test(email)) {
        return { email: 'CUSTOM_VALIDATION_ERROR_EMAIL1' };
      } else if (!field2) {
        return { email: 'CUSTOM_VALIDATION_ERROR_EMAIL2' };
      }
      return {};
    };
    this.setProperties({ model, customValidator });

    await render(hbs`
      <ValidatorWrapper
        @validator={{this.customValidator}}
        @validating={{true}}
        @model={{hash email=this.model.email field2=this.model.field2}}
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

    model = this.set('model', { ...model, email: 'valid' });
    await settled();
    assert
      .dom('[data-test-error-email]')
      .hasText(
        'CUSTOM_VALIDATION_ERROR_EMAIL2',
        'second customValidator triggered'
      );
    model = this.set('model', { ...model, field2: true });
    await settled();
    assert
      .dom('[data-test-error-email]')
      .doesNotExist('validation error removed');
  });

  test('can handle async validator', async function (assert) {
    const deferred1 = defer();
    const deferred2 = defer();
    const deferred3 = defer();
    const model = { email: 'invalid@gmail.com' };
    const showForm = true;
    const customValidator = async function ({ email }: { email: string }) {
      if (/^invalid/.test(email)) {
        await deferred1.promise;
        return { email: 'ASYNC_VALIDATION_ERROR' };
      } else if (/^valid/.test(email)) {
        await deferred2.promise;
        return { email: '' };
      } else if (/^for-debunce/.test(email)) {
        await resolve({ email: '' });
        return {};
      }
      await deferred3.promise;
      return {};
    };
    const spiedCustomValidator = sinon.spy(customValidator);
    this.setProperties({
      model,
      showForm,
      customValidator: spiedCustomValidator,
    });

    await render(hbs`
      {{#if this.showForm}}
        <ValidatorWrapper
          @validator={{this.customValidator}}
          @validating={{true}}
          @model={{hash email=this.model.email}}
          as |v|
        >
          <input
            type="email"
            name="email"
            data-test-email
            value={{this.model.email}}
            onInput={{this.onInput}}
            required
          />
          {{#if v.loading}}
            <p data-test-loading>loading for validation</p>
          {{else if v.errorMessage.email}}
            <p data-test-error>{{v.errorMessage.email}}</p>
          {{/if}}
        </ValidatorWrapper>
      {{/if}}
    `);
    assert
      .dom('[data-test-loading]')
      .exists('validation loading indicator should be appear while loading');

    deferred1.resolve();
    await settled();
    assert
      .dom('[data-test-error]')
      .exists('error unfold when validation resolve');

    await fillIn('[data-test-email]', '');
    assert
      .dom('[data-test-error]')
      .containsText('fill', 'assert contextual validation is still performed');

    await fillIn('[data-test-email]', 'valid@gmail.com');
    assert
      .dom('[data-test-loading]')
      .exists('validation loading indicator should be appear while loading');
    deferred2.resolve();
    await settled();
    assert
      .dom('[data-test-loading]')
      .doesNotExist(
        'validation loading indicator should be hidden after user fix the error'
      );
    assert
      .dom('[data-test-error]')
      .doesNotExist(
        'validation error should be hidden after user fix the error'
      );
    deferred3.resolve();
    // assert debounce worked
    spiedCustomValidator.resetHistory();
    fillIn('[data-test-email]', 'for-debunce1@gmail.com');
    fillIn('[data-test-email]', 'for-debunce2@gmail.com');
    fillIn('[data-test-email]', 'for-debunce3@gmail.com');
    await fillIn('[data-test-email]', 'for-debunce4@gmail.com');
    assert.ok(
      spiedCustomValidator.calledOnceWithExactly({
        email: 'for-debunce4@gmail.com',
      }),
      'to avoid performance issue, debouce is implemented implicitly, only the last call is invoked'
    );
    // assert the async callback will be no-op when the component is destroyed
    await fillIn('[data-test-email]', 'other@gmail.com');
    this.set('showForm', false);
    deferred3.resolve();

    await settled();
  });

  test('constraint validation works when tag name and attr defined case insensitively', async function (assert) {
    this.setProperties({
      type: 'EMAIL',
      model: { email: '' },
    });
    await render(hbs`
      <ValidatorWrapper
        @model={{hash email=this.model.email}}
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

  test('customize error for constraint violation', async function (assert) {
    const onChangeDate = (e: InputEvent<string>) => {
      this.set('date', e.target.value);
    };
    const onChangeUrl = (e: InputEvent<string>) => {
      this.set('url', e.target.value);
    };
    this.setProperties({
      date: '',
      url: 'wrong url',
      onChangeDate,
      onChangeUrl,
    });
    await render(hbs`
      <ValidatorWrapper
        @model={{hash date=this.date url=this.url}}
        @validating={{true}}
        @customErrorFactory={{this.getCustomError}}
        as |v|
      >
        <input
          type="month"
          value={{this.date}}
          onInput={{this.onChangeDate}}
          required
          step="2"
          max="2021-09"
          min="2020-01"
          name="date"
          data-test-input="date"
        />
        {{#if v.errorMessage.date}}
          <p data-test-error="date">{{v.errorMessage.date}}</p>
        {{/if}}

        <input
          type="url"
          value={{this.url}}
          onInput={{this.onChangeUrl}}
          pattern="http:.*"
          maxlength="20"
          minlength="10"
          name="url"
          data-test-input="url"
        />
        {{#if v.errorMessage.url}}
          <p data-test-error="url">{{v.errorMessage.url}}</p>
        {{/if}}
      </ValidatorWrapper>
    `);

    // valueMissing
    assert
      .dom('[data-test-error="date"]')
      .hasText(
        'VALUE_MISSING',
        'it errors out when the date value is missing where is required'
      );

    // rangeOverflow
    await fillIn('[data-test-input="date"]', '2021-10');
    assert
      .dom('[data-test-error="date"]')
      .hasText(
        'VALUE_TOO_MUCH',
        '2021-10 is greater than the max value, which is set to 2021-09'
      );

    // rangeUnderflow
    await fillIn('[data-test-input="date"]', '2019-12');
    assert
      .dom('[data-test-error="date"]')
      .hasText(
        'VALUE_TOO_LOW',
        '2019-12 is too low where the minimum is set at 2020-01'
      );

    // stepMismatch
    await fillIn('[data-test-input="date"]', '2021-06');
    assert
      .dom('[data-test-error="date"]')
      .hasText(
        'VALUE_MISMATCH_STEP',
        'as step is set at 2, which means it every other month is sligible from 2020-01 (min)'
      );

    // date passs
    await fillIn('[data-test-input="date"]', '2021-07');
    assert
      .dom('[data-test-error="date"]')
      .doesNotExist(
        'error message for date dismisses when the value is correct'
      );

    // typeMismatch
    assert
      .dom('[data-test-error="url"]')
      .hasText(
        'TYPE_MISMATCH',
        'display correct message when input element with attribute of `type="EMAIL"`'
      );

    // patternMismatch
    await fillIn('[data-test-input="url"]', 'https://xxx.com');
    assert
      .dom('[data-test-error="url"]')
      .hasText('PATTERN_MISMATCH', 'it errors out when pattern mismatch');
  });

  test('it can validate if the downstream component is lazy', async function (assert) {
    const registerId = sinon.stub().returns(1);
    const model = { email: '', isLoading: true };
    const deferred = defer();
    deferred.promise.then(() => {
      this.set('model.isLoading', false);
    });
    this.setProperties({ registerId, model });

    await render(hbs`
      <ValidatorWrapper
        data-test-attr="foo"
        class="test-class"
        @validating={{true}}
        @model={{hash email=this.model.email isLoading=this.model.isLoading}}
        @onWrapperValidate={{this.onWrapperValidate}}
        @registerId={{this.registerId}}
        as |v|>
        {{#unless this.model.isLoading}}
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
        {{/unless}}
      </ValidatorWrapper>
    `);

    assert.dom('[data-test-input]').doesNotExist('the input is not rendered');
    deferred.resolve();
    await settled();
    assert
      .dom('[data-test-input]')
      .exists('the input is rendered after defer resolved');
    assert
      .dom('[data-test-error]')
      .exists('the validation error is rendered after defer resolved');
  });
});
