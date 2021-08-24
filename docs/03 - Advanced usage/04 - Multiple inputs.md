# Related inputs

There are chances that more than one `<input>` elements need to be held within one `<ValidityWrapper>` because it may be how the downstream component designed. For that, the API allows a `model` argument carries a `HASH`, with data structure of key-pair, where the `key` represents the `name` attribute of the associated `<input>` (or `<select>`) element.

```hbs
<ValidatorContainer as |v|>
  <v.validity
    @validator={{this.customValidator}}
    @model={{hash method=this.method value=this.value}}
    as |validity|
  >
    <h3>Method:</h3>
    <input
      name="method"
      type="radio"
      value="email"
      id="method-email"
      required
      {{on "input" this.onChangeMethod}}
      checked={{eq this.method "email"}}
    />
    <label for="method-email">e-mail</label>
    <input
      name="method"
      type="radio"
      value="url"
      id="method-url"
      required
      {{on "input" this.onChangeMethod}}
      checked={{eq this.method "url"}}
    />
    <label for="method-url">URL</label>
    {{#if validity.errorMessage.method}}
      <p data-test-error>{{validity.errorMessage.method}}</p>
    {{/if}}

    <h3>Value:</h3>
    <input
      autocomplete="noop"
      type={{this.method}}
      name="value"
      data-test-value
      value={{this.value}}
      required
      {{on 'input' this.onChangeValue}}
    />
    {{#if validity.errorMessage.value}}
      <p data-test-error>{{validity.errorMessage.value}}</p>
    {{/if}}
  </v.validity>
  <p>
    <button disabled={{not v.isValid}} {{on 'click' (fn v.checkForm this.onSubmit)}}>
      save
    </button>
  </p>
</ValidatorContainer>
```
In this example, the form consists of 2 fields-- `method` and `value`, to represent a communication channel. However, we have done a couple of things to make it work:
- employ `method` and `value` as the key in the `model` object passed into `v.validity`
- decorate `name` attribute of input fields, using `method` and `value`
- In order to convey the error state separately, the `validity.errorMessage` holds error message for both of them with the same key pair

Underneath, the library uses the `name` to locate the corresponding DOM element to collect constraint validation error or set custom error perceived from custom validator

The example dynamically update `type` attribute of input with `name="value"` in order to leverage the constraint validation result from browser. We also created a custom validation in case any specific business logic is involved.

```js
@action
customValidator({ value, method }) {
  return {
    value: /invalid/.test(value)
      ? 'CUSTOM_VALIDATION_ERROR1'
      : method === 'url' && /\.com/.test(value)
      ? ''
      : 'CUSTOM_VALIDATION_ERROR2',
    method: '',
  };
}
```

The custom validator is expecting `model` to be passed, implementing to rules:
1. For any method kind, the value cannot include keyword of `invalid`
2. When the `method` is `url`, it needs to include the keyword of `.com`
