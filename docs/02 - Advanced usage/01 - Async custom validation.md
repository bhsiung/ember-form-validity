# Validate custom function asynchronously

It is very common for business logic to perform validation on the server side dynamically.
For certain case, simply define the custom validator function as `async` and invoke `AJAX` there.
The wrapper will collect the error just like the synchronous ones.

The following example instruments a custom validation which execute asynchronously,
an error message will display with value starting with `invalid` (e.g. `invalid@gmail.com`)

```hbs
<ValidatorContainer as |v|>
  <v.validity
    @validator={{this.customValidator}}
    @model={{hash email=this.email}}
    as |validity|
  >
    <input
      placeholder="username@email.com"
      autocomplete="off"
      type="email"
      name="email"
      data-test-email
      value={{this.email}}
      required
      {{on 'input' this.onInput}}
    />
    {{#if validity.loading}}
      <p data-test-loading>loading for validation</p>
    {{else if validity.errorMessage.email}}
      <p data-test-error>{{validity.errorMessage.email}}</p>
    {{/if}}
  </v.validity>
  <p>
    <button
      disabled={{not v.isValid}}
      {{on 'click' (fn v.checkForm this.onSubmit)}}
    >
      save
    </button>
  </p>
</ValidatorContainer>
```
```
@action
async customValidator({ email }) {
  return new Promise((resolve, reject) => {
    if (/^invalid/.test(email)) {
      later(null, () => resolve({ email: 'ASYNC_VALIDATION_ERROR' }), 1000);
    } else {
      later(null, () => resolve({ email: '' }), 1000);
    }
  });
}
```
While waiting for the async function to return, we did 2 things help you to manage the form state
- `isValid` in the form level (`ValidatorContainer`) is set to `false`, it can be used to prevent the user submitting the form while waiting for the validation result
- `loading` in the wrapper level (`validity`) is set to true, it can be used to toggle the loading spinner.
